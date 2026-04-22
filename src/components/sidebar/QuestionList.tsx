import type React from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import type { Question, ConditionalRule } from '../../types/survey';
import { QuestionCard } from './QuestionCard';
import { questionHasOutgoingCondition } from '../../utils/questionReorderGuard';

interface QuestionListProps {
  questions: Question[];
  selectedId: string | null;
  conditions: ConditionalRule[];
  onSelect: (guid: string) => void;
  onDelete: (guid: string) => void;
  onDuplicate: (guid: string) => void;
  onReorder: (questions: Question[]) => void;
  onUpdate?: (guid: string, updates: Partial<Omit<Question, 'guid'>>) => void;
}

export function QuestionList({
  questions,
  selectedId,
  conditions,
  onSelect,
  onDelete,
  onDuplicate,
  onReorder,
  onUpdate,
}: QuestionListProps) {
  const handleDragEnd = (event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragEnd']>>[0]) => {
    if (event.canceled || event.operation.canceled) return;

    const { source, target } = event.operation;
    if (!source) return;

    let oldIndex = -1;
    let newIndex = -1;

    if (isSortable(source) && typeof source.initialIndex === 'number' && typeof source.index === 'number') {
      oldIndex = source.initialIndex;
      newIndex = source.index;
    } else if (target) {
      const sourceId = String(source.id);
      const targetId = String(target.id);
      if (sourceId === targetId) return;
      oldIndex = questions.findIndex((q) => q.guid === sourceId);
      newIndex = questions.findIndex((q) => q.guid === targetId);
    }

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    if (oldIndex >= questions.length || newIndex >= questions.length) return;

    const reordered = [...questions];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
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
              dragDisabled={questionHasOutgoingCondition(question.guid, conditions)}
              onSelect={onSelect}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </DragDropProvider>
    </>
  );
}
