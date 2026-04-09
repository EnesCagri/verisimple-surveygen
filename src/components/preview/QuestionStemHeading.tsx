import type { Question } from '../../types/survey';

interface QuestionStemHeadingProps {
  question: Question;
  /** Düz metin için `h2` sınıfları; zengin metinde `div.prose` ile birleştirilir */
  plainClassName: string;
  emptyFallback?: string;
}

export function QuestionStemHeading({
  question,
  plainClassName,
  emptyFallback = 'Soru metni girilmemiş',
}: QuestionStemHeadingProps) {
  const s = question.settings;
  const html = (s?.richContent ?? '').trim();
  if (s?.useRichQuestionText && html) {
    return (
      <div
        className={`prose prose-lg max-w-none flex-1 ${plainClassName}`}
        dangerouslySetInnerHTML={{ __html: s.richContent! }}
      />
    );
  }
  return (
    <h2 className={plainClassName}>
      {question.text || emptyFallback}
    </h2>
  );
}
