import { useCallback, useState, useEffect } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { BuilderPage } from './components/builder/BuilderPage';
import { useSurveyStore } from './hooks/useSurveyStore';
import type { Question, ConditionalRule, NodePositions, SequentialEdges } from './types/survey';

type Page =
  | { type: 'dashboard' }
  | { type: 'builder'; surveyId: string };

const PAGE_KEY = 'vs:page';

function loadPage(): Page {
  try {
    const raw = localStorage.getItem(PAGE_KEY);
    if (!raw) return { type: 'dashboard' };
    const parsed = JSON.parse(raw) as Page;
    if (parsed?.type === 'builder' && parsed.surveyId) return parsed;
    return { type: 'dashboard' };
  } catch {
    return { type: 'dashboard' };
  }
}

function savePage(page: Page) {
  try {
    localStorage.setItem(PAGE_KEY, JSON.stringify(page));
  } catch { /* ignore */ }
}

export default function App() {
  const [page, setPageState] = useState<Page>(() => loadPage());
  const { surveys, createSurvey, createDemoSurvey, updateSurvey, deleteSurvey, getSurvey } =
    useSurveyStore();

  const setPage = useCallback((p: Page) => {
    savePage(p);
    setPageState(p);
  }, []);

  // If persisted page points to a builder but survey no longer exists, fall back to dashboard
  useEffect(() => {
    if (page.type === 'builder' && !getSurvey(page.surveyId)) {
      setPage({ type: 'dashboard' });
    }
  }, [page, getSurvey, setPage]);

  const handleCreateNew = () => {
    const newSurvey = createSurvey();
    setPage({ type: 'builder', surveyId: newSurvey.id });
  };

  const handleCreateDemo = () => {
    const demo = createDemoSurvey();
    setPage({ type: 'builder', surveyId: demo.id });
  };

  const handleOpenSurvey = (id: string) => {
    setPage({ type: 'builder', surveyId: id });
  };

  const handleBack = () => {
    setPage({ type: 'dashboard' });
  };

  const handleSave = useCallback(
    (id: string, updates: { title: string; questions: Question[]; conditions: ConditionalRule[]; nodePositions?: NodePositions; sequentialEdges?: SequentialEdges }) => {
      updateSurvey(id, updates);
    },
    [updateSurvey],
  );

  if (page.type === 'builder') {
    const survey = getSurvey(page.surveyId);
    if (!survey) return null; // useEffect will redirect
    return (
      <BuilderPage
        key={survey.id}
        survey={survey}
        onSave={handleSave}
        onBack={handleBack}
      />
    );
  }

  return (
    <Dashboard
      surveys={surveys}
      onCreateNew={handleCreateNew}
      onCreateDemo={handleCreateDemo}
      onOpenSurvey={handleOpenSurvey}
      onDeleteSurvey={deleteSurvey}
    />
  );
}
