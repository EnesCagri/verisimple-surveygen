import { QuestionType, type QuestionSettings } from '../../types/survey';
import { questionTypeLabels, questionTypeDescriptions } from '../../utils/questionTypeInfo';

export interface ConditionSummary {
  description: string;
  actionLabel: string;
  isEnd: boolean;
}

interface QuestionNodeTooltipProps {
  order: number;
  text: string;
  type: QuestionType;
  answers: string[];
  settings?: QuestionSettings;
  conditions: ConditionSummary[];
}

const typeIcons: Record<QuestionType, React.JSX.Element> = {
  [QuestionType.SingleChoice]: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  [QuestionType.MultipleChoice]: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="m9 12 2 2 4-4" />
    </svg>
  ),
  [QuestionType.TextEntry]: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 10H3" /><path d="M21 6H3" /><path d="M21 14H3" /><path d="M17 18H3" />
    </svg>
  ),
  [QuestionType.Rating]: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  [QuestionType.MatrixLikert]: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  [QuestionType.Sortable]: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="3" y2="18" /><path d="M3 6l3-3 3 3" /><path d="M3 18l3 3 3-3" />
      <line x1="12" y1="6" x2="21" y2="6" /><line x1="12" y1="12" x2="21" y2="12" /><line x1="12" y1="18" x2="21" y2="18" />
    </svg>
  ),
};

