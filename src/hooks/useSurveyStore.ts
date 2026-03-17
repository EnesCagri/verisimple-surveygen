import { useCallback, useState } from 'react';
import type { Survey } from '../types/survey';
import { generateId } from '../utils/id';
import { buildDemoData } from '../utils/demoSurvey';

/**
 * Hook for managing the collection of surveys (dashboard-level).
 */
export function useSurveyStore() {
  const [surveys, setSurveys] = useState<Survey[]>([]);

  const createSurvey = useCallback((): Survey => {
    const now = new Date().toISOString();
    const newSurvey: Survey = {
      id: generateId(),
      title: 'Yeni Anket',
      questions: [],
      conditions: [],
      createdAt: now,
      updatedAt: now,
    };
    setSurveys((prev) => [newSurvey, ...prev]);
    return newSurvey;
  }, []);

  /** Creates a pre-filled demo survey for quick testing. */
  const createDemoSurvey = useCallback((): Survey => {
    const now = new Date().toISOString();
    const demo = buildDemoData();
    const newSurvey: Survey = {
      id: generateId(),
      ...demo,
      createdAt: now,
      updatedAt: now,
    };
    setSurveys((prev) => [newSurvey, ...prev]);
    return newSurvey;
  }, []);

  const updateSurvey = useCallback(
    (id: string, updates: Partial<Omit<Survey, 'id' | 'createdAt'>>) => {
      setSurveys((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, ...updates, updatedAt: new Date().toISOString() }
            : s,
        ),
      );
    },
    [],
  );

  const deleteSurvey = useCallback((id: string) => {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSurvey = useCallback(
    (id: string): Survey | undefined => {
      return surveys.find((s) => s.id === id);
    },
    [surveys],
  );

  return {
    surveys,
    createSurvey,
    createDemoSurvey,
    updateSurvey,
    deleteSurvey,
    getSurvey,
  };
}
