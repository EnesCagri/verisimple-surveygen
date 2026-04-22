import { useCallback, useState } from 'react';
import type {
  Survey,
  Question,
  ConditionalRule,
  NodePositions,
  SequentialEdges,
} from './types/survey';
import { BuilderPage } from './components/builder/BuilderPage';
import { generateId } from './utils/id';
import { readVsSurveyGenInitialSurvey } from './bridge/vsSurveyGenInitial';
import {
  hasVsSurveyGenInitialKey,
  isVsSurveyGenExplicitNewMode,
} from './bridge/vsHostInitial';

const DRAFT_KEY = 'vs:survengine:draft';

function createEmptySurvey(): Survey {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: 'Yeni Anket',
    questions: [],
    conditions: [],
    createdAt: now,
    updatedAt: now,
  };
}

function loadDraft(): Survey {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Survey;
      if (parsed?.id && Array.isArray(parsed.questions)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return createEmptySurvey();
}

function saveDraft(survey: Survey): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(survey));
  } catch {
    /* ignore */
  }
}

type SaveUpdates = {
  title: string;
  questions: Question[];
  conditions: ConditionalRule[];
  nodePositions?: NodePositions;
  sequentialEdges?: SequentialEdges;
};

/**
 * VeriSimple sözleşmesi:
 * - `__VS_SURVEYGEN_INITIAL__` özelliği yok → standalone: `localStorage` taslağı.
 * - Değer `null` → host “yeni anket”; taslakla **asla** birleştirilmez.
 * - Nesne → düzenleme hydrate (veya geçersiz nesnede boş şablon).
 */
function initialSurvey(): Survey {
  if (typeof window === 'undefined') {
    return createEmptySurvey();
  }
  if (!hasVsSurveyGenInitialKey()) {
    return loadDraft();
  }
  if (isVsSurveyGenExplicitNewMode()) {
    return createEmptySurvey();
  }
  const hydrated = readVsSurveyGenInitialSurvey();
  return hydrated ?? createEmptySurvey();
}

export default function App() {
  const [survey, setSurvey] = useState<Survey>(initialSurvey);

  const handleSave = useCallback((id: string, updates: SaveUpdates) => {
    setSurvey((prev) => {
      const next: Survey = {
        ...prev,
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const handleBridgeSurveyGuid = useCallback((surveyGuid: string) => {
    setSurvey((prev) => {
      const next: Survey = {
        ...prev,
        surveyGuid,
        updatedAt: new Date().toISOString(),
      };
      saveDraft(next);
      return next;
    });
  }, []);

  return (
    <BuilderPage
      key={survey.id}
      survey={survey}
      onSave={handleSave}
      onBridgeSurveyGuid={handleBridgeSurveyGuid}
    />
  );
}
