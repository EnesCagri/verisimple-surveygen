import { useCallback, useRef, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Question, ConditionalRule } from '../types/survey';
import { buildSystemPrompt } from '../utils/aiPrompt';
import {
  parseAIResponse,
  executeAIActions,
  type SurveyMutators,
  type AIAction,
} from '../utils/aiActions';

// ── Types ──

/** Snapshot of survey state before AI action was applied */
export interface StateSnapshot {
  title: string;
  questions: Question[];
  conditions: ConditionalRule[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  /** Number of actions applied (only for AI messages) */
  appliedCount?: number;
  /** Errors encountered while applying actions */
  errors?: string[];
  timestamp: number;
  /** Undo state: pending = user hasn't decided, kept = user accepted, undone = user reverted */
  undoState?: 'pending' | 'kept' | 'undone';
  /** Snapshot of the state *before* AI actions were applied (used for undo) */
  snapshot?: StateSnapshot;
  /** AI actions that were applied (used for redo) */
  aiActions?: AIAction[];
}

interface UseAIChatOptions {
  /** Live getters for current survey state */
  getQuestions: () => Question[];
  getConditions: () => ConditionalRule[];
  getTitle: () => string;
  /** Mutators to apply AI actions */
  mutators: SurveyMutators;
}

// ── Hook ──

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export function useAIChat({ getQuestions, getConditions, getTitle, mutators }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a mutable ref for the Gemini client (created once)
  const genAIRef = useRef<GoogleGenerativeAI | null>(null);

  const getClient = useCallback(() => {
    if (!genAIRef.current) {
      if (!GEMINI_API_KEY) {
        throw new Error('AI anahtarı bulunamadı. Lütfen .env.local içine VITE_GEMINI_API_KEY değerini ekleyin.');
      }
      genAIRef.current = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
    return genAIRef.current;
  }, []);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const client = getClient();
        const model = client.getGenerativeModel({
          model: 'gemini-3.1-flash-lite-preview',
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        });

        // Build system prompt with current survey state
        const systemPrompt = buildSystemPrompt(
          getQuestions(),
          getConditions(),
          getTitle(),
        );

        // Build conversation history for context
        const history = messages
          .slice(-10) // Last 10 messages for context
          .map((m) => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.content}`)
          .join('\n');

        const fullPrompt = history
          ? `${systemPrompt}\n\n## Önceki Konuşma\n${history}\n\nKullanıcı: ${userMessage.trim()}`
          : `${systemPrompt}\n\nKullanıcı: ${userMessage.trim()}`;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        // Parse the AI response
        const aiResponse = parseAIResponse(responseText);

        // Take a snapshot of current state BEFORE applying actions
        const hasActions = aiResponse.actions && aiResponse.actions.length > 0;
        
        // Always take snapshot if there are actions (even if they fail, user might want to undo)
        const snapshot: StateSnapshot | undefined = hasActions
          ? {
              title: getTitle(),
              questions: structuredClone(getQuestions()),
              conditions: structuredClone(getConditions()),
            }
          : undefined;

        // Execute actions
        const { applied, errors: actionErrors } = executeAIActions(aiResponse, mutators);

        // Add AI message (with undo support if actions were applied OR if there were actions attempted)
        const shouldShowUndo = hasActions && applied > 0;

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'ai',
          content: aiResponse.message,
          appliedCount: applied,
          errors: actionErrors.length > 0 ? actionErrors : undefined,
          timestamp: Date.now(),
          undoState: shouldShowUndo ? 'pending' : undefined,
          snapshot: shouldShowUndo ? snapshot : undefined,
          aiActions: shouldShowUndo ? aiResponse.actions : undefined, // Store actions for redo
        };
        
        setMessages((prev) => [...prev, aiMsg]);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'Bilinmeyen bir hata oluştu';
        setError(errMsg);

        // Add error as AI message
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'ai',
          content: `Bir hata oluştu: ${errMsg}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [getClient, getQuestions, getConditions, getTitle, mutators, messages],
  );

  /** User accepted the AI changes — just mark the message as "kept" (keep snapshot for future undo) */
  const keepChanges = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, undoState: 'kept' as const } : m, // Keep snapshot for future undo
      ),
    );
  }, []);

  /** User wants to undo — restore state from the snapshot */
  const undoChanges = useCallback(
    (messageId: string) => {
      setMessages((prev) => {
        const target = prev.find((m) => m.id === messageId);
        if (target?.snapshot) {
          // Restore state via replaceAll
          mutators.replaceAll(
            target.snapshot.title,
            target.snapshot.questions,
            target.snapshot.conditions,
          );
        }
        return prev.map((m) =>
          m.id === messageId ? { ...m, undoState: 'undone' as const } : m, // Keep snapshot for redo
        );
      });
    },
    [mutators],
  );

  /** User wants to redo — re-apply the AI changes by re-executing the stored actions */
  const redoChanges = useCallback(
    (messageId: string) => {
      setMessages((prev) => {
        const target = prev.find((m) => m.id === messageId);
        if (target?.aiActions && target.aiActions.length > 0) {
          // Re-execute the stored actions
          const { applied } = executeAIActions(
            { message: target.content, actions: target.aiActions },
            mutators,
          );
          
          // Mark as kept if successful
          if (applied > 0) {
            return prev.map((m) =>
              m.id === messageId ? { ...m, undoState: 'kept' as const } : m,
            );
          }
        }
        return prev;
      });
    },
    [mutators],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    keepChanges,
    undoChanges,
    redoChanges,
  };
}

