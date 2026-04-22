import { useLayoutEffect, useRef, useCallback } from 'react';
import { answerImageSlotKey } from '../../utils/answerImages';
import { AnswerItem } from './AnswerItem';

interface AnswerEditorProps {
  answers: string[];
  answerImages?: Record<string, string>;
  onChange: (answers: string[]) => void;
  onAnswerImagesChange?: (answerImages: Record<string, string>) => void;
}

export function AnswerEditor({ answers, answerImages = {}, onChange, onAnswerImagesChange }: AnswerEditorProps) {
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const pendingFocusIndex = useRef<number | null>(null);

  const handleAddAfter = useCallback(
    (afterIndex: number) => {
      const insertAt = afterIndex + 1;
      pendingFocusIndex.current = insertAt;
      onChange([...answers.slice(0, insertAt), '', ...answers.slice(insertAt)]);
    },
    [answers, onChange],
  );

  useLayoutEffect(() => {
    const idx = pendingFocusIndex.current;
    if (idx === null) return;
    pendingFocusIndex.current = null;
    inputRefs.current[idx]?.focus();
  }, [answers]);

  const setAnswerInputRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  const handleAnswerChange = (index: number, value: string) => {
    const oldValue = answers[index] ?? '';
    const updated = [...answers];
    updated[index] = value;
    onChange(updated);

    if (!onAnswerImagesChange) return;

    const oldKey = oldValue.trim() ? oldValue : answerImageSlotKey(index);
    const newKey = value.trim() ? value : answerImageSlotKey(index);
    const img = answerImages[oldKey];
    if (img && oldKey !== newKey) {
      const newImages = { ...answerImages };
      delete newImages[oldKey];
      newImages[newKey] = img;
      onAnswerImagesChange(newImages);
    }
  };

  const handleRemove = (index: number) => {
    const removedAnswer = answers[index] ?? '';
    onChange(answers.filter((_, i) => i !== index));

    if (!onAnswerImagesChange) return;
    const removedKey = removedAnswer.trim() ? removedAnswer : answerImageSlotKey(index);
    const next = { ...answerImages };
    delete next[removedKey];

    const reindexed: Record<string, string> = {};
    for (const [k, v] of Object.entries(next)) {
      const m = /^__slot_(\d+)$/.exec(k);
      if (!m) {
        reindexed[k] = v;
        continue;
      }
      const oldIdx = Number(m[1]);
      if (oldIdx > index) reindexed[answerImageSlotKey(oldIdx - 1)] = v;
      else reindexed[k] = v;
    }
    onAnswerImagesChange(reindexed);
  };

  const handleAdd = () => {
    pendingFocusIndex.current = answers.length;
    onChange([...answers, '']);
  };

  const handleImageChange = (index: number, image: string | undefined) => {
    if (!onAnswerImagesChange) return;

    let rowText = answers[index]?.trim() ?? '';

    if (image && !rowText) {
      const placeholder = `Seçenek ${index + 1}`;
      const updated = [...answers];
      updated[index] = placeholder;
      onChange(updated);
      rowText = placeholder;
    }

    const key = rowText || answerImageSlotKey(index);
    const newImages = { ...answerImages };
    if (image) {
      newImages[key] = image;
      delete newImages[answerImageSlotKey(index)];
    } else {
      delete newImages[key];
      delete newImages[answerImageSlotKey(index)];
    }
    onAnswerImagesChange(newImages);
  };

  return (
    <div>
      <p className="text-sm font-medium text-base-content/60 mb-3">Seçenekler</p>
      <div className="space-y-1">
        {answers.map((answer, index) => (
          <AnswerItem
            key={index}
            index={index}
            value={answer}
            image={
              answer.trim()
                ? answerImages[answer]
                : answerImages[answerImageSlotKey(index)]
            }
            onChange={handleAnswerChange}
            onImageChange={handleImageChange}
            onRemove={handleRemove}
            canRemove={answers.length > 1}
            onEnterAddAfter={handleAddAfter}
            answerInputRef={setAnswerInputRef(index)}
          />
        ))}
      </div>
      <button
        className="mt-3 text-sm font-medium text-primary/70 hover:text-primary transition-colors flex items-center gap-1.5"
        onClick={handleAdd}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Seçenek Ekle
      </button>
    </div>
  );
}
