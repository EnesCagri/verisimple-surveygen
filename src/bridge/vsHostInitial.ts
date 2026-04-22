/**
 * VeriSimple Builder sayfası — `window.__VS_SURVEYGEN_INITIAL__` sözleşmesi.
 *
 * - Özellik **yok** (`'__VS_SURVEYGEN_INITIAL__' in window` false): standalone / Vite;
 *   yerel `localStorage` taslağı kullanılabilir.
 * - Değer **`null`**: host “yeni anket”; taslak ile **asla** birleştirilmez, boş şablon.
 * - **Nesne**: düzenleme; `readVsSurveyGenInitialSurvey()` ile hydrate.
 */

export function hasVsSurveyGenInitialKey(): boolean {
  return typeof window !== 'undefined' && '__VS_SURVEYGEN_INITIAL__' in window;
}

/** Host açıkça `window.__VS_SURVEYGEN_INITIAL__ = null` yazdıysa true. */
export function isVsSurveyGenExplicitNewMode(): boolean {
  return hasVsSurveyGenInitialKey() && window.__VS_SURVEYGEN_INITIAL__ === null;
}
