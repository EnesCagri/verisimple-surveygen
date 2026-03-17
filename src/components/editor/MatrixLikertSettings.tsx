import type { QuestionSettings } from '../../types/survey';

interface MatrixLikertSettingsProps {
  settings: QuestionSettings;
  onChange: (settings: QuestionSettings) => void;
}

const DEFAULT_COLUMNS = [
  'Kesinlikle Katılmıyorum',
  'Katılmıyorum',
  'Kararsızım',
  'Katılıyorum',
  'Kesinlikle Katılıyorum',
];

/**
 * Settings panel for Matrix Likert questions.
 * Researcher configures rows (sub-questions), columns (scale points), and selection type.
 */
export function MatrixLikertSettings({ settings, onChange }: MatrixLikertSettingsProps) {
  const rows = settings.rows ?? [''];
  const columns = settings.columns ?? DEFAULT_COLUMNS;
  const matrixType = settings.matrixType ?? 'single';

  /* ─── Row helpers ─── */

  const handleRowChange = (index: number, value: string) => {
    const updated = [...rows];
    updated[index] = value;
    onChange({ ...settings, rows: updated });
  };

  const addRow = () => {
    onChange({ ...settings, rows: [...rows, ''] });
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    onChange({ ...settings, rows: rows.filter((_, i) => i !== index) });
  };

  /* ─── Column helpers ─── */

  const handleColumnChange = (index: number, value: string) => {
    const updated = [...columns];
    updated[index] = value;
    onChange({ ...settings, columns: updated });
  };

  const addColumn = () => {
    onChange({ ...settings, columns: [...columns, ''] });
  };

  const removeColumn = (index: number) => {
    if (columns.length <= 2) return;
    onChange({ ...settings, columns: columns.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <p className="text-sm font-medium text-base-content/60 mb-3">Matrix Likert Ayarları</p>

      <div className="space-y-5">
        {/* Matrix type toggle */}
        <div>
          <label className="text-xs font-medium text-base-content/50 mb-2 block">
            Seçim Tipi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                ${matrixType === 'single'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-base-300/40 text-base-content/50 hover:border-base-300'
                }
              `}
              onClick={() => onChange({ ...settings, matrixType: 'single' })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Tek Seçim
            </button>
            <button
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                ${matrixType === 'multiple'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-base-300/40 text-base-content/50 hover:border-base-300'
                }
              `}
              onClick={() => onChange({ ...settings, matrixType: 'multiple' })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Çoklu Seçim
            </button>
          </div>
        </div>

        {/* Rows (sub-questions) */}
        <div>
          <label className="text-xs font-medium text-base-content/50 mb-2 block">
            Satırlar (Maddeler)
            {rows.length > 0 && (
              <span className="ml-1 text-primary/60">{rows.length}</span>
            )}
          </label>
          <div className="space-y-1.5">
            {rows.map((row, i) => (
              <div key={i} className="group flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/8 text-primary text-[10px] font-bold shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 rounded-lg bg-base-100 border-base-300/60 focus:border-primary/40"
                  placeholder={`Madde ${i + 1}`}
                  value={row}
                  onChange={(e) => handleRowChange(i, e.target.value)}
                />
                {rows.length > 1 && (
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-error/10 text-base-content/30 hover:text-error"
                    onClick={() => removeRow(i)}
                    title="Satırı sil"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            className="mt-2 text-sm font-medium text-primary/70 hover:text-primary transition-colors flex items-center gap-1.5"
            onClick={addRow}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Satır Ekle
          </button>
        </div>

        {/* Columns (scale points) */}
        <div>
          <label className="text-xs font-medium text-base-content/50 mb-2 block">
            Sütunlar (Ölçek)
            {columns.length > 0 && (
              <span className="ml-1 text-primary/60">{columns.length}</span>
            )}
          </label>
          <div className="space-y-1.5">
            {columns.map((col, i) => (
              <div key={i} className="group flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-secondary/10 text-secondary text-[10px] font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 rounded-lg bg-base-100 border-base-300/60 focus:border-primary/40"
                  placeholder={`Ölçek ${i + 1}`}
                  value={col}
                  onChange={(e) => handleColumnChange(i, e.target.value)}
                />
                {columns.length > 2 && (
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-error/10 text-base-content/30 hover:text-error"
                    onClick={() => removeColumn(i)}
                    title="Sütunu sil"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            className="mt-2 text-sm font-medium text-primary/70 hover:text-primary transition-colors flex items-center gap-1.5"
            onClick={addColumn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Sütun Ekle
          </button>
        </div>

        {/* Compact preview */}
        <div className="rounded-xl bg-base-200/40 border border-base-300/30 p-4 overflow-x-auto">
          <p className="text-xs font-medium text-base-content/40 mb-3">Önizleme</p>
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left pb-2 pr-3 text-base-content/50 font-medium" />
                {columns.filter(Boolean).map((col, ci) => (
                  <th key={ci} className="text-center pb-2 px-1 text-base-content/50 font-medium min-w-[60px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.filter(Boolean).map((row, ri) => (
                <tr key={ri} className="border-t border-base-300/20">
                  <td className="py-2 pr-3 text-base-content/60 font-medium">{row}</td>
                  {columns.filter(Boolean).map((_, ci) => (
                    <td key={ci} className="text-center py-2 px-1">
                      <span
                        className={`inline-block w-4 h-4 border-2 border-base-300/50 ${
                          matrixType === 'single' ? 'rounded-full' : 'rounded-sm'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.filter(Boolean).length === 0 && (
            <p className="text-xs text-base-content/30 text-center py-2">Satır ekleyin</p>
          )}
        </div>
      </div>
    </div>
  );
}

