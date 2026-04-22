import { Tooltip } from '../ui/Tooltip';

interface TopBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onBack?: () => void;
  onPreview?: () => void;
  onToggleAI?: () => void;
  isAIOpen?: boolean;
  /** Eksik/geçersiz soru varsa kaydet engellenir */
  saveDisabled?: boolean;
  saveDisabledReason?: string;
}

export function TopBar({ title, onTitleChange, onSave, onBack, onPreview, onToggleAI, isAIOpen, saveDisabled, saveDisabledReason }: TopBarProps) {
  return (
    <header className="flex items-center gap-4 bg-base-100 border-b border-base-300/40 px-5 py-3 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
      {/* Left: back + title */}
      <div className="flex items-center gap-3 flex-1">
        {onBack && (
          <Tooltip content="Panoya dön" position="bottom">
            <button
              className="p-2 rounded-xl hover:bg-base-200 text-base-content/50 hover:text-base-content transition-colors"
              onClick={onBack}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          </Tooltip>
        )}
        <Tooltip content="Anket başlığını buradan düzenleyebilirsiniz" position="bottom">
          <div className="group flex items-center gap-2.5 min-w-0 max-w-[min(28rem,calc(100vw-12rem))] rounded-xl border border-transparent px-2.5 py-1.5 -mx-1 transition-colors hover:border-base-300/50 hover:bg-base-200/35 focus-within:border-primary/35 focus-within:bg-base-200/25 focus-within:shadow-sm">
            <span
              className="shrink-0 text-base-content/35 group-hover:text-base-content/55 group-focus-within:text-primary pointer-events-none"
              aria-hidden
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="min-w-0 flex-1 text-lg font-semibold bg-transparent border-none outline-none text-base-content placeholder:text-base-content/35"
              placeholder="Anket başlığı…"
              aria-label="Anket başlığı"
            />
          </div>
        </Tooltip>
      </div>

      {/* Right: AI + preview + save */}
      <div className="flex items-center gap-2">
        {onToggleAI && (
          <Tooltip content="AI ile anket oluştur ve düzenle" position="bottom">
            <button
              className={`btn btn-ghost btn-sm rounded-xl gap-2 transition-colors ${
                isAIOpen
                  ? 'text-primary bg-primary/10'
                  : 'text-base-content/50 hover:text-primary'
              }`}
              onClick={onToggleAI}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              </svg>
              AI Asistan
            </button>
          </Tooltip>
        )}
        {onPreview && (
          <Tooltip content="Anketi adım adım önizle" position="bottom">
            <button
              className="btn btn-ghost btn-sm rounded-xl gap-2 text-base-content/50 hover:text-primary"
              onClick={onPreview}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Önizleme
            </button>
          </Tooltip>
        )}
        <Tooltip
          content={saveDisabled ? (saveDisabledReason ?? 'Tüm soruların başlığı ve tipi dolu olmalı') : 'Anketi kaydet'}
          position="bottom"
        >
          <button
            className={`btn btn-sm px-5 rounded-xl shadow-sm transition-all ${saveDisabled ? 'btn-disabled opacity-40 cursor-not-allowed' : 'btn-primary'}`}
            onClick={saveDisabled ? undefined : onSave}
            aria-disabled={saveDisabled}
          >
            {saveDisabled ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
                <path d="M7 3v4a1 1 0 0 0 1 1h7" />
              </svg>
            )}
            Kaydet
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
