import { useCallback, useState } from 'react';
import type { Question, ConditionalRule, ConditionInput, NodePositions, SequentialEdges } from '../types/survey';
import type { SurveyPayload } from '../bridge/types';
import { createQuestion } from '../utils/question';
import { generateId } from '../utils/id';

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
) {
  const [title, setTitle] = useState(initialTitle);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [conditions, setConditions] = useState<ConditionalRule[]>(initialConditions);
  const [nodePositions, setNodePositions] = useState<NodePositions | undefined>(initialNodePositions);
  const [sequentialEdges, setSequentialEdges] = useState<SequentialEdges | undefined>(initialSequentialEdges);
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
    },
    [selectedId],
  );

  const reorderQuestions = useCallback((reordered: Question[]) => {
    setQuestions(reordered.map((q, i) => ({ ...q, order: i + 1 })));
    // Clear stale sequential edges – new order already represents the desired flow
    setSequentialEdges(undefined);
  }, []);

  const selectQuestion = useCallback((guid: string) => {
    setSelectedId(guid);
  }, []);

  // --- Conditions CRUD ---

  const addCondition = useCallback(
    (sourceQuestionId: string, input: ConditionInput) => {
      const newCondition: ConditionalRule = {
        id: generateId(),
        sourceQuestionId,
        answer: input.answer,
        action: input.action,
        operator: input.operator,
        rowIndex: input.rowIndex,
      };
      setConditions((prev) => [...prev, newCondition]);
      return newCondition;
    },
    [],
  );

  const updateCondition = useCallback(
    (conditionId: string, input: ConditionInput) => {
      setConditions((prev) =>
        prev.map((c) =>
          c.id === conditionId
            ? {
                ...c,
                answer: input.answer,
                action: input.action,
                operator: input.operator,
                rowIndex: input.rowIndex,
              }
            : c,
        ),
      );
    },
    [],
  );

  const removeCondition = useCallback((conditionId: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== conditionId));
  }, []);

  // --- Node Positions ---

  const updateNodePositions = useCallback((positions: NodePositions) => {
    setNodePositions(positions);
  }, []);

  /**
   * When custom sequential edges are created, walk the flow graph to determine
   * the real question order, update `order` values accordingly, and then clear
   * `sequentialEdges` so that the default edges (based on new order) match the
   * intended flow.
   *
   * When only edges are deleted (blocked, no custom edges), store the blocked
   * edges without recalculating order – the user will create a replacement
   * edge later.
   */
  const updateSequentialEdges = useCallback((edges: SequentialEdges) => {
    const hasCustomEdges = (edges.customEdges ?? []).length > 0;

    if (hasCustomEdges) {
      // Custom edges exist → recalculate question order from the flow graph
      setQuestions((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        if (sorted.length === 0) return prev;

        const blockedSet = new Set(edges.blockedEdges ?? []);
        const customMap = new Map<string, string>();
        (edges.customEdges ?? []).forEach((e) => customMap.set(e.source, e.target));

        // Build next-question map: default edges + custom overrides
        const nextMap = new Map<string, string>();
        for (let i = 0; i < sorted.length - 1; i++) {
          const edgeId = `seq-${sorted[i].guid}-${sorted[i + 1].guid}`;
          if (!blockedSet.has(edgeId)) {
            nextMap.set(sorted[i].guid, sorted[i + 1].guid);
          }
        }
        // Custom edges override defaults (skip __start__ as it's not a question)
        customMap.forEach((target, source) => {
          if (source !== '__start__' && target !== '__end__') {
            nextMap.set(source, target);
          }
        });

        // Determine the starting question:
        // If there's a custom __start__ edge, use its target as the first question
        const startEdge = (edges.customEdges ?? []).find((e) => e.source === '__start__');
        let walkStart: string | undefined;
        if (startEdge) {
          walkStart = startEdge.target;
        } else {
          walkStart = sorted[0]?.guid;
        }

        // Walk the chain from the starting question
        const visited = new Set<string>();
        const orderedGuids: string[] = [];
        let current: string | undefined = walkStart;

        while (current && !visited.has(current)) {
          visited.add(current);
          orderedGuids.push(current);
          current = nextMap.get(current);
        }

        // Append any unreachable questions at the end (preserve their relative order)
        for (const q of sorted) {
          if (!visited.has(q.guid)) {
            orderedGuids.push(q.guid);
          }
        }

        // Build reordered array with new order values
        return orderedGuids.map((guid, i) => {
          const q = prev.find((qq) => qq.guid === guid)!;
          return { ...q, order: i + 1 };
        });
      });

      // Clear sequential edges – the new `order` values now represent the flow
      setSequentialEdges(undefined);
    } else {
      // Only blocked edges (deletion) → store without recalculating
      setSequentialEdges(edges);
    }
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
        return mapped;
      });
    }

    if (sequentialEdges && (sequentialEdges.blockedEdges?.length || sequentialEdges.customEdges?.length)) {
      surveyData.sequentialEdges = sequentialEdges;
    }

    return JSON.stringify(surveyData, null, 2);
  }, [questions, conditions, sequentialEdges]);

  /**
   * Structured payload for the JS bridge (includes title + surveyId).
   */
  const getSurveyPayload = useCallback(
    (surveyId: string): SurveyPayload => {
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

      const payload: SurveyPayload = { surveyId, title, questions: mappedQuestions };

      if (conditions.length > 0) {
        payload.conditions = conditions.map((c) => ({
          id: c.id,
          sourceQuestionId: c.sourceQuestionId,
          answer: c.answer,
          action:
            c.action.type === 'end_survey'
              ? 'end_survey'
              : { jumpTo: c.action.targetQuestionId },
          ...(c.operator && c.operator !== 'equals' && c.operator !== 'any' ? { operator: c.operator } : {}),
          ...(c.rowIndex !== undefined ? { rowIndex: c.rowIndex } : {}),
        }));
      }

      if (sequentialEdges && (sequentialEdges.blockedEdges?.length || sequentialEdges.customEdges?.length)) {
        payload.sequentialEdges = sequentialEdges;
      }

      return payload;
    },
    [title, questions, conditions, sequentialEdges],
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
