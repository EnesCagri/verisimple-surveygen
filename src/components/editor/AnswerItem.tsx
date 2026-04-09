import { useRef } from 'react';

/** Convert a File to a base64 data URL */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface AnswerItemProps {
  index: number;
  value: string;
  image?: string;
  onChange: (index: number, value: string) => void;
  onImageChange?: (index: number, image: string | undefined) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function AnswerItem({
  index,
  value,
  image,
  onChange,
  onImageChange,
  onRemove,
  canRemove,
}: AnswerItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const base64 = await fileToBase64(file);
      onImageChange?.(index, base64);
    } catch {
      // Ignore errors
    }
  };

  return (
    <div className="group">
      <div className="flex items-center gap-3 py-1.5">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/8 text-primary text-xs font-bold shrink-0">
          {String.fromCharCode(65 + index)}
        </span>
        <input
          type="text"
          className="input input-bordered input-sm flex-1 rounded-lg bg-base-100 border-base-300/60 focus:border-primary/40"
          placeholder={`Seçenek ${index + 1}`}
          value={value}
          onChange={(e) => onChange(index, e.target.value)}
        />

        {/* Image toggle button */}
        <button
          type="button"
          className={`
            p-1.5 rounded-lg transition-all duration-150
            ${image
              ? 'text-primary bg-primary/10 hover:bg-primary/20'
              : 'opacity-80 text-base-content/40 hover:text-primary hover:bg-primary/10 sm:opacity-0 sm:group-hover:opacity-100 sm:text-base-content/30'
            }
          `}
          onClick={() => {
            if (image) {
              onImageChange?.(index, undefined);
            } else {
              fileInputRef.current?.click();
            }
          }}
          title={image ? 'Görseli kaldır' : 'Görsel ekle'}
        >
          {image ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </button>

        {canRemove && (
          <button
            className="opacity-0 group-hover:opacity-100 transition-all duration-150 p-1.5 rounded-lg hover:bg-error/10 text-base-content/30 hover:text-error"
            onClick={() => onRemove(index)}
            title="Seçeneği sil"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Image preview */}
      {image && (
        <div className="ml-10 mt-1 mb-2">
          <div className="relative group/img inline-block rounded-lg overflow-hidden border border-base-300/40">
            <img
              src={image}
              alt={`Seçenek ${String.fromCharCode(65 + index)} görseli`}
              className="max-h-24 max-w-48 object-contain bg-base-200/30"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn btn-xs btn-ghost text-white hover:bg-white/20 rounded-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
              <button
                type="button"
                className="btn btn-xs btn-ghost text-white hover:bg-error/30 rounded-lg"
                onClick={() => onImageChange?.(index, undefined)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
