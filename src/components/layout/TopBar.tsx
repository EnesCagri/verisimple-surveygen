import { Tooltip } from '../ui/Tooltip';

interface TopBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onBack?: () => void;
  onPreview?: () => void;
  onToggleAI?: () => void;
  isAIOpen?: boolean;
}

export function TopBar({ title, onTitleChange, onSave, onBack, onPreview, onToggleAI, isAIOpen }: TopBarProps) {
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
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none outline-none w-80 text-base-content/80 placeholder:text-base-content/30"
          placeholder="Anket başlığı..."
        />
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
        <Tooltip content="Anket yapısını JSON olarak görüntüle" position="bottom">
          <button
            className="btn btn-primary btn-sm px-5 rounded-xl shadow-sm"
            onClick={onSave}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
              <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
              <path d="M7 3v4a1 1 0 0 0 1 1h7" />
            </svg>
            Kaydet
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
