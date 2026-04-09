import { memo, useState, useRef, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { QuestionType, type QuestionSettings } from '../../types/survey';
import { questionTypeLabels, questionTypeDescriptions } from '../../utils/questionTypeInfo';
import { QuestionNodeTooltip, type ConditionSummary } from '../flow/QuestionNodeTooltip';

export interface LiveFlowNodeData {
  order: number;
  text: string;
  type: QuestionType;
  guid: string;
  answers: string[];
  settings?: QuestionSettings;
  conditions?: ConditionSummary[];
  /** True when this is the currently active question */
  isActive: boolean;
  /** True when the user has already visited this question */
  isVisited: boolean;
  [key: string]: unknown;
}

const typeIcons: Record<QuestionType, React.JSX.Element> = {
  [QuestionType.SingleChoice]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  [QuestionType.MultipleChoice]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="m9 12 2 2 4-4" />
    </svg>
  ),
  [QuestionType.TextEntry]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M17 10H3" /><path d="M21 6H3" /><path d="M21 14H3" />
    </svg>
  ),
  [QuestionType.Rating]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  [QuestionType.MatrixLikert]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  [QuestionType.Sortable]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="3" y1="6" x2="3" y2="18" /><path d="M3 6l3-3 3 3" /><path d="M3 18l3 3 3-3" />
      <line x1="12" y1="6" x2="21" y2="6" /><line x1="12" y1="12" x2="21" y2="12" /><line x1="12" y1="18" x2="21" y2="18" />
    </svg>
  ),
};

function LiveFlowNodeComponent({ data }: NodeProps) {
  const d = data as unknown as LiveFlowNodeData;
  const { order, text, type, answers, settings, conditions = [], isActive, isVisited } = d;

  const icon = typeIcons[type] ?? null;

  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setShowTooltip(true), 500);
  }, []);

  const onLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(false);
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        className={`
          rounded-xl border-2 px-6 py-4 min-w-[360px] max-w-[450px] transition-all duration-300
          ${isActive
            ? 'border-primary bg-primary/10 shadow-md shadow-primary/20 scale-105'
            : isVisited
              ? 'border-primary/30 bg-primary/[0.04]'
              : 'border-base-300/40 bg-base-100/80'
          }
        `}
      >
        <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-primary/50 !border-0 !-top-1.5" />

        <div className="flex items-center gap-2">
          {/* Active indicator dot */}
          {isActive && (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
          )}

          <span
            className={`
              flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0
              ${isActive
                ? 'bg-primary text-primary-content'
                : isVisited
                  ? 'bg-primary/15 text-primary/70'
                  : 'bg-base-200 text-base-content/30'
              }
            `}
          >
            {order}
          </span>

          <span
            className={`shrink-0 ${isActive ? 'text-primary' : 'text-base-content/30'}`}
            title={`${questionTypeLabels[type]} — ${questionTypeDescriptions[type]}`}
          >
            {icon}
          </span>

          {/* Condition indicator */}
          {conditions.length > 0 && (
            <span className="ml-auto flex items-center justify-center w-6 h-6 rounded-full bg-warning/15 text-xs font-bold text-warning">
              {conditions.length}
            </span>
          )}
        </div>

        <p
          className={`
            text-sm leading-relaxed mt-2.5 line-clamp-2 font-medium
            ${isActive
              ? 'text-base-content/80'
              : isVisited
                ? 'text-base-content/50'
                : 'text-base-content/25'
            }
          `}
        >
          {text || 'Soru metni...'}
        </p>

        {conditions.length > 0 && (
          <div className="mt-2.5 border-t border-base-300/30 pt-2 space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-warning/90">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80">
                <path d="M12 3v6" />
                <circle cx="12" cy="12" r="3" />
                <path d="m8 15-3 3h14l-3-3" />
              </svg>
              Koşullar
            </div>
            <ul className="space-y-1">
              {conditions.slice(0, 4).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] leading-snug">
                  <span className="text-warning/80 mt-0.5 shrink-0 font-bold">→</span>
                  <span
                    className={`flex-1 min-w-0 break-words ${
                      isActive ? 'text-base-content/70' : isVisited ? 'text-base-content/55' : 'text-base-content/40'
                    }`}
                  >
                    {c.description}
                  </span>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                      c.isEnd ? 'bg-error/15 text-error border border-error/25' : 'bg-success/15 text-success border border-success/25'
                    }`}
                  >
                    {c.actionLabel}
                  </span>
                </li>
              ))}
            </ul>
            {conditions.length > 4 && (
              <p className="text-[10px] text-base-content/40 pl-4">+{conditions.length - 4} koşul daha…</p>
            )}
          </div>
        )}

        <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-primary/50 !border-0 !-bottom-1.5" />
      </div>

      {/* Rich tooltip on hover */}
      {showTooltip && (
        <div className="absolute left-full top-0 ml-3 z-[200] pointer-events-none">
          <QuestionNodeTooltip
            order={order}
            text={text}
            type={type}
            answers={answers}
            settings={settings}
            conditions={conditions}
          />
        </div>
      )}
    </div>
  );
}

export const LiveFlowNode = memo(LiveFlowNodeComponent);
