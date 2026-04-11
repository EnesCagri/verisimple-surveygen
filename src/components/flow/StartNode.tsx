import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  flowBuilderSourceHitStyle,
  flowBuilderHandleSourceClass,
} from './flowBuilderHandle';

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
        style={flowBuilderSourceHitStyle}
        className={flowBuilderHandleSourceClass}
        isConnectableStart
        isConnectableEnd={false}
      />
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-2 z-10 h-4 w-4 rounded-full border-2 border-base-100 bg-success transition-transform duration-150 group-hover:scale-125" />
    </div>
  );
}

export const StartNode = memo(StartNodeComponent);

