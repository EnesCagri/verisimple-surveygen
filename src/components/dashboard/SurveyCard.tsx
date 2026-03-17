import type { Survey } from '../../types/survey';

interface SurveyCardProps {
  survey: Survey;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SurveyCard({ survey, onOpen, onDelete }: SurveyCardProps) {
  const questionCount = survey.questions.length;
  const updatedDate = new Date(survey.updatedAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="group rounded-2xl bg-base-100 border border-base-300/40 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => onOpen(survey.id)}
    >
      {/* Color strip */}
      <div className="h-1.5 bg-primary/20 group-hover:bg-primary/40 transition-colors" />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-semibold text-base-content/80 line-clamp-2">
            {survey.title || 'İsimsiz Anket'}
          </h3>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-error/10 text-base-content/30 hover:text-error shrink-0 ml-2"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(survey.id);
            }}
            title="Anketi sil"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-base-content/40">
          <span className="inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            {questionCount} soru
          </span>
          <span>·</span>
          <span>{updatedDate}</span>
        </div>
      </div>
    </div>
  );
}

