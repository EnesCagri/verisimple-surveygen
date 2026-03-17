interface EdgeContextMenuProps {
  x: number;
  y: number;
  type: 'condition' | 'sequential';
  onEdit?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EdgeContextMenu({ x, y, type, onEdit, onDelete, onClose }: EdgeContextMenuProps) {
  return (
    <>
      {/* Invisible overlay to close on outside click */}
      <div className="fixed inset-0 z-[55]" onClick={onClose} />

      {/* Menu */}
      <div
        className="absolute z-[56] bg-base-100 rounded-xl shadow-xl border border-base-300/40 py-1.5 min-w-[160px] animate-fade-slide-in"
        style={{ left: x, top: y }}
      >
        {type === 'condition' && onEdit && (
          <>
            <button
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-base-content/70 hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={onEdit}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
              </svg>
              Koşulu Düzenle
            </button>
            <div className="border-t border-base-300/30 my-1" />
          </>
        )}
        <button
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error/70 hover:bg-error/5 hover:text-error transition-colors"
          onClick={onDelete}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          {type === 'condition' ? 'Koşulu Sil' : 'Bağlantıyı Sil'}
        </button>
      </div>
    </>
  );
}

