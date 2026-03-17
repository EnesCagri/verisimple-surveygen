import { useRef, useState } from 'react';
import type { Question } from '../../types/survey';
import { QuestionType } from '../../types/survey';
import { AnswerEditor } from './AnswerEditor';
import { TextEntrySettings } from './TextEntrySettings';
import { RatingSettings } from './RatingSettings';
import { MatrixLikertSettings } from './MatrixLikertSettings';
import { RichTextSettings } from './RichTextSettings';
import { ControlQuestionSettings } from './ControlQuestionSettings';
import { getDefaultsForType } from '../../utils/question';
import { Tooltip } from '../ui/Tooltip';
import { questionTypeDescriptions } from '../../utils/questionTypeInfo';

/** Convert a File to a base64 data URL */
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
}

/** All available question types with labels and icons */
const typeOptions: { value: QuestionType; label: string; icon: React.JSX.Element }[] = [
  {
    value: QuestionType.SingleChoice,
    label: 'Tek Seçim',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    value: QuestionType.MultipleChoice,
    label: 'Çoklu Seçim',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    value: QuestionType.TextEntry,
    label: 'Metin Girişi',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 10H3" />
        <path d="M21 6H3" />
        <path d="M21 14H3" />
        <path d="M17 18H3" />
      </svg>
    ),
  },
  {
    value: QuestionType.Rating,
    label: 'Derecelendirme',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    value: QuestionType.MatrixLikert,
    label: 'Matrix Likert',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    value: QuestionType.Sortable,
    label: 'Sıralama',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="3" y2="18" /><path d="M3 6l3-3 3 3" /><path d="M3 18l3 3 3-3" />
        <line x1="12" y1="6" x2="21" y2="6" /><line x1="12" y1="12" x2="21" y2="12" /><line x1="12" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
  {
    value: QuestionType.RichText,
    label: 'Zengin Metin',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
];

/** Question types that have predefined answer options */
const hasAnswerOptions = (type: QuestionType): boolean =>
  type === QuestionType.SingleChoice || type === QuestionType.MultipleChoice || type === QuestionType.Sortable;

export function QuestionEditor({ question, onUpdate }: QuestionEditorProps) {
  const questionImageRef = useRef<HTMLInputElement>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === question.type) return;

    // Reset answers & settings to sensible defaults for the new type
    const defaults = getDefaultsForType(newType);
    onUpdate(question.guid, {
      type: newType,
      ...defaults,
    });
  };

  const handleQuestionImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const base64 = await fileToBase64(file);
      onUpdate(question.guid, { image: base64 });
    } catch {
      // Ignore errors
    }
  };

  return (
    <div className="rounded-2xl bg-base-100 shadow-sm border border-base-300/40 overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-base-300/40 bg-base-200/30">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-content text-sm font-bold">
          {question.order}
        </span>
        <h3 className="text-base font-semibold text-base-content/80">
          Soru Düzenle
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Question Text */}
        <div>
          <p className="text-sm font-medium text-base-content/60 mb-2">Soru Metni</p>
          <textarea
            className="textarea textarea-bordered w-full min-h-24 resize-none rounded-xl bg-base-100 border-base-300/60 focus:border-primary/40 text-base leading-relaxed"
            placeholder="Sorunuzu yazın..."
            value={question.text}
            onChange={(e) =>
              onUpdate(question.guid, { text: e.target.value })
            }
          />
        </div>

        {/* Question Image */}
        <div>
          <p className="text-sm font-medium text-base-content/60 mb-2">Soru Görseli</p>
          {question.image ? (
            <div className="relative group rounded-xl overflow-hidden border-2 border-base-300/40">
              <img
                src={question.image}
                alt="Soru görseli"
                className="w-full max-h-56 object-contain bg-base-200/30"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-white hover:bg-white/20 rounded-xl"
                  onClick={() => questionImageRef.current?.click()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Değiştir
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-white hover:bg-error/30 rounded-xl"
                  onClick={() => onUpdate(question.guid, { image: undefined })}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Kaldır
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`
                relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200
                ${isDraggingImage
                  ? 'border-primary bg-primary/5'
                  : 'border-base-300/50 bg-base-200/20 hover:border-primary/40 hover:bg-primary/[0.02]'
                }
              `}
              onClick={() => questionImageRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
              onDragLeave={() => setIsDraggingImage(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingImage(false);
                const file = e.dataTransfer.files[0];
                if (file) handleQuestionImage(file);
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-base-content/30">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-sm text-base-content/40 font-medium">
                Görsel yüklemek için tıklayın veya sürükleyin
              </p>
              <p className="text-xs text-base-content/25 mt-1">PNG, JPG, GIF, WebP</p>
            </div>
          )}
          <input
            ref={questionImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleQuestionImage(file);
              e.target.value = '';
            }}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-base-300/30" />

        {/* Question Type */}
        <div>
          <p className="text-sm font-medium text-base-content/60 mb-2">Soru Tipi</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {typeOptions.map((opt) => {
              const isActive = question.type === opt.value;
              return (
                <Tooltip
                  key={opt.value}
                  content={questionTypeDescriptions[opt.value]}
                  position="bottom"
                  delay={400}
                >
                  <button
                    className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-[13px] font-medium transition-all duration-200 w-full
                      ${isActive
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-base-300/40 text-base-content/50 hover:border-base-300 hover:text-base-content/70'
                      }
                    `}
                    onClick={() => handleTypeChange(opt.value)}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-primary' : 'text-base-content/40'}`}>
                      {opt.icon}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-base-300/30" />

        {/* Required Toggle */}
        <div
          className={`
            flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
            ${question.required ? 'border-error/40 bg-error/5' : 'border-base-300/40 bg-base-200/30'}
          `}
          onClick={() => onUpdate(question.guid, { required: !question.required })}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-base-content/80">Zorunlu Soru</p>
              {question.required && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-error/10 text-error border border-error/20">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-base-content/50">
              {question.required
                ? 'Bu soru cevaplanmadan sonraki soruya geçilemez'
                : 'Bu soru opsiyoneldir, atlanabilir'}
            </p>
          </div>

          {/* Custom switch */}
          <div
            className={`
              relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200
              ${question.required ? 'bg-error' : 'bg-base-300'}
            `}
          >
            <div
              className={`
                absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
                ${question.required ? 'left-7' : 'left-1'}
              `}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-base-300/30" />

        {/* Type-specific settings */}
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

        {question.type === QuestionType.TextEntry && (
          <TextEntrySettings
            settings={question.settings ?? { maxLength: 1250 }}
            onChange={(settings) => onUpdate(question.guid, { settings })}
          />
        )}

        {question.type === QuestionType.Rating && (
          <RatingSettings
            settings={question.settings ?? { ratingCount: 5 }}
            onChange={(settings) => onUpdate(question.guid, { settings })}
          />
        )}

        {question.type === QuestionType.MatrixLikert && (
          <MatrixLikertSettings
            settings={question.settings ?? { rows: [''], columns: [''], matrixType: 'single' }}
            onChange={(settings) => onUpdate(question.guid, { settings })}
          />
        )}

        {question.type === QuestionType.RichText && (
          <RichTextSettings
            settings={question.settings ?? { richContent: '', hasResponse: false, responseMaxLength: 2000, responsePlaceholder: 'Cevabınızı yazın...' }}
            onChange={(settings) => onUpdate(question.guid, { settings })}
          />
        )}

        {/* Control Question Settings - Available for all question types */}
        <ControlQuestionSettings
          question={question}
          settings={question.settings ?? {}}
          onChange={(settings) => onUpdate(question.guid, { settings })}
        />
      </div>
    </div>
  );
}
