import type { Question } from '../types/survey';

/** Liste / kart önizlemesi için düz metin başlık */
export function questionListPlainText(q: Question): string {
  const s = q.settings;
  if (s?.useRichQuestionText && s.richContent?.trim()) {
    return s.richContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || q.text;
  }
  return q.text;
}
