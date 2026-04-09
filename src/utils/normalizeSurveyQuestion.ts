import type { Question, QuestionSettings } from '../types/survey';
import { QuestionType } from '../types/survey';

const LEGACY_RICHTEXT_TYPE = 8;

function coerceAnswerImages(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string' && v.length > 0) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Eski soru tipi 8 (Zengin Metin) → Metin girişi + zengin soru kökü ayarları.
 */
export function migrateLegacyRichTextQuestion(q: Question): Question {
  if ((q.type as number) !== LEGACY_RICHTEXT_TYPE) return q;

  const st = { ...(q.settings ?? {}) } as QuestionSettings & Record<string, unknown>;
  const hasResponse = st.hasResponse === true;
  const responseMaxLength = typeof st.responseMaxLength === 'number' ? st.responseMaxLength : 2000;
  const responsePlaceholder = typeof st.responsePlaceholder === 'string' ? st.responsePlaceholder : '';
  const richContent = (typeof st.richContent === 'string' && st.richContent.trim()
    ? st.richContent
    : q.text) || '';

  delete st.hasResponse;
  delete st.responseMaxLength;
  delete st.responsePlaceholder;

  return {
    ...q,
    type: QuestionType.TextEntry,
    answers: [],
    required: hasResponse ? q.required : false,
    settings: {
      ...st,
      useRichQuestionText: true,
      richContent,
      richInformationOnly: !hasResponse,
      ...(hasResponse
        ? {
            maxLength: responseMaxLength,
            placeholder: responsePlaceholder || 'Cevabınızı yazın...',
          }
        : {}),
    },
  };
}

export function normalizeSurveyQuestion(q: Question): Question {
  let next = migrateLegacyRichTextQuestion(q);
  const st = next.settings;
  if (!st || typeof st !== 'object') return next;
  const bag = st as Record<string, unknown>;
  const merged =
    coerceAnswerImages(bag.answerImages) ??
    coerceAnswerImages(bag.AnswerImages) ??
    coerceAnswerImages(bag.answer_images);
  if (!merged) return next;
  return {
    ...next,
    settings: { ...(st as QuestionSettings), answerImages: merged },
  };
}
