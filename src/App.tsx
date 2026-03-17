import { useCallback, useState } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { BuilderPage } from './components/builder/BuilderPage';
import { useSurveyStore } from './hooks/useSurveyStore';
import type { Question, ConditionalRule, NodePositions, SequentialEdges } from './types/survey';

type Page =
  | { type: 'dashboard' }
  | { type: 'builder'; surveyId: string };

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'dashboard' });
  const { surveys, createSurvey, createDemoSurvey, updateSurvey, deleteSurvey, getSurvey } =
    useSurveyStore();
  


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
    if (!survey) {
      setPage({ type: 'dashboard' });
      return null;
    }
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
