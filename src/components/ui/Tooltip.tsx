import { useState, useRef, useCallback, type ReactNode } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  /** The content shown inside the tooltip bubble */
  content: ReactNode;
  /** The element that triggers the tooltip on hover */
  children: ReactNode;
  /** Preferred position */
  position?: TooltipPosition;
  /** Delay before showing (ms) */
  delay?: number;
  /** Extra classes for the wrapper */
  className?: string;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

/**
 * A polished, animated tooltip with backdrop blur.
 * Wraps any element and shows a floating label on hover.
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 400,
  className = '',
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay, disabled]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  // Position classes
  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2.5',
  };

  // Arrow classes
  const arrowClasses: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral/95 border-x-transparent border-b-transparent border-[5px]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral/95 border-x-transparent border-t-transparent border-[5px]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral/95 border-y-transparent border-r-transparent border-[5px]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-neutral/95 border-y-transparent border-l-transparent border-[5px]',
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible && content && (
        <div
          className={`
            absolute z-[100] pointer-events-none
            ${positionClasses[position]}
          `}
          role="tooltip"
        >
          <div className="relative bg-neutral/95 backdrop-blur-md text-neutral-content rounded-xl shadow-xl shadow-black/10 animate-tooltip-in">
            <div className="px-4 py-2.5 text-sm leading-relaxed font-medium max-w-[22rem]">
              {content}
            </div>
            {/* Arrow */}
            <span className={`absolute ${arrowClasses[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
}
