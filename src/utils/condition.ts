import type { ConditionOperator, ConditionalRule, Question } from '../types/survey';
import { QuestionType } from '../types/survey';

/**
 * Human-readable label for an operator.
 */
const labels: Record<ConditionOperator, string> = {
  any: 'Herhangi',
  equals: '=',
  choice_unanswered: 'Boş geçme',
  equals_any: 'Şıklardan biri',
  eq: '=',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  contains: 'İçerir',
  not_contains: 'İçermez',
  exact: 'Tam eşittir',
  is_empty: 'Boş',
  is_not_empty: 'Boş değil',
  row_equals: 'Satır =',
};

export function operatorLabel(op: ConditionOperator): string {
  return labels[op] ?? op;
}

/**
 * Returns the list of valid operators for a given question type.
 */
export function operatorsForType(
  type: QuestionType,
): { value: ConditionOperator; label: string }[] {
  switch (type) {
    case QuestionType.SingleChoice:
    case QuestionType.MultipleChoice:
      return [
        { value: 'any', label: 'Herhangi bir cevap' },
        { value: 'equals', label: 'Eşittir (tek şık)' },
        { value: 'equals_any', label: 'Şıklardan biri (veya)' },
        { value: 'choice_unanswered', label: 'Boş geçme (yanıt yok)' },
      ];
    case QuestionType.Rating:
      return [
        { value: 'any', label: 'Herhangi bir puan' },
        { value: 'eq', label: 'Eşittir (=)' },
        { value: 'gt', label: 'Büyüktür (>)' },
        { value: 'gte', label: 'Büyük veya eşit (≥)' },
        { value: 'lt', label: 'Küçüktür (<)' },
        { value: 'lte', label: 'Küçük veya eşit (≤)' },
      ];
    case QuestionType.TextEntry:
      return [
        { value: 'any', label: 'Herhangi bir metin' },
        { value: 'is_not_empty', label: 'Boş değil' },
        { value: 'is_empty', label: 'Boş' },
        { value: 'contains', label: 'İçerir' },
        { value: 'not_contains', label: 'İçermez' },
        { value: 'exact', label: 'Tam eşleşir' },
      ];
    case QuestionType.MatrixLikert:
      return [
        { value: 'any', label: 'Herhangi bir seçim' },
        { value: 'row_equals', label: 'Satırda seçili sütun' },
      ];
    case QuestionType.Sortable:
      return [
        { value: 'any', label: 'Herhangi bir sıralama' },
      ];
    default:
      return [{ value: 'any', label: 'Herhangi' }];
  }
}

/**
 * Whether an operator needs a comparison value input.
 * (is_empty / is_not_empty / any don't need one)
 */
export function operatorNeedsValue(op: ConditionOperator): boolean {
  return !['any', 'is_empty', 'is_not_empty', 'choice_unanswered'].includes(op);
}

/**
 * Evaluate a conditional rule against user answers.
 *
 * @param rule            The condition rule
 * @param question        The source question (for type & settings)
 * @param choiceAnswers   Selected choice answers (SingleChoice / MultipleChoice)
 * @param textAnswer      TextEntry answer
 * @param ratingAnswer    Rating answer (1-based, 0 = none)
 * @param matrixAnswer    MatrixLikert answers (rowIndex → selected columns)
 */
export function evaluateCondition(
  rule: ConditionalRule,
  question: Question,
  choiceAnswers: string[],
  textAnswer: string,
  ratingAnswer: number,
  matrixAnswer: Record<number, string[]>,
): boolean {
  const op = rule.operator ?? (rule.answer === '*' ? 'any' : 'equals');
  const value = rule.answer;

  // Universal wildcard
  if (op === 'any') return true;

  switch (question.type) {
    case QuestionType.SingleChoice:
    case QuestionType.MultipleChoice: {
      if (op === 'choice_unanswered') return choiceAnswers.length === 0;
      if (op === 'equals') return choiceAnswers.includes(value);
      if (op === 'equals_any') {
        const vals =
          rule.answerValues && rule.answerValues.length > 0
            ? rule.answerValues
            : value
              ? [value]
              : [];
        if (vals.length === 0) return false;
        return choiceAnswers.some((c) => vals.includes(c));
      }
      return false;
    }

    case QuestionType.Rating: {
      const target = Number(value);
      if (isNaN(target)) return false;
      switch (op) {
        case 'eq':  return ratingAnswer === target;
        case 'gt':  return ratingAnswer > target;
        case 'gte': return ratingAnswer >= target;
        case 'lt':  return ratingAnswer < target;
        case 'lte': return ratingAnswer <= target;
        default:    return false;
      }
    }

    case QuestionType.TextEntry: {
      const txt = textAnswer.trim();
      switch (op) {
        case 'is_empty':      return txt.length === 0;
        case 'is_not_empty':  return txt.length > 0;
        case 'contains':      return txt.toLowerCase().includes(value.toLowerCase());
        case 'not_contains':  return !txt.toLowerCase().includes(value.toLowerCase());
        case 'exact':         return txt === value;
        default:              return false;
      }
    }

    case QuestionType.MatrixLikert: {
      if (op !== 'row_equals') return false;
      const rowIdx = rule.rowIndex ?? 0;
      const rowAnswers = matrixAnswer[rowIdx] ?? [];
      return rowAnswers.includes(value);
    }

    default:
      return false;
  }
}

/**
 * Build a human-readable condition description.
 */
export function conditionDescription(
  rule: ConditionalRule,
  question: Question | undefined,
): string {
  const op = rule.operator ?? (rule.answer === '*' ? 'any' : 'equals');

  if (op === 'any') return 'Herhangi bir cevap';

  switch (op) {
    case 'choice_unanswered':
      return 'Yanıt yok (boş geçme)';
    case 'equals_any': {
      const vals =
        rule.answerValues && rule.answerValues.length > 0
          ? rule.answerValues
          : rule.answer
            ? [rule.answer]
            : [];
      if (vals.length === 0) return '(şık seçilmedi)';
      return vals.map((v) => `"${v}"`).join(' veya ');
    }
    case 'equals':
      return `"${rule.answer}"`;
    case 'eq':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return `Puan ${operatorLabel(op)} ${rule.answer}`;
    case 'contains':
      return `"${rule.answer}" içerir`;
    case 'not_contains':
      return `"${rule.answer}" içermez`;
    case 'exact':
      return `"${rule.answer}" tam eşleşir`;
    case 'is_empty':
      return 'Boş';
    case 'is_not_empty':
      return 'Boş değil';
    case 'row_equals': {
      const rowLabel =
        question?.settings?.rows?.[rule.rowIndex ?? 0] ?? `Satır ${(rule.rowIndex ?? 0) + 1}`;
      return `"${rowLabel}" → "${rule.answer}"`;
    }
    default:
      return rule.answer;
  }
}

