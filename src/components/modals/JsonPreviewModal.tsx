import { useState } from 'react';

interface JsonPreviewModalProps {
  open: boolean;
  json: string;
  onClose: () => void;
}

export function JsonPreviewModal({
  open,
  json,
  onClose,
}: JsonPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-base-content/80">JSON Çıktısı</h3>
          <button
            className="p-1.5 rounded-lg hover:bg-base-200 text-base-content/40 hover:text-base-content transition-colors"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <pre className="bg-base-200/60 rounded-xl p-4 text-sm overflow-auto max-h-96 whitespace-pre-wrap break-words font-mono text-base-content/70 border border-base-300/30">
          <code>{json}</code>
        </pre>
        <div className="modal-action">
          <button
            className={`btn btn-sm rounded-xl px-5 ${
              copied ? 'btn-success' : 'btn-primary'
            }`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Kopyalandı
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Kopyala
              </>
            )}
          </button>
          <button className="btn btn-ghost btn-sm rounded-xl" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-black/20 backdrop-blur-sm">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
