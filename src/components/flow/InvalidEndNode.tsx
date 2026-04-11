import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  flowBuilderTargetHitStyle,
  flowBuilderHandleTargetClass,
} from './flowBuilderHandle';

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
        style={flowBuilderTargetHitStyle}
        className={flowBuilderHandleTargetClass}
        isConnectableStart={false}
        isConnectableEnd
      />
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 z-10 h-4 w-4 rounded-full border-2 border-base-100 bg-warning transition-transform duration-150 group-hover:scale-125" />
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

