import type { ConditionalRule, ConditionInput, ConditionOperator } from '../types/survey';

/** evaluateCondition ile uyumlu: kayıtlı kurallarda operator bazen undefined. */
export function effectiveConditionOperator(
  rule: Pick<ConditionalRule, 'operator' | 'answer'>,
): ConditionOperator {
  return rule.operator ?? (rule.answer === '*' ? 'any' : 'equals');
}

function equalsAnyValues(rule: Pick<ConditionalRule, 'answer' | 'answerValues'>): string[] {
  if (rule.answerValues && rule.answerValues.length > 0) return [...rule.answerValues];
  if (rule.answer && rule.answer !== '*') return [rule.answer];
  return [];
}

/**
 * Aynı kaynak soruda aynı "eşleşme mantığı" = çakışma (ör. iki "Herhangi", aynı cevap + eşittir).
 */
export function conditionMatchSignature(
  rule: Pick<ConditionalRule, 'operator' | 'answer' | 'rowIndex' | 'answerValues'>,
): string {
  const op = effectiveConditionOperator(rule);
  if (op === 'any') return 'any';
  if (op === 'choice_unanswered') return 'choice_unanswered';
  if (op === 'is_empty' || op === 'is_not_empty') return op;
  if (op === 'row_equals') {
    const ri = rule.rowIndex ?? 0;
    return `row_equals:${ri}:${String(rule.answer).trim()}`;
  }
  if (op === 'equals_any') {
    const vals = equalsAnyValues(rule);
    return `equals_any:${vals.sort().join('\x1e')}`;
  }
  return `${op}:${String(rule.answer).trim()}`;
}

export function findConflictingCondition(
  existing: ConditionalRule[],
  sourceQuestionId: string,
  input: ConditionInput,
  excludeConditionId?: string,
): ConditionalRule | undefined {
  const sig = conditionMatchSignature({
    operator: input.operator,
    answer: input.answer,
    rowIndex: input.rowIndex,
    answerValues: input.answerValues,
  });
  return existing.find(
    (c) =>
      c.sourceQuestionId === sourceQuestionId &&
      c.id !== excludeConditionId &&
      conditionMatchSignature(c) === sig,
  );
}