export function QuestionNodeTooltip({
  order,
  text,
  type,
  answers,
  settings,
  conditions,
}: QuestionNodeTooltipProps) {
  const icon = typeIcons[type];
  const typeLabel = questionTypeLabels[type];
  const typeDesc = questionTypeDescriptions[type];
  const isControl = settings?.isControlQuestion === true;

  return (
    <div className="w-[320px] bg-neutral/95 backdrop-blur-lg text-neutral-content rounded-2xl shadow-2xl shadow-black/20 animate-tooltip-in overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${isControl ? 'bg-accent text-accent-content' : 'bg-primary text-primary-content'}`}
          >
            {order}
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-primary/80">
            {icon}
            <span className="text-sm font-semibold">{typeLabel}</span>
          </div>
          {isControl && (
            <span className="shrink-0 rounded-md border border-accent/40 bg-accent/20 px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-accent">
              Kontrol
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug text-neutral-content/90">
          {text || 'Soru metni girilmemiş'}
        </p>
        <p className="text-xs mt-1.5 text-neutral-content/40 italic">{typeDesc}</p>
      </div>

      {/* Type-specific details */}
      <div className="px-4 py-3 border-b border-white/10">
        <TypeDetails
          type={type}
          answers={answers}
          settings={settings}
        />
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
              <path d="M12 3v6" />
              <circle cx="12" cy="12" r="3" />
              <path d="m8 15-3 3h14l-3-3" />
            </svg>
            <span className="text-xs font-semibold text-warning/90">
              {conditions.length} Koşul
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {conditions.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-neutral-content/50">•</span>
                <span className="text-neutral-content/70 flex-1 truncate">{c.description}</span>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold ${
                    c.isEnd
                      ? 'bg-error/20 text-error'
                      : 'bg-success/20 text-success'
                  }`}
                >
                  {c.actionLabel}
                </span>
              </div>
            ))}
            {conditions.length > 4 && (
              <span className="text-xs text-neutral-content/40 mt-0.5">
                +{conditions.length - 4} koşul daha...
              </span>
            )}
          </div>
        </div>
      )}

      {conditions.length === 0 && (
        <div className="px-4 py-2.5">
          <span className="text-xs text-neutral-content/30 italic">Koşul tanımlanmamış</span>
        </div>
      )}
    </div>
  );
}

// ---- Type-specific detail renderer ----

function TypeDetails({
  type,
  answers,
  settings,
}: {
  type: QuestionType;
  answers: string[];
  settings?: QuestionSettings;
}) {
  switch (type) {
    case QuestionType.SingleChoice:
    case QuestionType.MultipleChoice:
      return <ChoiceDetails answers={answers} isMultiple={type === QuestionType.MultipleChoice} />;
    case QuestionType.TextEntry:
      return <TextEntryDetails settings={settings} />;
    case QuestionType.Rating:
      return <RatingDetails settings={settings} />;
    case QuestionType.MatrixLikert:
      return <MatrixDetails settings={settings} />;
    case QuestionType.Sortable:
      return <SortableDetails answers={answers} />;
    default:
      return <span className="text-xs text-neutral-content/40">Detay yok</span>;
  }
}

function ChoiceDetails({ answers, isMultiple }: { answers: string[]; isMultiple: boolean }) {
  if (answers.length === 0) {
    return <span className="text-xs text-neutral-content/40 italic">Seçenek eklenmemiş</span>;
  }

  return (
    <div>
      <p className="text-xs font-semibold text-neutral-content/50 uppercase tracking-wider mb-1.5">
        {isMultiple ? 'Seçenekler (çoklu)' : 'Seçenekler'}
      </p>
      <div className="flex flex-col gap-1">
        {answers.slice(0, 6).map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-xs font-bold text-neutral-content/50 shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-xs text-neutral-content/80 truncate">{a}</span>
          </div>
        ))}
        {answers.length > 6 && (
          <span className="text-xs text-neutral-content/40 mt-0.5 pl-7">
            +{answers.length - 6} seçenek daha
          </span>
        )}
      </div>
    </div>
  );
}

function TextEntryDetails({ settings }: { settings?: QuestionSettings }) {
  const maxLen = settings?.maxLength ?? 1250;
  const placeholder = settings?.placeholder;
  const richStem = settings?.useRichQuestionText === true;
  const infoOnly = settings?.richInformationOnly === true;

  return (
    <div>
      <p className="text-xs font-semibold text-neutral-content/50 uppercase tracking-wider mb-1.5">
        Metin Ayarları
      </p>
      <div className="flex flex-col gap-1.5">
        {richStem && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-content/60">Soru metni:</span>
            <span className="font-semibold text-neutral-content/80">Zengin (HTML)</span>
          </div>
        )}
        {infoOnly && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-content/60">Mod:</span>
            <span className="font-semibold text-neutral-content/80">Bilgi slaytı</span>
          </div>
        )}
        {!infoOnly && (
          <div className="flex items-center gap-2 text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-content/40">
              <path d="M17 10H3" /><path d="M21 6H3" />
            </svg>
            <span className="text-neutral-content/60">Maks. karakter:</span>
            <span className="font-semibold text-neutral-content/80">{maxLen}</span>
          </div>
        )}
        {!infoOnly && placeholder && (
          <div className="flex items-center gap-2 text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-content/40">
              <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
            </svg>
            <span className="text-neutral-content/60 truncate">"{placeholder}"</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingDetails({ settings }: { settings?: QuestionSettings }) {
  const count = settings?.ratingCount ?? 5;
  const labels = settings?.ratingLabels;

  return (
    <div>
      <p className="text-xs font-semibold text-neutral-content/50 uppercase tracking-wider mb-1.5">
        Derecelendirme
      </p>
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: count }).map((_, i) => (
          <svg
            key={i}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-warning/70"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        <span className="text-xs text-neutral-content/50 ml-1">({count} puan)</span>
      </div>
      {labels && (
        <div className="flex justify-between text-xs text-neutral-content/40">
          <span>{labels.low}</span>
          <span>{labels.high}</span>
        </div>
      )}
    </div>
  );
}

function MatrixDetails({ settings }: { settings?: QuestionSettings }) {
  const rows = settings?.rows ?? [];
  const columns = settings?.columns ?? [];

  return (
    <div>
      <p className="text-xs font-semibold text-neutral-content/50 uppercase tracking-wider mb-2">
        Matris Yapısı
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Rows */}
        <div>
          <p className="text-xs text-neutral-content/40 mb-1">
            Satırlar ({rows.length})
          </p>
          <div className="flex flex-col gap-0.5">
            {rows.slice(0, 4).map((r, i) => (
              <span key={i} className="text-xs text-neutral-content/70 truncate">
                {i + 1}. {r}
              </span>
            ))}
            {rows.length > 4 && (
              <span className="text-[0.5625rem] text-neutral-content/30">+{rows.length - 4} daha</span>
            )}
            {rows.length === 0 && (
              <span className="text-xs text-neutral-content/30 italic">Boş</span>
            )}
          </div>
        </div>

        {/* Columns */}
        <div>
          <p className="text-xs text-neutral-content/40 mb-1">
            Sütunlar ({columns.length})
          </p>
          <div className="flex flex-col gap-0.5">
            {columns.slice(0, 4).map((c, i) => (
              <span key={i} className="text-xs text-neutral-content/70 truncate">
                {i + 1}. {c}
              </span>
            ))}
            {columns.length > 4 && (
              <span className="text-[0.5625rem] text-neutral-content/30">+{columns.length - 4} daha</span>
            )}
            {columns.length === 0 && (
              <span className="text-xs text-neutral-content/30 italic">Boş</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableDetails({ answers }: { answers: string[] }) {
  const items = (Array.isArray(answers) ? answers : []).filter(Boolean);

  if (items.length === 0) {
    return <span className="text-xs text-neutral-content/40 italic">Sıralama öğesi eklenmemiş</span>;
  }

  return (
    <div>
      <p className="text-xs font-semibold text-neutral-content/50 uppercase tracking-wider mb-1.5">
        Sıralanacak Öğeler
      </p>
      <div className="flex flex-col gap-1">
        {items.slice(0, 6).map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-xs font-bold text-neutral-content/50 shrink-0">
              {i + 1}
            </span>
            <span className="text-xs text-neutral-content/80 truncate">{a}</span>
          </div>
        ))}
        {items.length > 6 && (
          <span className="text-xs text-neutral-content/40 mt-0.5 pl-7">
            +{items.length - 6} öğe daha
          </span>
        )}
      </div>
    </div>
  );
}
