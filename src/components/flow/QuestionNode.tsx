import { memo, useEffect, useState, useRef, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { createPortal } from "react-dom";
import { QuestionType, type QuestionSettings } from "../../types/survey";
import {
  QuestionNodeTooltip,
  type ConditionSummary,
} from "./QuestionNodeTooltip";
import {
  flowBuilderSourceHitStyle,
  flowBuilderHandleSourceClass,
  flowBuilderHandleTargetClass,
  flowBuilderTargetHitStyle,
} from "./flowBuilderHandle";
import { isQuestionIncomplete, questionIncompleteReason } from "../../utils/question";

export interface QuestionNodeData {
  order: number;
  text: string;
  type: QuestionType;
  answers: string[];
  guid: string;
  settings?: QuestionSettings;
  /** Pre-computed condition summaries for tooltip */
  conditions?: ConditionSummary[];
  /** Quick delete handler from flow canvas */
  onDelete?: (guid: string) => void;
  [key: string]: unknown;
}

/** Type metadata for display in the flow node */
const typeConfig: Record<
  QuestionType,
  { label: string; icon: React.JSX.Element }
> = {
  [QuestionType.SingleChoice]: {
    label: "Tek Seçim",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  [QuestionType.MultipleChoice]: {
    label: "Çoklu Seçim",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  [QuestionType.TextEntry]: {
    label: "Metin Girişi",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 10H3" />
        <path d="M21 6H3" />
        <path d="M21 14H3" />
        <path d="M17 18H3" />
      </svg>
    ),
  },
  [QuestionType.Rating]: {
    label: "Derecelendirme",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  [QuestionType.MatrixLikert]: {
    label: "Matrix Likert",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  [QuestionType.Sortable]: {
    label: "Sıralama",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="3" y2="18" />
        <path d="M3 6l3-3 3 3" />
        <path d="M3 18l3 3 3-3" />
        <line x1="12" y1="6" x2="21" y2="6" />
        <line x1="12" y1="12" x2="21" y2="12" />
        <line x1="12" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
};

function ControlBadgeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 opacity-90"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function QuestionNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as QuestionNodeData;
  const {
    order,
    text,
    type,
    answers,
    settings,
    conditions = [],
    guid,
    onDelete,
  } = d;
  const isControl = settings?.isControlQuestion === true;
  const incomplete = isQuestionIncomplete({ order, text, type, answers, guid, settings });
  const incompleteReason = incomplete ? (questionIncompleteReason({ order, text, type, answers, guid, settings }) ?? 'Eksik alan var') : null;

  const config = typeConfig[type] ?? { label: "Bilinmeyen", icon: null };

  const [showTooltip, setShowTooltip] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const onEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setShowTooltip(true), 500);
  }, []);

  const onLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(false);
  }, []);

  // When tooltip is visible, continuously track the node's viewport rect
  // so the tooltip stays aligned during pan/zoom.
  useEffect(() => {
    if (!showTooltip) {
      setAnchorRect(null);
      return;
    }

    let raf = 0;
    const tick = () => {
      if (anchorRef.current) {
        setAnchorRect(anchorRef.current.getBoundingClientRect());
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showTooltip]);

  const tooltipPortal =
    showTooltip && anchorRect
      ? createPortal(
          <div
            className="fixed z-9999 pointer-events-none"
            style={{
              left: Math.round(anchorRect.right) + 12,
              top: Math.round(anchorRect.top),
            }}
          >
            <QuestionNodeTooltip
              order={order}
              text={text}
              type={type}
              answers={answers}
              settings={settings}
              conditions={conditions}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={anchorRef}
      className="relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        className={`
          group flex cursor-default rounded-2xl border-2 shadow-lg min-w-[300px] max-w-[360px]
          transition-all duration-200 bg-base-100
          ${incomplete
            ? selected
              ? "border-error shadow-error/20 bg-error/3"
              : "border-error/55 bg-error/3 hover:border-error/75"
            : selected
              ? `border-primary shadow-primary/20 ${isControl ? "ring-2 ring-accent/35 ring-offset-2 ring-offset-base-100" : ""}`
              : isControl
                ? "border-accent/55 bg-accent/7 hover:border-accent/75"
                : "border-base-300/50 hover:border-primary/40"
          }
        `}
      >
        {/* Drag handle — sol çubuk */}
        <div
          className={`
            flow-node-drag-handle
            flex shrink-0 cursor-grab active:cursor-grabbing
            items-center justify-center
            w-10 rounded-l-2xl
            transition-colors duration-200
            select-none
            ${isControl
              ? "bg-[oklch(48%_0.14_145)] hover:bg-[oklch(42%_0.13_145)] text-white/90 hover:text-white"
              : "bg-[#5c4ad4] hover:bg-[#4d3dc0] text-white/90 hover:text-white"
            }
          `}
        >
          <svg
            width="14"
            height="22"
            viewBox="0 0 12 20"
            fill="currentColor"
            aria-hidden
          >
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="9" cy="8" r="1.5" />
            <circle cx="3" cy="13" r="1.5" />
            <circle cx="9" cy="13" r="1.5" />
            <circle cx="3" cy="18" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
          </svg>
        </div>

        {/* Node içeriği */}
        <div className="min-w-0 flex-1">
        {onDelete && (
          <button
            className={`absolute -top-2.5 -right-2.5 z-20 flex items-center justify-center w-7 h-7 rounded-full border border-error/25 bg-error text-white shadow-sm transition-all ${
              selected
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
            }`}
            title="Soruyu sil"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(guid);
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <Handle
          type="target"
          position={Position.Top}
          style={flowBuilderTargetHitStyle}
          className={flowBuilderHandleTargetClass}
          isConnectableStart={false}
          isConnectableEnd
        />
        <div
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 z-10 h-4 w-4 rounded-full border-2 border-base-100 transition-transform duration-150 group-hover:scale-125 ${isControl ? "bg-accent" : "bg-primary"}`}
        />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold ${incomplete ? "bg-error/15 text-error" : isControl ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}
          >
            {order}
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className={`flex items-center gap-1.5 text-sm font-medium ${incomplete ? "text-error/60" : "text-base-content/45"}`}>
              {config.icon}
              {config.label}
            </div>
            {isControl && !incomplete && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-accent/45 bg-accent/12 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-accent shadow-sm"
                title="Kontrol sorusu — doğru cevap tanımlı"
              >
                <ControlBadgeIcon />
                Kontrol
              </span>
            )}
          </div>
          {incomplete && (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-error text-white shadow-sm"
              title={incompleteReason ?? 'Eksik alan var'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </span>
          )}
          {!incomplete && conditions.length > 0 && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/15 text-sm font-bold text-warning">
              {conditions.length}
            </span>
          )}
        </div>

        {/* Question text */}
        <div className="px-5 pb-4">
          <p className={`text-lg font-medium leading-snug line-clamp-2 ${incomplete ? "italic text-error/40" : "text-base-content/80"}`}>
            {text || "Başlık girilmedi…"}
          </p>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          style={flowBuilderSourceHitStyle}
          className={flowBuilderHandleSourceClass}
          isConnectableStart
          isConnectableEnd={false}
        />
        <div
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-2 z-10 h-4 w-4 rounded-full border-2 border-base-100 transition-transform duration-150 group-hover:scale-125 ${isControl ? "bg-accent" : "bg-primary"}`}
        />
        </div>{/* /Node içeriği */}
      </div>

      {/* Rich tooltip on hover (portal to avoid ReactFlow stacking contexts) */}
      {tooltipPortal}
    </div>
  );
}

export const QuestionNode = memo(QuestionNodeComponent);
