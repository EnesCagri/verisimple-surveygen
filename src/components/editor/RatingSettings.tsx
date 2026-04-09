import type { QuestionSettings } from '../../types/survey';

interface RatingSettingsProps {
  settings: QuestionSettings;
  onChange: (settings: QuestionSettings) => void;
}

const MIN_STARS = 2;
const MAX_STARS = 10;

/**
 * Settings panel for Rating questions.
 * Researcher configures the number of stars and endpoint labels.
 */
export function RatingSettings({ settings, onChange }: RatingSettingsProps) {
  const ratingCount = settings.ratingCount ?? 5;
  const labels = settings.ratingLabels ?? { low: 'Çok Kötü', high: 'Çok İyi' };

  const handleCountChange = (value: number) => {
    const clamped = Math.min(MAX_STARS, Math.max(MIN_STARS, value));
    onChange({ ...settings, ratingCount: clamped });
  };

  return (
    <div>
      <p className="text-sm font-medium text-base-content/60 mb-3">Derecelendirme Ayarları</p>

      <div className="space-y-4">
        {/* Star / scale count */}
        <div>
          <label className="text-xs font-medium text-base-content/50 mb-1.5 block">
            Yıldız Sayısı
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              className="range range-primary range-sm flex-1"
              min={MIN_STARS}
              max={MAX_STARS}
              value={ratingCount}
              onChange={(e) => handleCountChange(Number(e.target.value))}
            />
            <span className="inline-flex items-center justify-center w-10 h-8 rounded-lg bg-base-200/60 text-sm font-bold text-primary">
              {ratingCount}
            </span>
          </div>
        </div>

        {/* Endpoint labels */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-base-content/50 mb-1.5 block">
              Alt Etiket (1)
            </label>
            <input
              type="text"
              className="input input-bordered input-sm w-full rounded-lg bg-base-100 border-base-300/60 focus:border-primary/40"
              placeholder="Çok Kötü"
              value={labels.low}
              onChange={(e) =>
                onChange({
                  ...settings,
                  ratingLabels: { ...labels, low: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-base-content/50 mb-1.5 block">
              Üst Etiket ({ratingCount})
            </label>
            <input
              type="text"
              className="input input-bordered input-sm w-full rounded-lg bg-base-100 border-base-300/60 focus:border-primary/40"
              placeholder="Çok İyi"
              value={labels.high}
              onChange={(e) =>
                onChange({
                  ...settings,
                  ratingLabels: { ...labels, high: e.target.value },
                })
              }
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl bg-base-200/40 border border-base-300/30 p-4">
          <p className="text-xs font-medium text-base-content/40 mb-3">Önizleme</p>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: ratingCount }, (_, i) => (
                <svg
                  key={i}
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={i < 3 ? 'oklch(75% 0.18 60)' : 'none'}
                  stroke="oklch(75% 0.18 60)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <div className="flex justify-between w-full text-xs text-base-content/40 px-1">
              <span>{labels.low || '1'}</span>
              <span>{labels.high || String(ratingCount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

