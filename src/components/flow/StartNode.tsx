import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function StartNodeComponent({ selected }: NodeProps) {
  return (
    <div
      className={`
        bg-success/10 rounded-2xl border-2 shadow-lg min-w-[180px]
        flex items-center justify-center gap-2.5 px-5 py-4
        transition-all duration-200
        ${selected ? 'border-success shadow-success/20' : 'border-success/30 hover:border-success/50'}
      `}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-success"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
      <span className="text-sm font-bold text-success/80">Anket Başlangıcı</span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-success !border-2 !border-base-100 !-bottom-1.5"
      />
    </div>
  );
}

export const StartNode = memo(StartNodeComponent);

