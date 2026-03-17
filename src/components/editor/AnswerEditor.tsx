import { AnswerItem } from './AnswerItem';

interface AnswerEditorProps {
  answers: string[];
  answerImages?: Record<string, string>;
  onChange: (answers: string[]) => void;
  onAnswerImagesChange?: (answerImages: Record<string, string>) => void;
}

export function AnswerEditor({ answers, answerImages = {}, onChange, onAnswerImagesChange }: AnswerEditorProps) {
  const handleAnswerChange = (index: number, value: string) => {
    const oldValue = answers[index];
    const updated = [...answers];
    updated[index] = value;
    onChange(updated);

    // Update answerImages key if the answer text changed
    if (oldValue && answerImages[oldValue] && onAnswerImagesChange) {
      const newImages = { ...answerImages };
      const img = newImages[oldValue];
      delete newImages[oldValue];
      if (value) newImages[value] = img;
      onAnswerImagesChange(newImages);
    }
  };

  const handleRemove = (index: number) => {
    const removedAnswer = answers[index];
    onChange(answers.filter((_, i) => i !== index));

    // Also remove image for this answer
    if (removedAnswer && answerImages[removedAnswer] && onAnswerImagesChange) {
      const newImages = { ...answerImages };
      delete newImages[removedAnswer];
      onAnswerImagesChange(newImages);
    }
  };

  const handleAdd = () => {
    onChange([...answers, '']);
  };

  const handleImageChange = (index: number, image: string | undefined) => {
    if (!onAnswerImagesChange) return;
    const answer = answers[index];
    if (!answer) return;

    const newImages = { ...answerImages };
    if (image) {
      newImages[answer] = image;
    } else {
      delete newImages[answer];
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
            image={answer ? answerImages[answer] : undefined}
            onChange={handleAnswerChange}
            onImageChange={handleImageChange}
            onRemove={handleRemove}
            canRemove={answers.length > 1}
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
