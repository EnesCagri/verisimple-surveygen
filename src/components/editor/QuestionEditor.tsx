import { useRef, useState, useEffect } from 'react';
import type { Question, QuestionSettings } from '../../types/survey';
import { QuestionType } from '../../types/survey';
import { AnswerEditor } from './AnswerEditor';
import { TextEntrySettings } from './TextEntrySettings';
import { RatingSettings } from './RatingSettings';
import { MatrixLikertSettings } from './MatrixLikertSettings';
import { RichQuestionStemEditor } from './RichQuestionStemEditor';
import { getDefaultsForType } from '../../utils/question';
import { questionTypeDescriptions } from '../../utils/questionTypeInfo';
import { isQuestionRequired } from '../../utils/questionRequired';
import { supportsControlQuestionType } from '../../utils/controlQuestion';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface QuestionEditorProps {
  question: Question;
  onUpdate: (guid: string, updates: Partial<Omit<Question, 'guid'>>) => void;
  onDeleteQuestion: (guid: string) => void;
}

/** İki adımda aynı üst şerit: rozet, padding, minimum yükseklik */
const QUESTION_EDITOR_HEADER_ROW =
  'flex min-h-[3.25rem] flex-wrap items-center gap-x-2 gap-y-2 border-b border-base-300/40 bg-base-200/30 px-4 py-3 sm:px-6';

function OrderBadge({ order }: { order: number }) {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-content">
      {order}
    </span>
  );
}

function DeleteQuestionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs h-9 min-h-9 shrink-0 gap-1 border border-transparent px-2 text-error/85 hover:border-error/25 hover:bg-error/10 hover:text-error"
      onClick={onClick}
      title="Soruyu sil"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
      <span className="hidden font-medium sm:inline">Sil</span>
    </button>
  );
}

function QuestionBehaviorToolbar({
  required,
  isControl,
  controlTypeOk,
  showShuffle,
  randomizeAnswerOrder,
  onToggleRequired,
  onToggleControl,
  onToggleRandomize,
}: {
  required: boolean;
  isControl: boolean;
  controlTypeOk: boolean;
  showShuffle: boolean;
  randomizeAnswerOrder: boolean;
  onToggleRequired: () => void;
  onToggleControl: (enabled: boolean) => void;
  onToggleRandomize?: () => void;
}) {
  return (
    <div className="mb-3 flex w-full flex-wrap items-center justify-evenly gap-y-2 rounded-xl border border-base-300/45 bg-base-200/25 px-3 py-2.5">
      <div
        role="switch"
        aria-checked={required}
        tabIndex={0}
        className="flex min-w-0 shrink-0 cursor-pointer items-center justify-end gap-1.5 rounded-lg py-0.5 pr-0.5 select-none outline-none hover:bg-base-300/30 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1"
        onClick={onToggleRequired}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onToggleRequired();
          }
        }}
      >
        <span className={`text-xs font-semibold ${required ? 'text-error/90' : 'text-base-content/40'}`}>Zorunlu</span>
        <MiniSwitch checked={required} color="error" decorative />
      </div>

      {controlTypeOk && (
        <div
          role="switch"
          aria-checked={isControl}
          tabIndex={0}
          className="flex min-w-0 shrink-0 cursor-pointer items-center justify-end gap-1.5 rounded-lg py-0.5 pr-0.5 select-none outline-none hover:bg-base-300/30 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1"
          onClick={() => onToggleControl(!isControl)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onToggleControl(!isControl);
            }
          }}
        >
          <span className={`text-xs font-semibold ${isControl ? 'text-primary/90' : 'text-base-content/40'}`}>Kontrol</span>
          <MiniSwitch checked={isControl} color="primary" decorative />
        </div>
      )}

      {showShuffle && onToggleRandomize && (
        <div
          role="switch"
          aria-checked={randomizeAnswerOrder}
          tabIndex={0}
          className="flex min-w-0 max-w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg py-0.5 pl-1 pr-0.5 select-none outline-none hover:bg-base-300/30 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1"
          onClick={onToggleRandomize}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onToggleRandomize();
            }
          }}
        >
          <span className={`text-xs font-semibold ${randomizeAnswerOrder ? 'text-primary/90' : 'text-base-content/40'}`}>
            Şıkları karıştır
          </span>
          <MiniSwitch checked={randomizeAnswerOrder} color="primary" decorative />
        </div>
      )}
    </div>
  );
}

