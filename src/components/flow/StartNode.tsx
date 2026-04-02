import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

function StartNodeComponent({ selected }: NodeProps) {
  return (
    <div
      className={`
        group relative bg-success/10 rounded-2xl border-2 shadow-lg min-w-[260px]
        flex items-center justify-center gap-3.5 px-7 py-6
        transition-all duration-200
        ${selected ? 'border-success shadow-success/20' : 'border-success/30 hover:border-success/50'}
      `}
    >
      <svg
        width="22"
        height="22"
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
      <span className="text-lg font-bold text-success/85">Anket Başlangıcı</span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-12! h-8! bg-transparent! border-0! -bottom-4! cursor-crosshair"
      />
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-1.5 z-10 w-3.5 h-3.5 rounded-full bg-success border-2 border-base-100 transition-transform duration-150 group-hover:scale-110" />
    </div>
  );
}

export const StartNode = memo(StartNodeComponent);

