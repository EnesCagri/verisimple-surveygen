/** Önizleme / gömülü kullanım: yalnızca PreviewPage ağacı içinde render edilir (document.body yok). */
export function SkipToastBanner({ kind }: { kind: 'reminder' | 'ack' | 'required' }) {
  const tone =
    kind === 'reminder'
      ? 'bg-orange-500 text-white ring-orange-800/40'
      : kind === 'required'
        ? 'bg-rose-700 text-white ring-rose-950/35'
        : 'bg-red-600 text-white ring-red-950/35';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl px-3 py-2.5 text-center text-xs font-semibold leading-snug shadow-xl ring-2 ring-black/20 sm:text-sm sm:px-4 sm:py-3 ${tone}`}
    >
      {kind === 'reminder' ? (
        <>Yanıt yok. Boş geçmek için <span className="whitespace-nowrap">İleri</span>&apos;ye tekrar basın.</>
      ) : kind === 'required' ? (
        <>Bu soru zorunludur. Devam etmek için yanıtlayın.</>
      ) : (
        <>Yanıtsız geçildi.</>
      )}
    </div>
  );
}
