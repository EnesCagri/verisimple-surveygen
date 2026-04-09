/**
 * Yeni sorular varsayılan zorunlu; yalnızca `required: false` isteğe bağlı.
 * `required` yoksa zorunlu kabul edilir (önizleme / taker ile aynı mantık).
 */
export function isQuestionRequired(q: { required?: boolean }): boolean {
  return q.required !== false;
}
