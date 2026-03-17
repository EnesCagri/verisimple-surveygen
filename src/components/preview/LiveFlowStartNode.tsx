import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface LiveFlowStartNodeData {
  isActive: boolean;
  [key: string]: unknown;
}

function LiveFlowStartNodeComponent({ data }: NodeProps) {
  const { isActive } = data as unknown as LiveFlowStartNodeData;

  return (
    <div
      className={`
        rounded-xl border-2 px-6 py-4 min-w-[360px] flex items-center justify-center gap-3
        transition-all duration-300
        ${isActive
          ? 'border-success bg-success/15 shadow-md shadow-success/20 scale-105'
          : 'border-success/20 bg-success/5'
        }
      `}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? 'text-success' : 'text-success/40'}
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
      <span className={`text-[12px] font-bold ${isActive ? 'text-success' : 'text-success/40'}`}>
        Anket Başlangıcı
      </span>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-success/50 !border-0 !-bottom-1.5"
      />
    </div>
  );
}

export const LiveFlowStartNode = memo(LiveFlowStartNodeComponent);

