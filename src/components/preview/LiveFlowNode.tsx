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
  [QuestionType.RichText]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
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
              flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold shrink-0
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
            <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-warning/15 text-[10px] font-bold text-warning">
              {conditions.length}
            </span>
          )}
        </div>

        <p
          className={`
            text-[12px] leading-relaxed mt-2.5 line-clamp-2 font-medium
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
