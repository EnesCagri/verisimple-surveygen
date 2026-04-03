import type { ConditionalRule, ConditionInput, ConditionOperator } from '../types/survey';

/** evaluateCondition ile uyumlu: kayıtlı kurallarda operator bazen undefined. */
export function effectiveConditionOperator(
  rule: Pick<ConditionalRule, 'operator' | 'answer'>,
): ConditionOperator {
  return rule.operator ?? (rule.answer === '*' ? 'any' : 'equals');
}

/**
 * Aynı kaynak soruda aynı "eşleşme mantığı" = çakışma (ör. iki "Herhangi", aynı cevap + eşittir).
 */
export function conditionMatchSignature(
  rule: Pick<ConditionalRule, 'operator' | 'answer' | 'rowIndex'>,
): string {
  const op = effectiveConditionOperator(rule);
  if (op === 'any') return 'any';
  if (op === 'is_empty' || op === 'is_not_empty') return op;
  if (op === 'row_equals') {
    const ri = rule.rowIndex ?? 0;
    return `row_equals:${ri}:${String(rule.answer).trim()}`;
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
  });
  return existing.find(
    (c) =>
      c.sourceQuestionId === sourceQuestionId &&
      c.id !== excludeConditionId &&
      conditionMatchSignature(c) === sig,
  );
}
