import { useState, useCallback, useMemo } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import {
  choiceAnswerDisplayLabel,
  choiceAnswerRowVisible,
  choiceQuestionsHasAnyAnswerImage,
  resolveChoiceAnswerImage,
} from '../../utils/answerImages';
import { useSortableRowIds } from '../../hooks/useSortableRowIds';
import { isQuestionRequired } from '../../utils/questionRequired';
import type { Question } from '../../types/survey';
import { QuestionType } from '../../types/survey';
import { QuestionStemHeading } from './QuestionStemHeading';
import { shuffleDisplayOrder } from '../../utils/shuffleDisplayOrder';

function orderMatchesCanonical(value: string[], canonical: string[]): boolean {
  return value.length === canonical.length && value.every((v, i) => v === canonical[i]);
}

interface PreviewQuestionProps {
  question: Question;
  /** Selected choice answers (SingleChoice / MultipleChoice) */
  selectedAnswers: string[];
  onSelectAnswer: (questionGuid: string, answer: string, isMultiple: boolean) => void;
  onSingleChoiceNext?: () => void;
  /** TextEntry: current text value */
  textValue?: string;
  /** TextEntry: called when user types */
  onTextChange?: (questionGuid: string, text: string) => void;
  /** Rating: current value (1-based) or 0 = none */
  ratingValue?: number;
  /** Rating: called when user picks a star */
  onRatingChange?: (questionGuid: string, value: number) => void;
  /** MatrixLikert: row → selected column labels */
  matrixValue?: Record<number, string[]>;
  /** MatrixLikert: called when user toggles a cell */
  onMatrixChange?: (questionGuid: string, rowIndex: number, column: string, isMultiple: boolean) => void;
  /** Sortable: current item order */
  sortableValue?: string[];
  /** Sortable: called when user reorders items */
  onSortableChange?: (questionGuid: string, orderedItems: string[]) => void;
  /** Force mobile layout for matrix/likert (e.g. phone mockup preview) */
  isMobilePreview?: boolean;
}

export function PreviewQuestion({
  question,
  selectedAnswers,
  onSelectAnswer,
  onSingleChoiceNext,
  textValue = '',
  onTextChange,
  ratingValue = 0,
  onRatingChange,
  matrixValue = {},
  onMatrixChange,
  sortableValue,
  onSortableChange,
  isMobilePreview = false,
}: PreviewQuestionProps) {
  switch (question.type) {
    case QuestionType.TextEntry:
      return (
        <TextEntryPreview
          question={question}
          value={textValue}
          onChange={(text) => onTextChange?.(question.guid, text)}
        />
      );
    case QuestionType.Rating:
      return (
        <RatingPreview
          question={question}
          value={ratingValue}
          onChange={(val) => onRatingChange?.(question.guid, val)}
          onNext={onSingleChoiceNext}
        />
      );
    case QuestionType.MatrixLikert:
      return (
        <MatrixLikertPreview
          question={question}
          value={matrixValue}
          onChange={(row, col, multi) => onMatrixChange?.(question.guid, row, col, multi)}
          isMobile={isMobilePreview}
        />
      );
    case QuestionType.Sortable:
      return (
        <SortablePreview
          question={question}
          value={sortableValue ?? question.answers.filter(Boolean)}
          onChange={(items) => onSortableChange?.(question.guid, items)}
        />
      );
    default:
      return (
        <ChoicePreview
          question={question}
          selectedAnswers={selectedAnswers}
          onSelectAnswer={onSelectAnswer}
          onSingleChoiceNext={onSingleChoiceNext}
        />
      );
  }
}

/* ═══════════════════════════════════════════
   Choice Preview (SingleChoice / MultipleChoice)
   ═══════════════════════════════════════════ */

