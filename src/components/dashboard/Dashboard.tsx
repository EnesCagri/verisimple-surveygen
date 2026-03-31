import { useState, useEffect } from 'react';
import type { Survey } from '../../types/survey';
import { SurveyCard } from './SurveyCard';
import { Tooltip } from '../ui/Tooltip';

interface DashboardProps {
  surveys: Survey[];
  onCreateNew: () => void;
  onCreateDemo: () => void;
  onOpenSurvey: (id: string) => void;
  onDeleteSurvey: (id: string) => void;
}

function getLastEditedSurveyId(surveys: Survey[]): string | null {
  if (surveys.length === 0) return null;
  const sorted = [...surveys].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  // Only show banner if updated in the last 7 days and has at least one question
  const latest = sorted[0];
  const ageMs = Date.now() - new Date(latest.updatedAt).getTime();
  if (ageMs < 7 * 24 * 60 * 60 * 1000 && latest.questions.length > 0) {
    return latest.id;
  }
  return null;
}

export function Dashboard({
  surveys,
  onCreateNew,
  onCreateDemo,
  onOpenSurvey,
  onDeleteSurvey,
}: DashboardProps) {
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vs:page');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.type === 'builder' && parsed.surveyId) {
        const survey = surveys.find((s) => s.id === parsed.surveyId);
        if (survey && survey.questions.length > 0) {
          setResumeId(parsed.surveyId);
          setShowResumeBanner(true);
          return;
        }
      }
    } catch { /* ignore */ }

    // Fallback: last edited survey
    const lastId = getLastEditedSurveyId(surveys);
    if (lastId) {
      setResumeId(lastId);
      setShowResumeBanner(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumeSurvey = surveys.find((s) => s.id === resumeId);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-base-100 border-b border-base-300/40 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-base-content/85">Surveygen</h1>
            <p className="text-sm text-base-content/40 mt-0.5">Anket oluşturucu</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Hazır sorular ve koşullarla örnek bir anket oluştur" position="bottom">
              <button
                className="btn btn-ghost btn-sm rounded-xl px-4 gap-2 text-base-content/50 hover:text-primary border border-base-300/50"
                onClick={onCreateDemo}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="m9 15 2 2 4-4" />
                </svg>
                Demo Anket
              </button>
            </Tooltip>
            <Tooltip content="Sıfırdan yeni bir anket oluştur" position="bottom">
              <button
                className="btn btn-primary btn-sm rounded-xl px-5 shadow-sm"
                onClick={onCreateNew}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Yeni Anket
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Resume banner */}
      {showResumeBanner && resumeSurvey && (
        <div className="bg-primary/6 border-b border-primary/15">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-sm text-base-content/70 truncate">
                <span className="font-semibold text-base-content/85">{resumeSurvey.title}</span>
                {' '}— kaldığınız yerden devam edebilirsiniz
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="btn btn-primary btn-xs rounded-lg px-3"
                onClick={() => { setShowResumeBanner(false); onOpenSurvey(resumeSurvey.id); }}
              >
                Devam Et
              </button>
              <button
                className="p-1 rounded-lg hover:bg-base-300/40 text-base-content/30 hover:text-base-content/60 transition-colors"
                onClick={() => setShowResumeBanner(false)}
                title="Kapat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {surveys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-base-content/30">
            <div className="w-20 h-20 rounded-3xl bg-base-300/30 flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/20">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-1">Henüz anket yok</p>
            <p className="text-sm text-base-content/20 mb-6">
              İlk anketinizi oluşturarak başlayın veya demo anketi deneyin
            </p>
            <div className="flex gap-3">
              <button
                className="btn btn-ghost btn-sm rounded-xl px-5 border border-base-300/50"
                onClick={onCreateDemo}
              >
                Demo Anket Oluştur
              </button>
              <button
                className="btn btn-primary btn-sm rounded-xl px-6"
                onClick={onCreateNew}
              >
                Anket Oluştur
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-4">
              Anketlerim
              <span className="ml-1.5 text-primary/60">{surveys.length}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onOpen={onOpenSurvey}
                  onDelete={onDeleteSurvey}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
