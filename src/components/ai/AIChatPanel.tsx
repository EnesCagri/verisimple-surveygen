import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../hooks/useAIChat';

interface AIChatPanelProps {
  open: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onClear: () => void;
  onClose: () => void;
  onKeep: (messageId: string) => void;
  onUndo: (messageId: string) => void;
  onRedo?: (messageId: string) => void;
}

// ── Sparkle icon (AI branding) ──
function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

// ── Typing dots animation ──
function TypingIndicator() {
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <SparkleIcon size={16} />
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ── Single message bubble ──
function MessageBubble({
  message,
  onKeep,
  onUndo,
  onRedo,
}: {
  message: ChatMessage;
  onKeep?: (id: string) => void;
  onUndo?: (id: string) => void;
  onRedo?: (id: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
          <SparkleIcon size={16} />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? 'bg-primary text-primary-content rounded-br-md'
              : 'bg-base-200/80 text-base-content/80 rounded-bl-md'
            }
          `}
        >
          {message.content}
        </div>

        {/* Action badges (AI only) */}
        {!isUser && message.appliedCount !== undefined && message.appliedCount > 0 && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {message.appliedCount} işlem uygulandı
            </span>
          </div>
        )}

        {/* Keep / Undo buttons (pending state) */}
        {!isUser && message.undoState === 'pending' && (
          <div className="flex items-center gap-2 px-1 mt-1">
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-all duration-200"
              onClick={() => onKeep?.(message.id)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Koru
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-error/10 text-error hover:bg-error/20 border border-error/20 transition-all duration-200"
              onClick={() => onUndo?.(message.id)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
              Geri Al
            </button>
          </div>
        )}
        

        {/* Kept state: show badge + undo button */}
        {!isUser && message.undoState === 'kept' && message.snapshot && (
          <div className="flex flex-col gap-1.5 px-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success/60">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Değişiklikler korundu
              </span>
            </div>
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-error/10 text-error hover:bg-error/20 border border-error/20 transition-all duration-200 w-fit"
              onClick={() => onUndo?.(message.id)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
              Geri Al
            </button>
          </div>
        )}

        {/* Undone state: show badge + redo button (if available) */}
        {!isUser && message.undoState === 'undone' && (
          <div className="flex flex-col gap-1.5 px-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning/70">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
                Geri alındı
              </span>
            </div>
            {onRedo && message.snapshot && (
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all duration-200 w-fit"
                onClick={() => onRedo?.(message.id)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 7v6h-6" />
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 11" />
                </svg>
                Tekrar Uygula
              </button>
            )}
          </div>
        )}

        {/* Error badges */}
        {!isUser && message.errors && message.errors.length > 0 && (
          <div className="flex flex-col gap-0.5 px-1">
            {message.errors.map((err, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-error/10 text-error">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                {err}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-base-content/30 px-1">
          {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

// ── Suggestion chips ──
const suggestions = [
  'Müşteri memnuniyet anketi oluştur',
  '5 yıldızlı derecelendirme sorusu ekle',
  'Son soruya koşul ekle: kötü derse anketi bitir',
  '2. soruyu çoklu seçim tipine çevir',
  '1. ve 3. sorunun yerini değiştir',
  '1. sorunun koşulunu güncelle',
  'Son soruyu sona kopyala',
  'İlk 2 soruyu sil',
  'Tüm soruları zorunlu yap',
];

function SuggestionChips({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-2.5 p-5">
      <p className="text-xs font-semibold text-base-content/45 uppercase tracking-wide">
        Öneriler
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-base-200/80 text-base-content/50 hover:bg-primary/10 hover:text-primary transition-colors text-left"
            onClick={() => onSelect(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ──

export function AIChatPanel({
  open,
  messages,
  isLoading,
  onSend,
  onClear,
  onClose,
  onKeep,
  onUndo,
  onRedo,
}: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/10 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[min(460px,42vw)] min-w-[320px] z-50
          bg-base-100 border-l border-base-300/40 shadow-2xl
          flex flex-col
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-300/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <SparkleIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-base-content/80">AI Asistan</h3>
              <p className="text-xs text-base-content/45">Gemini ile anket oluştur</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                className="p-2 rounded-lg hover:bg-base-200 text-base-content/30 hover:text-base-content/50 transition-colors"
                onClick={onClear}
                title="Sohbeti temizle"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            )}
            <button
              className="p-2 rounded-lg hover:bg-base-200 text-base-content/30 hover:text-base-content/50 transition-colors"
              onClick={onClose}
              title="Kapat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col h-full">
              {/* Welcome */}
              <div className="flex-1 flex flex-col items-center justify-center px-7 py-9">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <SparkleIcon size={30} />
                </div>
                <h4 className="text-lg font-semibold text-base-content/70 mb-1.5">
                  Merhaba!
                </h4>
                <p className="text-sm text-base-content/45 text-center leading-relaxed max-w-[300px]">
                  Doğal dilde anket oluşturmanıza yardımcı olabilirim. Soru ekleyin, koşullar tanımlayın veya komple bir anket oluşturun.
                </p>
              </div>
              <SuggestionChips onSelect={(t) => { setInput(t); inputRef.current?.focus(); }} />
            </div>
          ) : (
            <div className="flex flex-col gap-4.5 p-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onKeep={onKeep} onUndo={onUndo} onRedo={onRedo} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-base-300/40 p-4">
          <div className="flex items-end gap-2.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Anketiniz için bir istek yazın..."
              rows={1}
              className="flex-1 resize-none bg-base-200/60 border border-base-300/40 rounded-xl px-4 py-3 text-sm text-base-content/80 placeholder:text-base-content/30 focus:border-primary/40 focus:outline-none transition-colors"
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
              disabled={isLoading}
            />
            <button
              className={`
                shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all
                ${input.trim() && !isLoading
                  ? 'bg-primary text-primary-content shadow-sm hover:shadow-md'
                  : 'bg-base-200/60 text-base-content/20 cursor-not-allowed'
                }
              `}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                <path d="m21.854 2.147-10.94 10.939" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-base-content/30 mt-2 text-center">
            Shift+Enter ile yeni satır · Enter ile gönder
          </p>
        </div>
      </div>
    </>
  );
}

