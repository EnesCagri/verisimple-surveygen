import { useState } from 'react';
import type React from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import type { Question } from '../../types/survey';
import { QuestionCard } from './QuestionCard';

interface QuestionListProps {
  questions: Question[];
  selectedId: string | null;
  hasConditions?: boolean;
  onSelect: (guid: string) => void;
  onDelete: (guid: string) => void;
  onReorder: (questions: Question[]) => void;
  onUpdate?: (guid: string, updates: Partial<Omit<Question, 'guid'>>) => void;
}

export function QuestionList({
  questions,
  selectedId,
  hasConditions = false,
  onSelect,
  onDelete,
  onReorder,
  onUpdate,
}: QuestionListProps) {
  const [pendingReorder, setPendingReorder] = useState<Question[] | null>(null);

  const handleDragEnd = (event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragEnd']>>[0]) => {
    const source = event.operation.source;
    const target = event.operation.target;
    if (!source || !target) return;

    const sourceId = String(source.id);
    const targetId = String(target.id);
    if (sourceId === targetId) return;

    const oldIndex = questions.findIndex((q) => q.guid === sourceId);
    const newIndex = questions.findIndex((q) => q.guid === targetId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...questions];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    if (hasConditions) {
      // Show warning before reordering
      setPendingReorder(reordered);
    } else {
      onReorder(reordered);
    }
  };

  const confirmReorder = () => {
    if (pendingReorder) {
      onReorder(pendingReorder);
      setPendingReorder(null);
    }
  };

  const cancelReorder = () => {
    setPendingReorder(null);
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
        <span className="text-4xl mb-2">📋</span>
        <p className="text-sm">Henüz soru eklenmedi</p>
      </div>
    );
  }

  return (
    <>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-2">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.guid}
              question={question}
              index={index}
              isSelected={selectedId === question.guid}
              onSelect={onSelect}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </DragDropProvider>

      {/* Reorder warning modal */}
      {pendingReorder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-300/40 max-w-sm w-full mx-4 overflow-hidden animate-[fadeSlideIn_0.2s_ease-out]">
            {/* Header */}
            <div className="p-5 pb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-base-content/85">Sıra Değişikliği</h3>
                  <p className="text-xs text-base-content/40">Koşullu akış uyarısı</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-4">
              <p className="text-sm text-base-content/60 leading-relaxed">
                Bu ankette <span className="font-semibold text-warning">koşullu akış kuralları</span> tanımlanmış. 
                Soru sırasını değiştirmek mevcut akış mantığını bozabilir.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-warning/5 border border-warning/20">
                <p className="text-xs text-base-content/50 leading-relaxed">
                  <span className="font-semibold text-warning/80">Öneri:</span> Sıralamayı değiştirdikten sonra 
                  <span className="font-medium"> Akış</span> sekmesinden koşulları kontrol edin.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 px-5 py-4 bg-base-200/30 border-t border-base-300/30">
              <button
                className="btn btn-sm btn-ghost rounded-xl flex-1"
                onClick={cancelReorder}
              >
                Vazgeç
              </button>
              <button
                className="btn btn-sm btn-warning rounded-xl flex-1 text-warning-content"
                onClick={confirmReorder}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Yine de Değiştir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