function ChoicePreview({
  question,
  selectedAnswers,
  onSelectAnswer,
  onSingleChoiceNext,
}: {
  question: Question;
  selectedAnswers: string[];
  onSelectAnswer: (guid: string, answer: string, isMultiple: boolean) => void;
  onSingleChoiceNext?: () => void;
}) {
  const isMultiple = question.type === QuestionType.MultipleChoice;

  const answerImages = question.settings?.answerImages ?? {};
  const hasAnyImage = choiceQuestionsHasAnyAnswerImage(answerImages);
  const randomize = question.settings?.randomizeAnswerOrder === true;

  const visibleKey = useMemo(
    () =>
      question.answers
        .map((a, i) => (choiceAnswerRowVisible(a, i, answerImages) ? `${i}\u0001${a}` : ''))
        .filter(Boolean)
        .join('\u0002'),
    [question.answers, answerImages],
  );

  const displayRows = useMemo(() => {
    const rows: { origIndex: number; answer: string }[] = [];
    question.answers.forEach((answer, origIndex) => {
      if (!choiceAnswerRowVisible(answer, origIndex, answerImages)) return;
      rows.push({ origIndex, answer });
    });
    if (!randomize) return rows;
    return shuffleDisplayOrder([...rows]);
  }, [question.guid, randomize, visibleKey]);

  return (
    <div className="animate-[fadeSlideIn_0.4s_ease-out]">
      <div className="flex items-start gap-3 mb-2">
        <QuestionStemHeading
          question={question}
          plainClassName="text-2xl font-semibold text-base-content/85 leading-snug flex-1"
        />
        {isQuestionRequired(question) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-error/10 text-error border border-error/20 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            Zorunlu
          </span>
        )}
      </div>

      {/* Question image */}
      {question.image && (
        <div className="mb-6 rounded-xl overflow-hidden border border-base-300/30">
          <img src={question.image} alt="" className="w-full max-h-72 object-contain bg-base-200/30" />
        </div>
      )}

      <p className="text-sm text-base-content/35 mb-8">
        {isMultiple ? 'Birden fazla seçenek işaretleyebilirsiniz' : 'Bir seçenek seçin'}
      </p>

      {/* Grid layout for image answers, list layout for text-only */}
      <div className={hasAnyImage ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {displayRows.map(({ answer, origIndex }, displayIndex) => {
          const label = choiceAnswerDisplayLabel(answer, origIndex);
          const isSelected = selectedAnswers.includes(answer);
          const answerImage = resolveChoiceAnswerImage(answerImages, answer, origIndex);
          return (
            <button
              key={origIndex}
              className={`
                w-full text-left rounded-2xl border-2 transition-all duration-200 ease-out group
                ${hasAnyImage ? 'p-3 flex flex-col' : 'px-5 py-4 flex items-center gap-4'}
                ${isSelected
                  ? 'border-primary bg-primary/5 shadow-sm dark:border-primary dark:bg-primary/10'
                  : 'border-base-300/50 bg-base-100 hover:border-base-300 hover:bg-base-200/35 dark:hover:bg-base-200/25 hover:shadow-sm'
                }
              `}
              onClick={() => {
                const wasSelected = isSelected;
                onSelectAnswer(question.guid, answer, isMultiple);
                if (!isMultiple) {
                  if (wasSelected) return;
                  onSingleChoiceNext?.();
                }
              }}
            >
              {/* Answer image */}
              {answerImage && (
                <div className="mb-3 rounded-xl overflow-hidden bg-base-200/30">
                  <img
                    src={answerImage}
                    alt={answer}
                    className="w-full h-32 object-contain"
                  />
                </div>
              )}

              <div className={`flex items-center gap-3 ${hasAnyImage ? 'w-full' : 'flex-1'}`}>
                <span
                  className={`
                    shrink-0 w-6 h-6 flex items-center justify-center transition-all duration-200
                    ${isMultiple ? 'rounded-md' : 'rounded-full'}
                    ${isSelected ? 'bg-primary text-primary-content shadow-sm' : 'border-2 border-base-300/55 group-hover:border-base-400/70'}
                  `}
                >
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span className="flex items-center gap-3 flex-1">
                  <span
                    className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-colors duration-200 border
                    ${isSelected ? 'bg-primary text-primary-content border-primary shadow-sm' : 'bg-base-200/80 text-base-content/45 border-base-300/60'}
                  `}
                  >
                    {String.fromCharCode(65 + displayIndex)}
                  </span>
                  <span className={`text-base transition-colors duration-200 ${isSelected ? 'text-base-content/90 font-medium' : 'text-base-content/60'}`}>
                    {label}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Text Entry Preview
   ═══════════════════════════════════════════ */

function TextEntryPreview({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (text: string) => void;
}) {
  const maxLength = question.settings?.maxLength ?? 1250;
  const placeholder = question.settings?.placeholder || 'Cevabınızı buraya yazın...';
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;
  const isOverLimit = charCount > maxLength;
  const infoOnly = question.settings?.richInformationOnly === true;

  return (
    <div className="animate-[fadeSlideIn_0.4s_ease-out]">
      <div className="flex items-start gap-3 mb-2">
        <QuestionStemHeading
          question={question}
          plainClassName="text-2xl font-semibold text-base-content/85 leading-snug flex-1"
        />
        {isQuestionRequired(question) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-error/10 text-error border border-error/20 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            Zorunlu
          </span>
        )}
      </div>

      {/* Question image */}
      {question.image && (
        <div className="mb-6 rounded-xl overflow-hidden border border-base-300/30">
          <img src={question.image} alt="" className="w-full max-h-72 object-contain bg-base-200/30" />
        </div>
      )}

      {infoOnly ? (
        <p className="text-sm text-base-content/35 mb-4">Bilgilendirme — devam etmek için İleri&apos;ye basın.</p>
      ) : (
        <>
          <p className="text-sm text-base-content/35 mb-8">Cevabınızı aşağıya yazın</p>

          <div className="relative">
            <textarea
              className={`
            textarea w-full min-h-36 resize-y rounded-2xl border-2 bg-base-100 px-5 py-4
            text-base leading-relaxed transition-all duration-200
            focus:outline-none
            ${isOverLimit
              ? 'border-error/60 focus:border-error'
              : 'border-base-300/50 focus:border-primary/40'
            }
          `}
              placeholder={placeholder}
              value={value}
              maxLength={maxLength + 50}
              onChange={(e) => onChange(e.target.value)}
              rows={5}
            />
            <div className="flex items-center justify-end mt-2 px-1">
              <span
                className={`
              text-xs font-medium transition-colors duration-200
              ${isOverLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-base-content/30'}
            `}
              >
                {charCount.toLocaleString('tr-TR')} / {maxLength.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Rating Preview (Star rating)
   ═══════════════════════════════════════════ */

function RatingPreview({
  question,
  value,
  onChange,
  onNext,
}: {
  question: Question;
  value: number;
  onChange: (value: number) => void;
  onNext?: () => void;
}) {
  const ratingCount = question.settings?.ratingCount ?? 5;
  const labels = question.settings?.ratingLabels ?? { low: '', high: '' };
  const [hovered, setHovered] = useState(0);

  const displayValue = hovered || value;

  return (
    <div className="animate-[fadeSlideIn_0.4s_ease-out]">
      <div className="flex items-start gap-3 mb-2">
        <QuestionStemHeading
          question={question}
          plainClassName="text-2xl font-semibold text-base-content/85 leading-snug flex-1"
        />
        {isQuestionRequired(question) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-error/10 text-error border border-error/20 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            Zorunlu
          </span>
        )}
      </div>

      {/* Question image */}
      {question.image && (
        <div className="mb-6 rounded-xl overflow-hidden border border-base-300/30">
          <img src={question.image} alt="" className="w-full max-h-72 object-contain bg-base-200/30" />
        </div>
      )}

      <p className="text-sm text-base-content/35 mb-8">Derecelendirme yapın</p>

      <div className="flex flex-col items-center gap-4">
        {/* Stars */}
        <div
          className="flex items-center gap-2"
          onMouseLeave={() => setHovered(0)}
        >
          {Array.from({ length: ratingCount }, (_, i) => {
            const starValue = i + 1;
            const isFilled = starValue <= displayValue;
            return (
              <button
                key={i}
                className="group p-1 transition-transform duration-150 hover:scale-110 focus:outline-none"
                onMouseEnter={() => setHovered(starValue)}
                onClick={() => {
                  if (value === starValue) {
                    onChange(0);
                    return;
                  }
                  onChange(starValue);
                  setTimeout(() => onNext?.(), 300);
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill={isFilled ? 'oklch(75% 0.18 60)' : 'none'}
                  stroke={isFilled ? 'oklch(75% 0.18 60)' : 'oklch(70% 0.02 280)'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-200"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Endpoint labels */}
        {(labels.low || labels.high) && (
          <div className="flex justify-between w-full max-w-xs text-xs text-base-content/40">
            <span>{labels.low}</span>
            <span>{labels.high}</span>
          </div>
        )}

        {/* Selected value indicator */}
        {value > 0 && (
          <div className="text-sm font-medium text-primary/70">
            {value} / {ratingCount}
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   Sortable Preview (Drag & Drop ranking)
   ═══════════════════════════════════════════ */

function SortableItem({
  item,
  index,
  sortableId,
  questionGuid,
}: {
  item: string;
  index: number;
  sortableId: string;
  questionGuid: string;
}) {
  const { ref, handleRef, isDragging, sortable } = useSortable({
    id: sortableId,
    index,
    group: questionGuid,
  });
  const rank = sortable.index + 1;

  const setNodeRef = useCallback(
    (el: HTMLDivElement | null) => {
      ref(el);
      handleRef(el);
    },
    [ref, handleRef],
  );

  return (
    <div
      ref={setNodeRef}
      className={`
        flex touch-none items-center gap-3 px-5 py-4 rounded-2xl border-2 bg-base-100 cursor-grab active:cursor-grabbing
        transition-[border-color,box-shadow,opacity,transform,background-color] duration-200 select-none group
        ${isDragging
          ? 'border-primary/50 bg-primary/4 shadow-lg scale-[1.02] opacity-80 z-50'
          : 'border-base-300/50 hover:border-primary/30 hover:shadow-sm'
        }
      `}
    >
      {/* Rank number */}
      <span
        className={`
          inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold tabular-nums shrink-0 transition-none
          ${isDragging ? 'bg-primary text-primary-content' : 'bg-primary/10 text-primary/70'}
        `}
      >
        {rank}
      </span>

      {/* Drag handle icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        className={`shrink-0 transition-opacity ${isDragging ? 'text-primary opacity-80' : 'text-base-content/20 group-hover:text-base-content/40 opacity-60'}`}
      >
        <circle cx="5" cy="3" r="1.3" />
        <circle cx="11" cy="3" r="1.3" />
        <circle cx="5" cy="8" r="1.3" />
        <circle cx="11" cy="8" r="1.3" />
        <circle cx="5" cy="13" r="1.3" />
        <circle cx="11" cy="13" r="1.3" />
      </svg>

      {/* Item text */}
      <span className={`text-base flex-1 transition-colors duration-200 ${isDragging ? 'text-primary font-medium' : 'text-base-content/70'}`}>
        {item}
      </span>

      {/* Up/Down arrows hint */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-base-content/15 group-hover:text-base-content/30 transition-colors"
      >
        <path d="M12 5v14" />
        <path d="m18 13-6 6-6-6" />
        <path d="m18 11-6-6-6 6" />
      </svg>
    </div>
  );
}

function SortablePreview({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string[];
  onChange: (items: string[]) => void;
}) {
  const canonical = useMemo(() => question.answers.filter(Boolean), [question.answers]);
  const rawValue = value.length > 0 ? value : canonical;
  const randomize = question.settings?.randomizeAnswerOrder === true;
  const sortableOrderKey = orderMatchesCanonical(rawValue, canonical) ? 'canonical' : rawValue.join('\u0001');
  const items = useMemo(() => {
    if (!randomize) return rawValue;
    if (!orderMatchesCanonical(rawValue, canonical)) return rawValue;
    return shuffleDisplayOrder([...canonical]);
  }, [question.guid, randomize, canonical.join('\u0001'), sortableOrderKey]);

  const { rowIds, reorderRowIds } = useSortableRowIds(question.guid, items);

  const handleDragEnd = (event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragEnd']>>[0]) => {
    if (event.canceled || event.operation.canceled) return;

    const { source } = event.operation;
    if (!source) return;

    let oldIndex = -1;
    let newIndex = -1;

    if (isSortable(source) && typeof source.initialIndex === 'number' && typeof source.index === 'number') {
      oldIndex = source.initialIndex;
      newIndex = source.index;
    }

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    if (oldIndex >= items.length || newIndex >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderRowIds(oldIndex, newIndex);
    onChange(reordered);
  };

  return (
    <div className="animate-[fadeSlideIn_0.4s_ease-out]">
      <div className="flex items-start gap-3 mb-2">
        <QuestionStemHeading
          question={question}
          plainClassName="text-2xl font-semibold text-base-content/85 leading-snug flex-1"
        />
        {isQuestionRequired(question) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-error/10 text-error border border-error/20 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            Zorunlu
          </span>
        )}
      </div>

      {/* Question image */}
      {question.image && (
        <div className="mb-6 rounded-xl overflow-hidden border border-base-300/30">
          <img src={question.image} alt="" className="w-full max-h-72 object-contain bg-base-200/30" />
        </div>
      )}

      <p className="text-sm text-base-content/35 mb-8">
        Öğeleri sürükleyerek tercih sıranıza göre sıralayın
      </p>

      {items.length === 0 ? (
        <p className="text-center py-8 text-base-content/30 text-sm">Sıralama öğesi eklenmemiş</p>
      ) : rowIds.length === items.length ? (
        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-2.5">
            {items.map((item, index) => (
              <SortableItem
                key={rowIds[index]}
                sortableId={rowIds[index]}
                questionGuid={question.guid}
                item={item}
                index={index}
              />
            ))}
          </div>
        </DragDropProvider>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Matrix Likert Preview
   ═══════════════════════════════════════════ */

function MatrixLikertPreview({
  question,
  value,
  onChange,
  isMobile = false,
}: {
  question: Question;
  value: Record<number, string[]>;
  onChange: (rowIndex: number, column: string, isMultiple: boolean) => void;
  isMobile?: boolean;
}) {
  const rows = (question.settings?.rows ?? []).filter(Boolean);
  const columns = (question.settings?.columns ?? []).filter(Boolean);
  const matrixType = question.settings?.matrixType ?? 'single';
  const isMultiple = matrixType === 'multiple';

  const questionHeader = (
    <>
      <div className="flex items-start gap-3 mb-2">
        <QuestionStemHeading
          question={question}
          plainClassName={`font-semibold text-base-content/85 leading-snug flex-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}
        />
        {isQuestionRequired(question) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-error/10 text-error border border-error/20 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            Zorunlu
          </span>
        )}
      </div>
      {question.image && (
        <div className="mb-4 rounded-xl overflow-hidden border border-base-300/30">
          <img src={question.image} alt="" className="w-full max-h-48 object-contain bg-base-200/30" />
        </div>
      )}
      <p className="text-sm text-base-content/35 mb-4">
        {isMultiple ? 'Her satır için birden fazla seçenek işaretleyebilirsiniz' : 'Her satır için bir seçenek seçin'}
      </p>
    </>
  );

  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className="animate-[fadeSlideIn_0.4s_ease-out]">
        <QuestionStemHeading
          question={question}
          plainClassName="text-2xl font-semibold text-base-content/85 mb-2 leading-snug"
        />
        <p className="text-sm text-base-content/40 mt-6">
          Bu soru henüz yapılandırılmamış (satır/sütun eksik).
        </p>
      </div>
    );
  }

  /* ── Mobile: accordion per row ── */
  if (isMobile) {
    return <MatrixLikertMobileAccordion rows={rows} columns={columns} value={value} onChange={onChange} isMultiple={isMultiple} questionHeader={questionHeader} />;
  }

  /* ── Desktop: table ── */
  return (
    <div className="animate-[fadeSlideIn_0.4s_ease-out]">
      {questionHeader}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left pb-4 pr-4 text-base-content/50 font-medium min-w-[140px]" />
              {columns.map((col, ci) => (
                <th key={ci} className="text-center pb-4 px-2 text-xs text-base-content/50 font-medium min-w-[80px]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const selectedCols = value[ri] ?? [];
              return (
                <tr key={ri} className="border-t border-base-300/20">
                  <td className="py-4 pr-4 text-base-content/70 font-medium">{row}</td>
                  {columns.map((col, ci) => {
                    const isSelected = selectedCols.includes(col);
                    return (
                      <td key={ci} className="text-center py-4 px-2">
                        <button
                          className="inline-flex items-center justify-center focus:outline-none group"
                          onClick={() => onChange(ri, col, isMultiple)}
                        >
                          <span className={`w-6 h-6 flex items-center justify-center transition-all duration-200 ${isMultiple ? 'rounded-md' : 'rounded-full'} ${isSelected ? 'bg-primary text-primary-content shadow-sm' : 'border-2 border-base-300/50 group-hover:border-primary/40'}`}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Matrix Likert – Mobile Accordion
   ═══════════════════════════════════════════ */

function MatrixLikertMobileAccordion({
  rows,
  columns,
  value,
  onChange,
  isMultiple,
  questionHeader,
}: {
  rows: string[];
  columns: string[];
  value: Record<number, string[]>;
  onChange: (rowIndex: number, column: string, isMultiple: boolean) => void;
  isMultiple: boolean;
  questionHeader: React.ReactNode;
}) {
  // Start with first unanswered row open; -1 = all closed
  const firstUnanswered = rows.findIndex((_, ri) => (value[ri] ?? []).length === 0);
  const [openRow, setOpenRow] = useState<number>(firstUnanswered >= 0 ? firstUnanswered : -1);

  function handleSelect(ri: number, col: string) {
    onChange(ri, col, isMultiple);
    if (!isMultiple) {
      // Auto-advance: close current, open next unanswered
      const nextUnanswered = rows.findIndex((_, idx) => idx > ri && (value[idx] ?? []).length === 0);
      setTimeout(() => {
        setOpenRow(nextUnanswered >= 0 ? nextUnanswered : -1);
      }, 280);
    }
  }

  return (
    <div className="animate-[fadeSlideIn_0.4s_ease-out]">
      {questionHeader}
      <div className="flex flex-col gap-2">
        {rows.map((row, ri) => {
          const selectedCols = value[ri] ?? [];
          const isOpen = openRow === ri;
          const isDone = selectedCols.length > 0;

          return (
            <div
              key={ri}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-primary/40 bg-primary/4'
                  : isDone
                  ? 'border-success/30 bg-success/4'
                  : 'border-base-300/40 bg-base-100'
              }`}
            >
              {/* Accordion header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
                onClick={() => setOpenRow(isOpen ? -1 : ri)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Done indicator */}
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone ? 'bg-success border-success text-white' : 'border-base-300/50'
                  }`}>
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm font-medium text-base-content/80 truncate">{row}</span>
                  {isDone && !isOpen && (
                    <span className="text-xs text-base-content/40 shrink-0">· {selectedCols.join(', ')}</span>
                  )}
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`shrink-0 text-base-content/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  {columns.map((col, ci) => {
                    const isSelected = selectedCols.includes(col);
                    return (
                      <button
                        key={ci}
                        onClick={() => handleSelect(ri, col)}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border text-sm text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/8 text-primary font-medium'
                            : 'border-base-300/40 bg-base-100 text-base-content/70 active:bg-base-200'
                        }`}
                      >
                        <span className={`w-5 h-5 shrink-0 flex items-center justify-center border-2 transition-all duration-200 ${
                          isMultiple ? 'rounded-md' : 'rounded-full'
                        } ${isSelected ? 'bg-primary border-primary text-primary-content' : 'border-base-300/60'}`}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                        {col}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
