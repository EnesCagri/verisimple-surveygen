import { useState } from 'react';
import type { Question, ConditionAction, ConditionInput, ConditionOperator } from '../../types/survey';
import { QuestionType } from '../../types/survey';
import { operatorsForType, operatorNeedsValue } from '../../utils/condition';

interface ConditionEditorModalProps {
  open: boolean;
  sourceQuestion: Question;
  questions: Question[];
  initialAnswer?: string;
  initialAction?: ConditionAction;
  initialOperator?: ConditionOperator;
  initialRowIndex?: number;
  onSave: (input: ConditionInput) => void;
  onClose: () => void;
}

export function ConditionEditorModal({
  open,
  sourceQuestion,
  questions,
  initialAnswer,
  initialAction,
  initialOperator,
  initialRowIndex,
  onSave,
  onClose,
}: ConditionEditorModalProps) {
  const qType = sourceQuestion.type;
  const availableOperators = operatorsForType(qType);

  const defaultOp = initialOperator
    ?? (initialAnswer === '*' ? 'any' : availableOperators[0]?.value ?? 'any');

  const [operator, setOperator] = useState<ConditionOperator>(defaultOp);
  const [answerValue, setAnswerValue] = useState(initialAnswer ?? '');
  const [rowIndex, setRowIndex] = useState(initialRowIndex ?? 0);

  const [actionType, setActionType] = useState<'jump_to' | 'end_survey' | 'invalid_end'>(
    initialAction?.type === 'jump_to' && initialAction.targetQuestionId === '__invalid_end__'
      ? 'invalid_end'
      : (initialAction?.type ?? 'jump_to'),
  );
  const [targetQuestionId, setTargetQuestionId] = useState<string>(
    initialAction?.type === 'jump_to'
      ? initialAction.targetQuestionId
      : questions.filter((q) => q.guid !== sourceQuestion.guid)[0]?.guid ?? '',
  );

  if (!open) return null;

  const targetOptions = questions.filter((q) => q.guid !== sourceQuestion.guid);
  const needsValue = operatorNeedsValue(operator);

  const handleOperatorChange = (newOp: ConditionOperator) => {
    setOperator(newOp);
    if (!operatorNeedsValue(newOp)) {
      setAnswerValue('*');
    } else if (answerValue === '*') {
      setAnswerValue('');
    }
  };

  const handleSave = () => {
    const action: ConditionAction =
      actionType === 'end_survey'
        ? { type: 'end_survey' }
        : actionType === 'invalid_end'
          ? { type: 'jump_to', targetQuestionId: '__invalid_end__' }
          : { type: 'jump_to', targetQuestionId };

    const answer = !needsValue ? '*' : answerValue;

    const input: ConditionInput = {
      answer,
      action,
      operator: operator === 'any' ? undefined : operator,
      rowIndex: operator === 'row_equals' ? rowIndex : undefined,
    };

    onSave(input);
  };

  const isValid = (() => {
    if (!needsValue && operator !== 'any') return actionType === 'end_survey' || actionType === 'invalid_end' || !!targetQuestionId;
    if (operator === 'any') return actionType === 'end_survey' || actionType === 'invalid_end' || !!targetQuestionId;
    if (!answerValue && needsValue) return false;
    return actionType === 'end_survey' || actionType === 'invalid_end' || !!targetQuestionId;
  })();

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300/40">
          <div>
            <h3 className="text-base font-bold text-base-content/85">Koşul Düzenle</h3>
            <p className="text-xs text-base-content/40 mt-0.5">
              S{sourceQuestion.order}: {sourceQuestion.text || 'İsimsiz soru'}
            </p>
          </div>
          <button
            className="p-2 rounded-xl hover:bg-base-200 text-base-content/40 hover:text-base-content transition-colors"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Operator selection */}
          <div>
            <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2 block">
              Koşul
            </label>
            <select
              className="select select-bordered w-full rounded-xl text-sm"
              value={operator}
              onChange={(e) => handleOperatorChange(e.target.value as ConditionOperator)}
            >
              {availableOperators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value input — depends on question type + operator */}
          {needsValue && (
            <div>
              <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2 block">
                Değer
              </label>
              <ConditionValueInput
                questionType={qType}
                operator={operator}
                question={sourceQuestion}
                value={answerValue}
                onChange={setAnswerValue}
                rowIndex={rowIndex}
                onRowIndexChange={setRowIndex}
              />
            </div>
          )}

          {/* Action type */}
          <div>
            <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2 block">
              Aksiyon
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                  ${actionType === 'jump_to'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-base-300/50 text-base-content/50 hover:border-base-300'
                  }
                `}
                onClick={() => setActionType('jump_to')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
                Soruya Atla
              </button>
              <button
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                  ${actionType === 'end_survey'
                    ? 'border-error bg-error/5 text-error'
                    : 'border-base-300/50 text-base-content/50 hover:border-base-300'
                  }
                `}
                onClick={() => setActionType('end_survey')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="m9 9 6 6" />
                  <path d="m15 9-6 6" />
                </svg>
                Anketi Bitir
              </button>
              <button
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                  ${actionType === 'invalid_end'
                    ? 'border-warning bg-warning/10 text-warning'
                    : 'border-base-300/50 text-base-content/50 hover:border-base-300'
                  }
                `}
                onClick={() => setActionType('invalid_end')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                Geçersiz Bitir
              </button>
            </div>
          </div>

          {/* Target question */}
          {actionType === 'jump_to' && (
            <div>
              <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2 block">
                Hedef soru
              </label>
              {targetOptions.length === 0 ? (
                <p className="text-sm text-base-content/40 italic">Atlanacak başka soru yok</p>
              ) : (
                <select
                  className="select select-bordered w-full rounded-xl text-sm"
                  value={targetQuestionId}
                  onChange={(e) => setTargetQuestionId(e.target.value)}
                >
                  {targetOptions.map((q) => (
                    <option key={q.guid} value={q.guid}>
                      {`S${q.order}: ${q.text || 'İsimsiz soru'}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-base-300/40">
          <button className="btn btn-ghost btn-sm rounded-xl" onClick={onClose}>
            İptal
          </button>
          <button
            className="btn btn-primary btn-sm rounded-xl px-5"
            onClick={handleSave}
            disabled={!isValid}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
 *  Value Input — renders different UI per question type
 * ───────────────────────────────────────────────────── */

interface ConditionValueInputProps {
  questionType: QuestionType;
  operator: ConditionOperator;
  question: Question;
  value: string;
  onChange: (value: string) => void;
  rowIndex: number;
  onRowIndexChange: (index: number) => void;
}

function ConditionValueInput({
  questionType,
  operator,
  question,
  value,
  onChange,
  rowIndex,
  onRowIndexChange,
}: ConditionValueInputProps) {
  switch (questionType) {
    // ── Choice: dropdown of predefined answers ──
    case QuestionType.SingleChoice:
    case QuestionType.MultipleChoice:
      return (
        <select
          className="select select-bordered w-full rounded-xl text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>Bir cevap seçin</option>
          {question.answers.filter(Boolean).map((ans, i) => (
            <option key={i} value={ans}>{ans}</option>
          ))}
        </select>
      );

    // ── Rating: number selector (1 to ratingCount) ──
    case QuestionType.Rating: {
      const maxStars = question.settings?.ratingCount ?? 5;
      return (
        <div className="flex items-center gap-3">
          <select
            className="select select-bordered w-full rounded-xl text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="" disabled>Bir puan seçin</option>
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>
                {n} {n === 1 ? 'yıldız' : 'yıldız'}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-0.5 shrink-0">
            {Array.from({ length: maxStars }, (_, i) => (
              <svg
                key={i}
                width="14" height="14"
                viewBox="0 0 24 24"
                fill={i < Number(value) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                className={i < Number(value) ? 'text-warning' : 'text-base-300'}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
        </div>
      );
    }

    // ── TextEntry: text input ──
    case QuestionType.TextEntry:
      return (
        <input
          type="text"
          className="input input-bordered w-full rounded-xl text-sm"
          placeholder={
            operator === 'contains' ? 'Aranacak metin...' :
            operator === 'not_contains' ? 'İçermeyecek metin...' :
            operator === 'exact' ? 'Tam eşleşecek metin...' :
            'Metin...'
          }
          value={value === '*' ? '' : value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    // ── MatrixLikert: row + column selector ──
    case QuestionType.MatrixLikert: {
      const rows = question.settings?.rows ?? [];
      const columns = question.settings?.columns ?? [];
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-base-content/50 mb-1">Satır</p>
            <select
              className="select select-bordered w-full rounded-xl text-sm"
              value={rowIndex}
              onChange={(e) => onRowIndexChange(Number(e.target.value))}
            >
              {rows.map((row, i) => (
                <option key={i} value={i}>{row}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[11px] text-base-content/50 mb-1">Seçili Sütun</p>
            <select
              className="select select-bordered w-full rounded-xl text-sm"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="" disabled>Bir sütun seçin</option>
              {columns.map((col, i) => (
                <option key={i} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
