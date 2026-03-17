import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function EndNodeComponent({ selected }: NodeProps) {
  return (
    <div
      className={`
        bg-error/10 rounded-2xl border-2 shadow-lg min-w-[180px]
        flex items-center justify-center gap-2 px-5 py-4
        transition-all duration-200
        ${selected ? 'border-error shadow-error/20' : 'border-error/30 hover:border-error/50'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-error !border-2 !border-base-100 !-top-1.5"
      />
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </svg>
      <span className="text-sm font-bold text-error/80">Anketi Bitir</span>
    </div>
  );
}

export const EndNode = memo(EndNodeComponent);

