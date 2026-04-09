import { QuestionType } from '../types/survey';

const CONTROL_QUESTION_TYPES = new Set<QuestionType>([
  QuestionType.SingleChoice,
  QuestionType.MultipleChoice,
  QuestionType.Rating,
]);

export function supportsControlQuestionType(type: QuestionType): boolean {
  return CONTROL_QUESTION_TYPES.has(type);
}
