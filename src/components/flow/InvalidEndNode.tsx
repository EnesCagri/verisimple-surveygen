import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function InvalidEndNodeComponent({ selected }: NodeProps) {
  return (
    <div
      className={`
        bg-warning/10 rounded-2xl border-2 shadow-lg min-w-[200px]
        flex items-center justify-center gap-2 px-5 py-4
        transition-all duration-200
        ${selected ? 'border-warning shadow-warning/20' : 'border-warning/40 hover:border-warning/60'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3! h-3! bg-warning! border-2! border-base-100! -top-1.5!"
      />
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
      <span className="text-sm font-bold text-warning/90">Geçersiz Bitir</span>
    </div>
  );
}

export const InvalidEndNode = memo(InvalidEndNodeComponent);

