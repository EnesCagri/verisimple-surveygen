import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function InvalidEndNodeComponent({ selected }: NodeProps) {
  return (
    <div
      className={`
        group relative bg-warning/10 rounded-2xl border-2 shadow-lg min-w-[270px]
        flex items-center justify-center gap-3.5 px-7 py-6
        transition-all duration-200
        ${selected ? 'border-warning shadow-warning/20' : 'border-warning/40 hover:border-warning/60'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-12! h-8! bg-transparent! border-0! -top-4! cursor-crosshair"
      />
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-1.5 z-10 w-3.5 h-3.5 rounded-full bg-warning border-2 border-base-100 transition-transform duration-150 group-hover:scale-110" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
      <span className="text-lg font-bold text-warning/90">Geçersiz Bitir</span>
    </div>
  );
}

export const InvalidEndNode = memo(InvalidEndNodeComponent);

