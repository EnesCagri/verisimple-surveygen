import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface LiveFlowEndNodeData {
  isActive: boolean;
  [key: string]: unknown;
}

function LiveFlowEndNodeComponent({ data }: NodeProps) {
  const { isActive } = data as unknown as LiveFlowEndNodeData;

  return (
    <div
      className={`
        rounded-xl border-2 px-6 py-4 min-w-[360px] flex items-center justify-center gap-3
        transition-all duration-300
        ${isActive
          ? 'border-error bg-error/15 shadow-md shadow-error/20 scale-105'
          : 'border-error/20 bg-error/5'
        }
      `}
    >
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-error/50 !border-0 !-top-1.5" />

      <svg
        width="16" height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? 'text-error' : 'text-error/40'}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </svg>
      <span className={`text-[12px] font-bold ${isActive ? 'text-error' : 'text-error/40'}`}>
        Anketi Bitir
      </span>
    </div>
  );
}

export const LiveFlowEndNode = memo(LiveFlowEndNodeComponent);

