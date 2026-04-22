import { useCallback, useEffect, useState } from 'react';
import type { Question, ConditionalRule, ConditionInput, NodePositions, SequentialEdges } from '../types/survey';
import { findConflictingCondition } from '../utils/conditionDuplicate';
import type { SurveyPayload } from '../bridge/types';
import { createQuestion, duplicateQuestionAsCopy } from '../utils/question';
import { normalizeSurveyQuestion } from '../utils/normalizeSurveyQuestion';
import { generateId } from '../utils/id';
import { normalizeSequentialEdges } from '../utils/flowDagreLayout';
import { readBootstrapSurveyGuid } from '../bridge/vsSurveyGenInitial';
import { isVsSurveyGenExplicitNewMode } from '../bridge/vsHostInitial';

/**
 * Hook for managing a single survey's questions and conditions.
 * Used inside the Builder page.
 */
export function useSurvey(
  initialTitle = 'Yeni Anket',
  initialQuestions: Question[] = [],
  initialConditions: ConditionalRule[] = [],
  initialNodePositions?: NodePositions,
  initialSequentialEdges?: SequentialEdges,
  initialSurveyGuid?: string,
) {
  const [surveyGuid, setSurveyGuid] = useState<string | undefined>(() =>
    initialSurveyGuid?.trim() ? initialSurveyGuid.trim() : undefined,
  );

  useEffect(() => {
    const fromProp = initialSurveyGuid?.trim();
    if (fromProp) {
      setSurveyGuid(fromProp);
      return;
    }
    if (isVsSurveyGenExplicitNewMode()) {
      setSurveyGuid(undefined);
      return;
    }
    const boot = readBootstrapSurveyGuid();
    setSurveyGuid(boot ?? undefined);
  }, [initialSurveyGuid]);

  const [title, setTitle] = useState(initialTitle);
  const [questions, setQuestions] = useState<Question[]>(() =>
    initialQuestions.map(normalizeSurveyQuestion),
  );
  const [conditions, setConditions] = useState<ConditionalRule[]>(initialConditions);
  const [nodePositions, setNodePositions] = useState<NodePositions | undefined>(initialNodePositions);
  const [sequentialEdges, setSequentialEdges] = useState<SequentialEdges | undefined>(() =>
    normalizeSequentialEdges(initialSequentialEdges),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedQuestion = questions.find((q) => q.guid === selectedId) ?? null;

  // --- Question CRUD ---

  const addQuestion = useCallback(() => {
    const newQuestion = createQuestion(questions.length + 1);
    setQuestions((prev) => [...prev, newQuestion]);
    setSelectedId(newQuestion.guid);
  }, [questions.length]);

  /** Add a fully constructed question (used by AI actions) */
  const addQuestionWithData = useCallback(
    (question: Question) => {
      setQuestions((prev) => {
        const q = { ...question, order: prev.length + 1 };
        return [...prev, q];
      });
    },
    [],
  );

  /** Replace the entire survey (used by AI actions) */
  const replaceAll = useCallback(
    (newTitle: string, newQuestions: Question[], newConditions: ConditionalRule[]) => {
      setTitle(newTitle);
      setQuestions(newQuestions.map((q, i) => ({ ...q, order: i + 1 })));
      setConditions(newConditions);
      setSelectedId(null);
    },
    [],
  );

  const updateQuestion = useCallback(
    (guid: string, updates: Partial<Omit<Question, 'guid'>>) => {
      setQuestions((prev) =>
        prev.map((q) => (q.guid === guid ? { ...q, ...updates } : q)),
      );
    },
    [],
  );

  const deleteQuestion = useCallback(
    (guid: string) => {
      const sorted = [...questions].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((q) => q.guid === guid);
      const prevQ = idx > 0 ? sorted[idx - 1] : null;
      const nextQ = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
      const isFirst = idx === 0;
      const isLast = idx === sorted.length - 1;

      setQuestions((prev) => {
        const filtered = prev.filter((q) => q.guid !== guid);
        return filtered.map((q, i) => ({ ...q, order: i + 1 }));
      });
      setConditions((prev) =>
        prev.filter((c) => {
          if (c.sourceQuestionId === guid) return false;
          if (c.action.type === 'jump_to' && c.action.targetQuestionId === guid)
            return false;
          return true;
        }),
      );
      if (selectedId === guid) {
        setSelectedId(null);
      }

      // Remove stale sequential edges touching deleted node and
      // block auto-reconnected default edges; user will reconnect manually.
      setSequentialEdges((prev) => {
        const current = prev ?? {};
        const blocked = new Set(current.blockedEdges ?? []);

        // Prevent default auto-reconnect after deletion
        if (prevQ && nextQ) blocked.add(`seq-${prevQ.guid}-${nextQ.guid}`);
        if (isFirst && nextQ) blocked.add(`seq-__start__-${nextQ.guid}`);
        if (isLast && prevQ) blocked.add(`seq-${prevQ.guid}-end`);

        const customEdges = (current.customEdges ?? []).filter(
          (e) => e.source !== guid && e.target !== guid,
        );
        const cleanedBlocked = Array.from(blocked).filter((id) => !id.includes(guid));

        if (customEdges.length === 0 && cleanedBlocked.length === 0) {
          return undefined;
        }
        return {
          blockedEdges: cleanedBlocked.length > 0 ? cleanedBlocked : undefined,
          customEdges: customEdges.length > 0 ? customEdges : undefined,
        };
      });
    },
    [questions, selectedId],
  );

  /** Soruyu hemen altına kopyalar; koşullar kopyalanmaz; akış konumu hafif kaydırılır. */
  const duplicateQuestion = useCallback(
    (guid: string) => {
      const sorted = [...questions].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((q) => q.guid === guid);
      if (idx < 0) return;
      const dup = duplicateQuestionAsCopy(sorted[idx]);
      const dupGuid = dup.guid;
      const nextList = [...sorted.slice(0, idx + 1), dup, ...sorted.slice(idx + 1)].map((q, i) => ({
        ...q,
        order: i + 1,
      }));
      setQuestions(nextList);
      setNodePositions((prev) => {
        if (!prev) return prev;
        const pos = prev[guid];
        if (!pos) return prev;
        return { ...prev, [dupGuid]: { x: pos.x + 28, y: pos.y + 20 } };
      });
      setSelectedId(dupGuid);
    },
    [questions],
  );

  const reorderQuestions = useCallback((reordered: Question[]) => {
    setQuestions(reordered.map((q, i) => ({ ...q, order: i + 1 })));
  }, []);

  const selectQuestion = useCallback((guid: string) => {
    setSelectedId(guid);
  }, []);

  // --- Conditions CRUD ---

  const addCondition = useCallback((sourceQuestionId: string, input: ConditionInput) => {
    setConditions((prev) => {
      if (findConflictingCondition(prev, sourceQuestionId, input)) return prev;
      const row: ConditionalRule = {
        id: generateId(),
        sourceQuestionId,
        answer: input.answer,
        action: input.action,
        operator: input.operator,
        rowIndex: input.rowIndex,
      };
      if (input.answerValues && input.answerValues.length > 0) {
        row.answerValues = input.answerValues;
      }
      return [...prev, row];
    });
  }, []);

  const updateCondition = useCallback((conditionId: string, input: ConditionInput) => {
    setConditions((prev) => {
      const self = prev.find((c) => c.id === conditionId);
      if (!self) return prev;
      if (findConflictingCondition(prev, self.sourceQuestionId, input, conditionId)) return prev;
      return prev.map((c) => {
        if (c.id !== conditionId) return c;
        const { answerValues: _drop, ...rest } = c;
        const next: ConditionalRule = {
          ...rest,
          answer: input.answer,
          action: input.action,
          operator: input.operator,
          rowIndex: input.rowIndex,
        };
        if (input.answerValues && input.answerValues.length > 0) {
          next.answerValues = input.answerValues;
        }
        return next;
      });
    });
  }, []);

  const removeCondition = useCallback((conditionId: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== conditionId));
  }, []);

  // --- Node Positions ---

  const updateNodePositions = useCallback((positions: NodePositions) => {
    setNodePositions(positions);
  }, []);

  /**
   * Akış tuvalindeki sıra kenarları: yalnızca FlowCanvas’ın gönderdiği
   * blocked/custom durumunu saklarız. Önceden custom kenar eklenince soru
   * sırası yeniden yazılıp sequentialEdges siliniyordu; bu da kesilen
   * varsayılan kenarların yeniden görünmesine yol açıyordu.
   */
  const updateSequentialEdges = useCallback((edges: SequentialEdges) => {
    setSequentialEdges(normalizeSequentialEdges(edges));
  }, []);

  // --- JSON export ---

  const toJSON = useCallback((): string => {
    const mappedQuestions = questions.map(({ order, text, type, answers, guid, settings, required, image }) => {
      const q: Record<string, unknown> = { order, text, type, answers, guid };
      if (settings && Object.keys(settings).length > 0) {
        q.settings = settings;
      }
      if (required) {
        q.required = true;
      }
      if (image) {
        q.image = image;
      }
      return q;
    });

    const surveyData: Record<string, unknown> = { questions: mappedQuestions };

    if (conditions.length > 0) {
      surveyData.conditions = conditions.map((c) => {
        const mapped: Record<string, unknown> = {
          id: c.id,
          sourceQuestionId: c.sourceQuestionId,
          answer: c.answer,
          action:
            c.action.type === 'end_survey'
              ? 'end_survey'
              : { jumpTo: c.action.targetQuestionId },
        };
        if (c.operator && c.operator !== 'equals' && c.operator !== 'any') {
          mapped.operator = c.operator;
        }
        if (c.rowIndex !== undefined) {
          mapped.rowIndex = c.rowIndex;
        }
        if (c.answerValues && c.answerValues.length > 0) {
          mapped.answerValues = c.answerValues;
        }
        return mapped;
      });
    }

    if (sequentialEdges && (sequentialEdges.blockedEdges?.length || sequentialEdges.customEdges?.length)) {
      surveyData.sequentialEdges = sequentialEdges;
    }

    return JSON.stringify(surveyData, null, 2);
  }, [questions, conditions, sequentialEdges]);

  /**
   * Structured payload for the JS bridge (`id`, `surveyGuid`, `title`, …).
   */
  const getSurveyPayload = useCallback(
    (surveyClientId: string): SurveyPayload => {
      const mappedQuestions: SurveyPayload['questions'] = questions.map(
        ({ order, text, type, answers, guid, settings, required, image }) => ({
          order,
          text,
          type,
          answers,
          guid,
          ...(settings && Object.keys(settings).length > 0 ? { settings: settings as Record<string, unknown> } : {}),
          ...(required ? { required: true } : {}),
          ...(image ? { image } : {}),
        }),
      );

      const payload: SurveyPayload = {
        id: surveyClientId,
        surveyId: surveyClientId,
        title,
        questions: mappedQuestions,
      };
      // Düzenleme: state → host bootstrap yedek (React/hydrate edge case)
      const effectiveSurveyGuid =
        (surveyGuid && surveyGuid.trim()) || readBootstrapSurveyGuid();
      if (effectiveSurveyGuid) {
        payload.surveyGuid = effectiveSurveyGuid;
      }

      payload.conditions =
        conditions.length > 0
          ? conditions.map((c) => ({
              id: c.id,
              sourceQuestionId: c.sourceQuestionId,
              answer: c.answer,
              action:
                c.action.type === 'end_survey'
                  ? 'end_survey'
                  : { jumpTo: c.action.targetQuestionId },
              ...(c.operator && c.operator !== 'equals' && c.operator !== 'any'
                ? { operator: c.operator }
                : {}),
              ...(c.rowIndex !== undefined ? { rowIndex: c.rowIndex } : {}),
              ...(c.answerValues && c.answerValues.length > 0
                ? { answerValues: c.answerValues }
                : {}),
            }))
          : null;

      if (sequentialEdges && (sequentialEdges.blockedEdges?.length || sequentialEdges.customEdges?.length)) {
        payload.sequentialEdges = sequentialEdges;
      }

      return payload;
    },
    [title, questions, conditions, sequentialEdges, surveyGuid],
  );

  return {
    title,
    setTitle,
    questions,
    conditions,
    nodePositions,
    sequentialEdges,
    selectedId,
    selectedQuestion,
    addQuestion,
    addQuestionWithData,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    selectQuestion,
    addCondition,
    updateCondition,
    removeCondition,
    replaceAll,
    updateNodePositions,
    updateSequentialEdges,
    toJSON,
    getSurveyPayload,
  };
}
