import type { Question, QuestionSettings } from '../types/survey';
import { QuestionType } from '../types/survey';
import { generateId } from './id';
import { normalizeSurveyQuestion } from './normalizeSurveyQuestion';

/** Default settings per question type */
const defaultSettings: Partial<Record<QuestionType, QuestionSettings>> = {
  [QuestionType.TextEntry]: { maxLength: 1250, placeholder: '' },
  [QuestionType.Rating]: {
    ratingCount: 5,
    ratingLabels: { low: 'Çok Kötü', high: 'Çok İyi' },
  },
  [QuestionType.MatrixLikert]: {
    rows: [''],
    columns: ['Kesinlikle Katılmıyorum', 'Katılmıyorum', 'Kararsızım', 'Katılıyorum', 'Kesinlikle Katılıyorum'],
    matrixType: 'single',
  },
  [QuestionType.Sortable]: {},
};

/** Default answers per question type */
const defaultAnswers: Partial<Record<QuestionType, string[]>> = {
  [QuestionType.SingleChoice]: [''],
  [QuestionType.MultipleChoice]: [''],
  [QuestionType.TextEntry]: [],
  [QuestionType.Rating]: [],        // rating has no predefined answer options
  [QuestionType.MatrixLikert]: [],   // matrix answers are in rows × columns
  [QuestionType.Sortable]: [''],     // sortable items that the user will rank
};

/**
 * Create a new question with sensible defaults for the given type.
 */
export function createQuestion(
  order: number,
  type: QuestionType = QuestionType.SingleChoice,
): Question {
  const question: Question = {
    order,
    text: '',
    type,
    answers: defaultAnswers[type] ?? [''],
    required: true,
    guid: generateId(),
  };

  const settings = defaultSettings[type];
  if (settings) {
    question.settings = { ...settings };
  }

  return question;
}

/** Valid question type codes — used to detect uninitialised type values. */
const VALID_TYPES = new Set<number>(Object.values(QuestionType));

/**
 * Soru tipine göre seçenek/satır yeterliliğini kontrol eder.
 *
 * | Tip           | Gereksinim                                     |
 * |---------------|------------------------------------------------|
 * | SingleChoice  | En az 1 dolu seçenek                           |
 * | MultipleChoice| En az 1 dolu seçenek                           |
 * | Sortable      | En az 2 dolu öğe (1 öğe sıralanabilir değil)   |
 * | MatrixLikert  | En az 1 dolu satır VE en az 1 dolu sütun       |
 * | TextEntry     | — (seçenek gerekmez)                           |
 * | Rating        | — (seçenek gerekmez)                           |
 */
function hasRequiredOptions(q: Question): boolean {
  switch (q.type) {
    case QuestionType.SingleChoice:
    case QuestionType.MultipleChoice:
      return q.answers.filter((a) => a.trim().length > 0).length >= 1;

    case QuestionType.Sortable:
      return q.answers.filter((a) => a.trim().length > 0).length >= 2;

    case QuestionType.MatrixLikert: {
      const rows = (q.settings?.rows ?? []).filter((r) => r.trim().length > 0);
      const cols = (q.settings?.columns ?? []).filter((c) => c.trim().length > 0);
      return rows.length >= 1 && cols.length >= 1;
    }

    default:
      return true;
  }
}

/**
 * Soru eksik/geçersiz sayılır (kaydetmeyi engeller) eğer:
 *  – tipi geçerli bir QuestionType değilse,
 *  – text / richContent boşsa, VEYA
 *  – tipe özgü seçenek/satır gereksinimleri karşılanmıyorsa.
 */
export function isQuestionIncomplete(q: Question): boolean {
  // Tip geçerlilik kontrolü
  if (!VALID_TYPES.has(q.type as number)) return true;

  // Başlık / içerik kontrolü
  const s = q.settings;
  let text = '';
  if (s?.useRichQuestionText && typeof s.richContent === 'string') {
    text = s.richContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    text = q.text.trim();
  }
  if (text.length === 0) return true;

  // Tipe özgü seçenek kontrolü
  if (!hasRequiredOptions(q)) return true;

  return false;
}

/**
 * Eksikliğin insan tarafından okunabilir kısa açıklamasını döner.
 * Soru geçerliyse `null` döner.
 */
export function questionIncompleteReason(q: Question): string | null {
  if (!VALID_TYPES.has(q.type as number)) return 'Geçersiz soru tipi';

  const s = q.settings;
  let text = '';
  if (s?.useRichQuestionText && typeof s.richContent === 'string') {
    text = s.richContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    text = q.text.trim();
  }
  if (text.length === 0) return 'Başlık girilmedi';

  switch (q.type) {
    case QuestionType.SingleChoice:
    case QuestionType.MultipleChoice:
      if (q.answers.filter((a) => a.trim().length > 0).length < 1)
        return 'En az 1 seçenek gerekli';
      break;
    case QuestionType.Sortable:
      if (q.answers.filter((a) => a.trim().length > 0).length < 2)
        return 'En az 2 sıralama öğesi gerekli';
      break;
    case QuestionType.MatrixLikert: {
      const rows = (q.settings?.rows ?? []).filter((r) => r.trim().length > 0);
      const cols = (q.settings?.columns ?? []).filter((c) => c.trim().length > 0);
      if (rows.length < 1) return 'En az 1 satır gerekli';
      if (cols.length < 1) return 'En az 1 sütun gerekli';
      break;
    }
  }
  return null;
}

/**
 * Returns sensible defaults when a question's type is changed.
 * Preserves text and order, resets answers & settings to match the new type.
 */
export function getDefaultsForType(type: QuestionType): {
  answers: string[];
  settings?: QuestionSettings;
} {
  return {
    answers: defaultAnswers[type] ?? [''],
    settings: defaultSettings[type] ? { ...defaultSettings[type] } : undefined,
  };
}

function cloneQuestionSettings(settings: QuestionSettings | undefined): QuestionSettings | undefined {
  if (!settings) return undefined;
  try {
    return structuredClone(settings);
  } catch {
    return JSON.parse(JSON.stringify(settings)) as QuestionSettings;
  }
}

/** Aynı içerikle yeni `guid`; koşullar kopyalanmaz (yalnızca soru kartı). */
export function duplicateQuestionAsCopy(source: Question): Question {
  return normalizeSurveyQuestion({
    ...source,
    guid: generateId(),
    answers: Array.isArray(source.answers) ? [...source.answers] : [],
    settings: cloneQuestionSettings(source.settings),
  });
}

