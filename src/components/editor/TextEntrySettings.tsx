import type { QuestionSettings } from '../../types/survey';

interface TextEntrySettingsProps {
  settings: QuestionSettings;
  onChange: (settings: QuestionSettings) => void;
}

const MAX_CHAR_LIMIT = 5000;
const DEFAULT_MAX_LENGTH = 1250;

/**
 * Settings panel for TextEntry questions.
 * Allows configuring max character limit and placeholder text.
 */
export function TextEntrySettings({ settings, onChange }: TextEntrySettingsProps) {
  const maxLength = settings.maxLength ?? DEFAULT_MAX_LENGTH;
  const placeholder = settings.placeholder ?? '';

  const handleMaxLengthChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) return;
    onChange({ ...settings, maxLength: Math.min(parsed, MAX_CHAR_LIMIT) });
  };

  return (
    <div>
      <p className="text-sm font-medium text-base-content/60 mb-3">Metin Ayarları</p>

      <div className="space-y-4">
        {/* Max character limit */}
        <div>
          <label className="text-xs font-medium text-base-content/50 mb-1.5 block">
            Maksimum Karakter
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              className="input input-bordered input-sm w-32 rounded-lg bg-base-100 border-base-300/60 focus:border-primary/40"
              value={maxLength}
              min={1}
              max={MAX_CHAR_LIMIT}
              onChange={(e) => handleMaxLengthChange(e.target.value)}
            />
            <span className="text-xs text-base-content/40">
              maks. {MAX_CHAR_LIMIT.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {/* Placeholder text */}
        <div>
          <label className="text-xs font-medium text-base-content/50 mb-1.5 block">
            Yardımcı Metin (Placeholder)
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full rounded-lg bg-base-100 border-base-300/60 focus:border-primary/40"
            placeholder="Ör: Düşüncelerinizi buraya yazın..."
            value={placeholder}
            onChange={(e) => onChange({ ...settings, placeholder: e.target.value })}
          />
        </div>

        {/* Preview hint */}
        <div className="rounded-xl bg-base-200/40 border border-base-300/30 p-4">
          <p className="text-xs font-medium text-base-content/40 mb-2">Önizleme</p>
          <div className="relative">
            <textarea
              className="textarea textarea-bordered w-full min-h-20 resize-none rounded-lg bg-base-100 border-base-300/60 text-sm text-base-content/40 cursor-default"
              placeholder={placeholder || 'Katılımcı buraya yazacak...'}
              disabled
              rows={3}
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-base-content/30">
              0 / {maxLength.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

