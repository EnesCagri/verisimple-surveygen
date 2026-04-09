import type { ConditionalRule, Question, ConditionInput } from '../../types/survey';
import { useState } from 'react';
import { ConditionEditorModal } from '../modals/ConditionEditorModal';
import { operatorLabel } from '../../utils/condition';
import { QuestionType } from '../../types/survey';

interface ConditionListProps {
  conditions: ConditionalRule[];
  questions: Question[];
  onRemoveCondition: (conditionId: string) => void;
  onUpdateCondition: (conditionId: string, input: ConditionInput) => void;
}

export function ConditionList({
  conditions,
  questions,
  onRemoveCondition,
  onUpdateCondition,
}: ConditionListProps) {
  const [editingCondition, setEditingCondition] = useState<ConditionalRule | null>(null);
  const [hoveredQuestionId, setHoveredQuestionId] = useState<string | null>(null);

  const getQuestion = (guid: string) => questions.find((q) => q.guid === guid);

  const getQuestionText = (guid: string, maxLength = 30): string => {
    const q = getQuestion(guid);
    if (!q) return 'Bilinmiyor';
    const text = q.text || `Soru ${q.order}`;
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const getQuestionFullText = (guid: string): string => {
    const q = getQuestion(guid);
    return q?.text || `Soru ${q?.order ?? '?'}`;
  };

  const getAnswerValue = (rule: ConditionalRule, question: Question | undefined): string => {
    const op = rule.operator ?? (rule.answer === '*' ? 'any' : 'equals');

    if (op === 'any') return 'Herhangi bir cevap';
    if (op === 'choice_unanswered') return 'Yanıt yok (boş geçme)';
    if (op === 'equals_any') {
      const vals =
        rule.answerValues && rule.answerValues.length > 0
          ? rule.answerValues
          : rule.answer
            ? [rule.answer]
            : [];
      return vals.length ? vals.map((v) => `"${v}"`).join(' veya ') : '(şık seçilmedi)';
    }
    if (op === 'is_empty') return 'Boş';
    if (op === 'is_not_empty') return 'Boş değil';

    if (op === 'row_equals' && question?.settings?.rows && rule.rowIndex !== undefined) {
      const rowLabel = question.settings.rows[rule.rowIndex] ?? `Satır ${rule.rowIndex + 1}`;
      return `"${rowLabel}" → "${rule.answer}"`;
    }

    if (question?.type === QuestionType.Rating) {
      return `${rule.answer} yıldız`;
    }

    return `"${rule.answer}"`;
  };

  const getOperatorDisplay = (rule: ConditionalRule): string => {
    const op = rule.operator ?? (rule.answer === '*' ? 'any' : 'equals');
    if (op === 'any') return '';
    return operatorLabel(op);
  };

  if (conditions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
          <path d="M12 3v6" />
          <circle cx="12" cy="12" r="3" />
          <path d="m8 15-3 3h14l-3-3" />
          <path d="M5 21v-3" />
          <path d="M19 21v-3" />
        </svg>
        <p className="text-sm font-medium">Koşul yok</p>
        <p className="text-xs mt-1 text-center px-4">
          Akış görünümünde sorular arasında bağlantı kurarak koşullar ekleyin.
        </p>
      </div>
    );
  }

  const editingSource = editingCondition
    ? questions.find((q) => q.guid === editingCondition.sourceQuestionId) ?? null
    : null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {conditions.map((rule, index) => {
          const srcQuestion = getQuestion(rule.sourceQuestionId);
          const answerValue = getAnswerValue(rule, srcQuestion);
          const operator = getOperatorDisplay(rule);
          const sourceText = getQuestionText(rule.sourceQuestionId);
          const sourceFullText = getQuestionFullText(rule.sourceQuestionId);
          const isHovered = hoveredQuestionId === rule.sourceQuestionId;
          const isInvalidEnd =
            rule.action.type === 'jump_to' && rule.action.targetQuestionId === '__invalid_end__';

          return (
            <div
              key={rule.id}
              className="group relative bg-base-100 rounded-2xl border border-base-300/50 hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Header: Kural # */}
              <div className="flex items-center justify-between px-4.5 py-3 border-b border-base-300/30 bg-base-200/40">
                <span className="text-xs font-semibold text-base-content/45 uppercase tracking-wide">
                  Kural #{index + 1}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-error/10 text-error/50 hover:text-error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCondition(rule.id);
                  }}
                  title="Koşulu sil"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {/* Main Content: Input -> Logic -> Output */}
              <div
                className="p-4.5 cursor-pointer"
                onClick={() => setEditingCondition(rule)}
                onMouseEnter={() => setHoveredQuestionId(rule.sourceQuestionId)}
                onMouseLeave={() => setHoveredQuestionId(null)}
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* INPUT: Soru */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="inline-flex items-center justify-center px-2.5 h-7 rounded-lg text-xs font-bold bg-primary/15 text-primary border border-primary/20 shrink-0">
                      S{srcQuestion?.order ?? '?'}
                    </span>
                    <span
                      className="text-sm font-medium text-base-content/75 truncate"
                      title={isHovered ? sourceFullText : undefined}
                    >
                      {isHovered ? sourceFullText : sourceText}
                    </span>
                  </div>

                  {/* Logic: Operatör */}
                  {operator && (
                    <>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-semibold text-base-content/45 bg-base-200/60 px-2.5 py-1 rounded-md">
                          {operator}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Value: Cevap/Değer */}
                  <div className="flex items-center shrink-0">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-neutral/90 text-neutral-content">
                      {answerValue}
                    </span>
                  </div>

                  {/* Arrow */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-base-content/30 shrink-0"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>

                  {/* OUTPUT: Aksiyon */}
                  <div className="flex items-center shrink-0">
                    {rule.action.type === 'end_survey' ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-error text-error-content">
                        Anketi Bitir
                      </span>
                    ) : isInvalidEnd ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-warning/90 text-warning-content">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <path d="M12 16h.01" />
                        </svg>
                        Geçersiz Bitir
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-success/90 text-success-content">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                        S{getQuestion(rule.action.targetQuestionId)?.order ?? '?'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Natural Language Description (Optional, subtle) */}
                <div className="mt-2.5 pt-2.5 border-t border-base-300/20">
                  <p className="text-xs text-base-content/45 italic">
                    {rule.action.type === 'end_survey' ? (
                      <>Kullanıcı <span className="font-medium text-base-content/50">S{srcQuestion?.order}</span> sorusuna <span className="font-medium text-base-content/50">{answerValue}</span> derse → <span className="font-medium text-error/70">Süreci Sonlandır</span></>
                    ) : isInvalidEnd ? (
                      <>Kullanıcı <span className="font-medium text-base-content/50">S{srcQuestion?.order}</span> sorusuna <span className="font-medium text-base-content/50">{answerValue}</span> derse → <span className="font-medium text-warning/80">Geçersiz Bitir</span></>
                    ) : (
                      <>Kullanıcı <span className="font-medium text-base-content/50">S{srcQuestion?.order}</span> sorusuna <span className="font-medium text-base-content/50">{answerValue}</span> derse → <span className="font-medium text-success/70">S{getQuestion(rule.action.targetQuestionId)?.order}</span> sorusuna git</>
                    )}
                  </p>
                </div>
              </div>

              {/* Connection Line Visual (n8n-style wire hint) */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editingCondition && editingSource && (
        <ConditionEditorModal
          open
          sourceQuestion={editingSource}
          questions={questions}
          conditions={conditions}
          excludeConditionId={editingCondition.id}
          initialAnswer={editingCondition.answer}
          initialAnswerValues={editingCondition.answerValues}
          initialAction={editingCondition.action}
          initialOperator={editingCondition.operator}
          initialRowIndex={editingCondition.rowIndex}
          onSave={(input) => {
            onUpdateCondition(editingCondition.id, input);
            setEditingCondition(null);
          }}
          onClose={() => setEditingCondition(null)}
        />
      )}
    </>
  );
}
