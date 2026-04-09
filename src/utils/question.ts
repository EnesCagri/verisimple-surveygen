import type { Question, QuestionSettings } from '../types/survey';
import { QuestionType } from '../types/survey';
import { generateId } from './id';

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

