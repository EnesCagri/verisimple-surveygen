import { useCallback, useState, useEffect, useRef } from 'react';
import type { Survey } from '../types/survey';
import { generateId } from '../utils/id';
import { buildDemoData } from '../utils/demoSurvey';

const LS_KEY = 'vs:surveys';

function loadFromLS(): Survey[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToLS(surveys: Survey[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(surveys));
  } catch {
    // quota exceeded – silently ignore
  }
}

/**
 * Hook for managing the collection of surveys (dashboard-level).
 * Persists to localStorage so drafts survive page navigations inside Razor.
 */
export function useSurveyStore() {
  const [surveys, setSurveys] = useState<Survey[]>(() => loadFromLS());

  // Sync to localStorage whenever surveys change (skip initial mount double-write)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToLS(surveys);
  }, [surveys]);

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
    setSurveys((prev) => {
      const next = [newSurvey, ...prev];
      saveToLS(next);
      return next;
    });
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
    setSurveys((prev) => {
      const next = [newSurvey, ...prev];
      saveToLS(next);
      return next;
    });
    return newSurvey;
  }, []);

  const updateSurvey = useCallback(
    (id: string, updates: Partial<Omit<Survey, 'id' | 'createdAt'>>) => {
      setSurveys((prev) => {
        const next = prev.map((s) =>
          s.id === id
            ? { ...s, ...updates, updatedAt: new Date().toISOString() }
            : s,
        );
        saveToLS(next);
        return next;
      });
    },
    [],
  );

  const deleteSurvey = useCallback((id: string) => {
    setSurveys((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveToLS(next);
      return next;
    });
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
