import type { ConditionalRule } from '../types/survey';

/** Bu sorudan çıkan en az bir koşul kuralı var mı (jump_to / end_survey)? */
export function questionHasOutgoingCondition(questionGuid: string, conditions: ConditionalRule[]): boolean {
  return conditions.some((c) => c.sourceQuestionId === questionGuid);
}