const typeOptions: { value: QuestionType; label: string; desc: string; icon: React.JSX.Element }[] = [
  {
    value: QuestionType.SingleChoice,
    label: 'Tek Seçim',
    desc: questionTypeDescriptions[QuestionType.SingleChoice],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    value: QuestionType.MultipleChoice,
    label: 'Çoklu Seçim',
    desc: questionTypeDescriptions[QuestionType.MultipleChoice],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    value: QuestionType.TextEntry,
    label: 'Metin Girişi',
    desc: questionTypeDescriptions[QuestionType.TextEntry],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 10H3" /><path d="M21 6H3" /><path d="M21 14H3" /><path d="M17 18H3" />
      </svg>
    ),
  },
  {
    value: QuestionType.Rating,
    label: 'Derecelendirme',
    desc: questionTypeDescriptions[QuestionType.Rating],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    value: QuestionType.MatrixLikert,
    label: 'Matrix Likert',
    desc: questionTypeDescriptions[QuestionType.MatrixLikert],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    value: QuestionType.Sortable,
    label: 'Sıralama',
    desc: questionTypeDescriptions[QuestionType.Sortable],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="3" y2="18" /><path d="M3 6l3-3 3 3" /><path d="M3 18l3 3 3-3" />
        <line x1="12" y1="6" x2="21" y2="6" /><line x1="12" y1="12" x2="21" y2="12" /><line x1="12" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
];

const hasAnswerOptions = (type: QuestionType): boolean =>
  type === QuestionType.SingleChoice || type === QuestionType.MultipleChoice || type === QuestionType.Sortable;

function questionNeedsTypeStep(q: Question): boolean {
  if (q.text.trim().length > 0) return false;
  const rich = (q.settings?.richContent ?? '').replace(/<[^>]*>/g, '').trim();
  if (q.settings?.useRichQuestionText && rich.length > 0) return false;
  return true;
}

