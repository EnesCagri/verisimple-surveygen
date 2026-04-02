import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function EndNodeComponent({ selected }: NodeProps) {
  return (
    <div
      className={`
        group relative bg-error/10 rounded-2xl border-2 shadow-lg min-w-[260px]
        flex items-center justify-center gap-3.5 px-7 py-6
        transition-all duration-200
        ${selected ? 'border-error shadow-error/20' : 'border-error/30 hover:border-error/50'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-12! h-8! bg-transparent! border-0! -top-4! cursor-crosshair"
      />
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-1.5 z-10 w-3.5 h-3.5 rounded-full bg-error border-2 border-base-100 transition-transform duration-150 group-hover:scale-110" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </svg>
      <span className="text-lg font-bold text-error/85">Anketi Bitir</span>
    </div>
  );
}

export const EndNode = memo(EndNodeComponent);

