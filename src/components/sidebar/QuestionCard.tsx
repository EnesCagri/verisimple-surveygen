import { useSortable } from '@dnd-kit/react/sortable';
import type { Question } from '../../types/survey';
import { QuestionType } from '../../types/survey';
import { Tooltip } from '../ui/Tooltip';
import { questionTypeDescriptions } from '../../utils/questionTypeInfo';
import { isQuestionRequired } from '../../utils/questionRequired';
import { questionListPlainText } from '../../utils/questionDisplayText';

interface QuestionCardProps {
  question: Question;
  index: number;
  isSelected: boolean;
  /** Koşullu çıkışı olan soru — sürüklenemez (liste sırası korunmalı) */
  dragDisabled?: boolean;
  onSelect: (guid: string) => void;
  onDelete: (guid: string) => void;
  onUpdate?: (guid: string, updates: Partial<Omit<Question, 'guid'>>) => void;
}

const typeLabels: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: 'Tek Seçim',
  [QuestionType.MultipleChoice]: 'Çoklu Seçim',
  [QuestionType.TextEntry]: 'Metin Girişi',
  [QuestionType.Rating]: 'Derecelendirme',
  [QuestionType.MatrixLikert]: 'Matrix Likert',
  [QuestionType.Sortable]: 'Sıralama',
};

const typeIcons: Record<QuestionType, React.JSX.Element> = {
  [QuestionType.SingleChoice]: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  [QuestionType.MultipleChoice]: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="m9 12 2 2 4-4" />
    </svg>
  ),
  [QuestionType.TextEntry]: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 10H3" /><path d="M21 6H3" /><path d="M21 14H3" />
    </svg>
  ),
  [QuestionType.Rating]: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  [QuestionType.MatrixLikert]: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  [QuestionType.Sortable]: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="3" y2="18" /><path d="M3 6l3-3 3 3" /><path d="M3 18l3 3 3-3" />
      <line x1="12" y1="6" x2="21" y2="6" /><line x1="12" y1="12" x2="21" y2="12" /><line x1="12" y1="18" x2="21" y2="18" />
    </svg>
  ),
};

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="opacity-30 group-hover:opacity-60 transition-opacity">
      <circle cx="3" cy="2" r="1.2" />
      <circle cx="9" cy="2" r="1.2" />
      <circle cx="3" cy="6" r="1.2" />
      <circle cx="9" cy="6" r="1.2" />
      <circle cx="3" cy="10" r="1.2" />
      <circle cx="9" cy="10" r="1.2" />
    </svg>
  );
}

function getTypeDetail(question: Question): string {
  if (question.type === QuestionType.TextEntry) {
    if (question.settings?.richInformationOnly) return 'Bilgi';
    const bits: string[] = [];
    if (question.settings?.useRichQuestionText) bits.push('Zengin kök');
    bits.push(`${question.settings?.maxLength ?? 1250} kar.`);
    return bits.join(' · ');
  }
  if (question.type === QuestionType.Rating) {
    return `${question.settings?.ratingCount ?? 5} yıldız`;
  }
  if (question.type === QuestionType.MatrixLikert) {
    const rows = (question.settings?.rows ?? []).filter(Boolean).length;
    const cols = (question.settings?.columns ?? []).filter(Boolean).length;
    return `${rows}×${cols}`;
  }
  if (question.type === QuestionType.Sortable) {
    const count = question.answers.filter(Boolean).length;
    return count > 0 ? `${count} öğe` : '';
  }
  const count = question.answers.filter(Boolean).length;
  return count > 0 ? `${count} seçenek` : '';
}

export function QuestionCard({
  question,
  index,
  isSelected,
  dragDisabled = false,
  onSelect,
  onDelete,
  onUpdate,
}: QuestionCardProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: question.guid,
    index,
    disabled: dragDisabled,
  });

  const detail = getTypeDetail(question);
  const isControl = question.settings?.isControlQuestion === true;

  return (
    <div
      ref={ref}
      className={`
        group relative rounded-2xl bg-base-100 cursor-pointer
        transition-all duration-200 ease-out
        ${isSelected
          ? `shadow-md ring-2 ring-primary/50 bg-primary/3 ${isControl ? 'border border-accent/35' : ''}`
          : isControl
            ? 'shadow-sm hover:shadow-md border-2 border-accent/40 bg-accent/6 hover:border-accent/55'
            : 'shadow-sm hover:shadow-md border border-base-300/60 hover:border-primary/30'
        }
        ${isDragging ? 'opacity-40 scale-[0.97] rotate-1' : ''}
      `}
      onClick={() => onSelect(question.guid)}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Sürükleme yalnızca tutamaktan — karta tıklayınca seçim/düzenleme çalışır */}
        <div
          ref={handleRef}
          className={`shrink-0 touch-none pt-1.5 ${dragDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing'}`}
          title={
            dragDisabled
              ? 'Koşullu bağlantı var; sıra değiştirmek kapalı.'
              : 'Sırayı değiştirmek için sürükleyin'
          }
          aria-label={dragDisabled ? 'Sürükleme kapalı' : 'Sürükle'}
        >
          <GripIcon />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-sm font-bold shrink-0 ${isControl ? 'bg-accent/15 text-accent' : 'bg-primary/10 text-primary'}`}
            >
              {question.order}
            </span>
            {isControl && (
              <span className="shrink-0 rounded-md border border-accent/35 bg-accent/10 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-accent">
                Kontrol
              </span>
            )}
            <span className="text-sm font-semibold truncate text-base-content/80 min-w-0">
              {questionListPlainText(question) || 'Yeni Soru'}
            </span>
          </div>

          {/* Type badge with tooltip */}
          <div className="pl-8 flex flex-wrap items-center gap-2">
            <Tooltip content={questionTypeDescriptions[question.type]} position="bottom" delay={400}>
              <span className="inline-flex items-center gap-1.5 text-xs text-base-content/45 bg-base-200/70 rounded-lg px-2.5 py-1 cursor-default">
                <span className="text-base-content/30">{typeIcons[question.type]}</span>
                {typeLabels[question.type]}
                {detail && (
                  <>
                    <span className="text-base-content/20">·</span>
                    {detail}
                  </>
                )}
              </span>
            </Tooltip>
          </div>

          {/* Required toggle row */}
          <div
            className="pl-8 mt-2.5 flex items-center gap-2.5 w-fit cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate?.(question.guid, { required: !isQuestionRequired(question) });
            }}
          >
            {/* Custom mini switch */}
            <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${isQuestionRequired(question) ? 'bg-error' : 'bg-base-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${isQuestionRequired(question) ? 'left-4.5' : 'left-0.5'}`} />
            </div>
            <span className={`text-xs font-semibold transition-colors ${isQuestionRequired(question) ? 'text-error' : 'text-base-content/40'}`}>
              Zorunlu
            </span>
          </div>
        </div>

        {/* Delete button */}
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-lg hover:bg-error/10 text-base-content/30 hover:text-error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(question.guid);
          }}
          title="Soruyu sil"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