function htmlToPlain(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ────────────────────────── Compact toggle ────────────────────────── */

function MiniSwitch({
  checked,
  color = 'primary',
  decorative = false,
}: {
  checked: boolean;
  color?: 'primary' | 'error';
  /** Üst öğede role="switch" varken yinelenen rolü önlemek için */
  decorative?: boolean;
}) {
  const bg = checked
    ? color === 'error' ? 'bg-error' : 'bg-primary'
    : 'bg-base-300';
  const track = (
    <span
      className={`relative inline-flex shrink-0 w-9 h-5 rounded-full transition-colors duration-200 pointer-events-none ${bg}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'left-[18px]' : 'left-0.5'}`}
      />
    </span>
  );
  if (decorative) {
    return <span aria-hidden>{track}</span>;
  }
  return (
    <span role="switch" aria-checked={checked}>
      {track}
    </span>
  );
}

/* ────────────────────────── Main component ────────────────────────── */

export function QuestionEditor({ question, onUpdate, onDeleteQuestion }: QuestionEditorProps) {
  const imgRef = useRef<HTMLInputElement>(null);
  const [editStep, setEditStep] = useState<'type' | 'edit'>(() =>
    questionNeedsTypeStep(question) ? 'type' : 'edit',
  );

  useEffect(() => {
    setEditStep(questionNeedsTypeStep(question) ? 'type' : 'edit');
  }, [question.guid]);

  const currentType = typeOptions.find((t) => t.value === question.type);

  const handleTypeSelect = (newType: QuestionType) => {
    if (newType !== question.type) {
      const defaults = getDefaultsForType(newType);
      onUpdate(question.guid, { type: newType, ...defaults });
    }
    setEditStep('edit');
  };

  const handleQuestionImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const base64 = await fileToBase64(file);
      onUpdate(question.guid, { image: base64 });
    } catch { /* ignore */ }
  };

  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const openDeleteDialog = () => {
    deleteDialogRef.current?.showModal();
  };

  const closeDeleteDialog = () => {
    deleteDialogRef.current?.close();
  };

  const confirmDeleteQuestion = () => {
    closeDeleteDialog();
    onDeleteQuestion(question.guid);
  };

  const deleteConfirmDialog = (
    <dialog
      ref={deleteDialogRef}
      className="modal"
      aria-labelledby="delete-question-dialog-title"
      onClick={(e) => {
        if (e.target === deleteDialogRef.current) closeDeleteDialog();
      }}
    >
      <div className="modal-box max-w-md rounded-2xl border border-base-300/40 shadow-xl">
        <h3 id="delete-question-dialog-title" className="text-lg font-bold text-base-content/90">
          Soruyu sil?
        </h3>
        <p className="mt-2 text-sm text-base-content/60">
          Soru {question.order} kaldırılır. Bu soruya bağlı koşullar silinir; akıştaki bağlantılar güncellenir. Bu işlem geri alınamaz.
        </p>
        <div className="modal-action mt-6">
          <button type="button" className="btn btn-ghost rounded-xl" onClick={closeDeleteDialog}>
            Vazgeç
          </button>
          <button type="button" className="btn btn-error rounded-xl" onClick={confirmDeleteQuestion}>
            Sil
          </button>
        </div>
      </div>
    </dialog>
  );

  /* ─── Step 1: Type picker ─── */

  if (editStep === 'type') {
    return (
      <>
      <div className="rounded-2xl bg-base-100 shadow-sm border border-base-300/40 overflow-hidden">
        <div className={QUESTION_EDITOR_HEADER_ROW}>
          <OrderBadge order={question.order} />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
            <h3 className="shrink-0 text-base font-semibold leading-tight text-base-content/80">Soru Tipi Seçin</h3>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* Geri + tip rozeti alanı (düzenleme adımıyla hizalı) */}
            <span className="inline-flex h-9 min-w-[4.75rem] shrink-0" aria-hidden />
            <div
              className="flex min-h-[1.75rem] min-w-[6.5rem] max-w-22 items-center gap-1 rounded-full border border-transparent px-2.5 py-1 sm:max-w-44"
              aria-hidden
            />
            <DeleteQuestionButton onClick={openDeleteDialog} />
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-2.5">
            {typeOptions.map((opt) => {
              const isActive = question.type === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleTypeSelect(opt.value)}
                  className={`
                    flex items-start gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-all duration-150 group
                    ${isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-base-300/40 hover:border-primary/40 hover:bg-primary/2'
                    }
                  `}
                >
                  <span className={`
                    shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                    ${isActive ? 'bg-primary/10 text-primary' : 'bg-base-200/60 text-base-content/40 group-hover:text-primary/60'}
                  `}>
                    {opt.icon}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-primary' : 'text-base-content/70'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-base-content/40 mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {deleteConfirmDialog}
      </>
    );
  }

  /* ─── Step 2: Compact editor ─── */

  const required = isQuestionRequired(question);
  const settings: QuestionSettings = question.settings ?? {};
  const isControl = settings.isControlQuestion ?? false;
  const correctAnswer = settings.correctAnswer ?? [];
  const controlTypeOk = supportsControlQuestionType(question.type);

  const handleToggleRequired = () => {
    onUpdate(question.guid, { required: !required });
  };

  const handleToggleControl = (enabled: boolean) => {
    if (enabled) {
      let defaultCorrect: string[] = [];
      if (question.type === QuestionType.SingleChoice || question.type === QuestionType.MultipleChoice) {
        defaultCorrect = question.answers.length > 0 ? [question.answers[0]] : [];
      } else if (question.type === QuestionType.Rating) {
        const ratingCount = settings.ratingCount ?? 5;
        defaultCorrect = [Math.ceil(ratingCount / 2).toString()];
      }
      onUpdate(question.guid, { settings: { ...settings, isControlQuestion: true, correctAnswer: defaultCorrect } });
    } else {
      onUpdate(question.guid, { settings: { ...settings, isControlQuestion: false, correctAnswer: undefined } });
    }
  };

  const handleCorrectAnswer = (answer: string, checked: boolean) => {
    if (question.type === QuestionType.MultipleChoice) {
      const next = checked ? [...correctAnswer, answer] : correctAnswer.filter((a) => a !== answer);
      onUpdate(question.guid, { settings: { ...settings, correctAnswer: next } });
    } else {
      onUpdate(question.guid, { settings: { ...settings, correctAnswer: checked ? [answer] : [] } });
    }
  };

  const toggleRichQuestionStem = () => {
    const on = !question.settings?.useRichQuestionText;
    if (on) {
      const existing = (question.settings?.richContent ?? '').trim();
      const seed =
        existing ||
        (question.text.trim()
          ? `<p>${escapeHtmlText(question.text.trim())}</p>`
          : '<p></p>');
      onUpdate(question.guid, {
        settings: { ...question.settings, useRichQuestionText: true, richContent: seed },
      });
    } else {
      const plain =
        question.text.trim() ||
        htmlToPlain(question.settings?.richContent ?? '');
      onUpdate(question.guid, {
        text: plain,
        settings: { ...question.settings, useRichQuestionText: false, richContent: undefined },
      });
    }
  };

  return (
    <>
    <div className="rounded-2xl bg-base-100 shadow-sm border border-base-300/40 overflow-hidden">
      {/* Header: tip adımı ile aynı şerit ölçüleri */}
      <div className={QUESTION_EDITOR_HEADER_ROW}>
        <OrderBadge order={question.order} />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
          <h3 className="shrink-0 text-base font-semibold leading-tight text-base-content/80">Soru Düzenle</h3>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm h-9 min-h-9 shrink-0 gap-1 rounded-lg border border-base-content/15 bg-base-100 px-2.5 text-sm font-medium text-base-content/80 shadow-sm hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            onClick={() => setEditStep('type')}
            title="Soru tipi seçimine dön"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Geri
          </button>
          <div
            className="flex max-w-22 sm:max-w-44 items-center gap-1 truncate rounded-full border border-base-300/50 bg-base-100/80 px-2.5 py-1 text-[11px] text-base-content/50"
            title={currentType?.label}
          >
            <span className="shrink-0 opacity-70">{currentType?.icon}</span>
            <span className="truncate font-medium">{currentType?.label}</span>
          </div>
          <DeleteQuestionButton onClick={openDeleteDialog} />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Soru metni — düz / zengin (kenarlıksız satır) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-base-content/45">Soru metni</p>
            <div
              role="switch"
              aria-checked={!!question.settings?.useRichQuestionText}
              tabIndex={0}
              className="flex cursor-pointer items-center gap-2 select-none rounded-lg py-0.5 pl-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1"
              onClick={toggleRichQuestionStem}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggleRichQuestionStem();
                }
              }}
            >
              <span
                className={`text-sm font-medium ${question.settings?.useRichQuestionText ? 'text-base-content/85' : 'text-base-content/45'}`}
              >
                Zengin metin
              </span>
              <MiniSwitch checked={!!question.settings?.useRichQuestionText} color="primary" decorative />
            </div>
          </div>
          {question.settings?.useRichQuestionText ? (
            <RichQuestionStemEditor
              html={question.settings?.richContent ?? ''}
              onHtmlChange={(richContent) =>
                onUpdate(question.guid, { settings: { ...question.settings, richContent } })
              }
            />
          ) : (
            <textarea
              className="textarea textarea-bordered w-full min-h-20 resize-none rounded-xl bg-base-100 border-base-300/60 focus:border-primary/40 text-base leading-relaxed"
              placeholder="Sorunuzu yazın..."
              value={question.text}
              onChange={(e) => onUpdate(question.guid, { text: e.target.value })}
            />
          )}
        </div>

        {/* Compact image upload */}
        {question.image ? (
          <div className="flex items-center gap-3">
            <div className="relative group w-20 h-14 rounded-lg overflow-hidden border border-base-300/50 shrink-0">
              <img src={question.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button type="button" className="p-1 rounded text-white/80 hover:text-white" onClick={() => imgRef.current?.click()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </button>
                <button type="button" className="p-1 rounded text-white/80 hover:text-error" onClick={() => onUpdate(question.guid, { image: undefined })}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            <span className="text-xs text-base-content/30">Soru görseli</span>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/35 bg-base-200/25 px-4 py-3.5 text-sm font-medium text-base-content/70 transition-colors hover:border-primary/55 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
            onClick={() => imgRef.current?.click()}
            title="Bilgisayarınızdan görsel dosyası seçmek için tıklayın"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Görsel seç
          </button>
        )}
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleQuestionImage(file);
            e.target.value = '';
          }}
        />

        {/* Divider */}
        <div className="border-t border-base-300/30" />

        {/* Zorunlu / Kontrol (+ karıştır): seçenekli sorularda seçeneklerin hemen üstünde */}
        {hasAnswerOptions(question.type) && (
          <QuestionBehaviorToolbar
            required={required}
            isControl={isControl}
            controlTypeOk={controlTypeOk}
            showShuffle
            randomizeAnswerOrder={!!question.settings?.randomizeAnswerOrder}
            onToggleRequired={handleToggleRequired}
            onToggleControl={handleToggleControl}
            onToggleRandomize={() =>
              onUpdate(question.guid, {
                settings: {
                  ...question.settings,
                  randomizeAnswerOrder: !question.settings?.randomizeAnswerOrder,
                },
              })
            }
          />
        )}

        {/* Type-specific content */}
        {hasAnswerOptions(question.type) && (
          <AnswerEditor
            answers={question.answers}
            answerImages={question.settings?.answerImages}
            onChange={(answers) => onUpdate(question.guid, { answers })}
            onAnswerImagesChange={(answerImages) =>
              onUpdate(question.guid, { settings: { ...question.settings, answerImages } })
            }
          />
        )}

        {!hasAnswerOptions(question.type) && (
          <QuestionBehaviorToolbar
            required={required}
            isControl={isControl}
            controlTypeOk={controlTypeOk}
            showShuffle={false}
            randomizeAnswerOrder={false}
            onToggleRequired={handleToggleRequired}
            onToggleControl={handleToggleControl}
          />
        )}

        {question.type === QuestionType.TextEntry && (
          <div className="space-y-3">
            <TextEntrySettings
              settings={question.settings ?? { maxLength: 1250 }}
              onChange={(s) => onUpdate(question.guid, { settings: s })}
            />
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-base-content/55">
              <input
                type="checkbox"
                className="checkbox checkbox-xs checkbox-primary"
                checked={!!question.settings?.richInformationOnly}
                onChange={(e) =>
                  onUpdate(question.guid, {
                    settings: { ...question.settings, richInformationOnly: e.target.checked },
                  })
                }
              />
              Yanıt alanı olmadan bilgi slaytı (salt içerik)
            </label>
          </div>
        )}

        {question.type === QuestionType.Rating && (
          <RatingSettings
            settings={question.settings ?? { ratingCount: 5 }}
            onChange={(s) => onUpdate(question.guid, { settings: s })}
          />
        )}

        {question.type === QuestionType.MatrixLikert && (
          <MatrixLikertSettings
            settings={question.settings ?? { rows: [''], columns: [''], matrixType: 'single' }}
            onChange={(s) => onUpdate(question.guid, { settings: s })}
          />
        )}

        {/* Divider */}
        <div className="border-t border-base-300/30" />

        {/* Control question: correct answer picker */}
        {isControl && controlTypeOk && (
          <div className="space-y-2 px-4 py-3 rounded-xl border border-primary/30 bg-primary/3">
            <p className="text-xs font-semibold text-base-content/60">
              {question.type === QuestionType.MultipleChoice ? 'Doğru cevapları seçin' : 'Doğru cevabı seçin'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(question.type === QuestionType.Rating
                ? Array.from({ length: settings.ratingCount ?? 5 }, (_, i) => (i + 1).toString())
                : question.answers
              ).map((answer, idx) => {
                const isCorrect = correctAnswer.includes(answer);
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${isCorrect
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-base-300/50 text-base-content/50 hover:border-primary/40'
                      }
                    `}
                    onClick={() => handleCorrectAnswer(answer, !isCorrect)}
                  >
                    {answer || `Seçenek ${idx + 1}`}
                    {isCorrect && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="inline ml-1 -mt-px">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Unsupported control question warning */}
        {isControl && !controlTypeOk && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-warning/40 bg-warning/10 text-xs text-base-content/60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning shrink-0">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Bu soru tipi kontrol sorusu olarak desteklenmiyor.
            <button type="button" className="ml-auto text-warning font-medium hover:underline" onClick={() => handleToggleControl(false)}>Kapat</button>
          </div>
        )}
      </div>
    </div>
    {deleteConfirmDialog}
    </>
  );
}
