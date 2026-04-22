import type { Question } from '../../types/survey';

interface QuestionStemHeadingProps {
  question: Question;
  /** Düz metin için `h2` sınıfları; zengin metinde `div.prose` ile birleştirilir */
  plainClassName: string;
  emptyFallback?: string;
  /** Telefon mockup gibi dar alanlarda daha küçük tipografi */
  compact?: boolean;
}

export function QuestionStemHeading({
  question,
  plainClassName,
  emptyFallback = 'Soru metni girilmemiş',
  compact = false,
}: QuestionStemHeadingProps) {
  const s = question.settings;
  const html = (s?.richContent ?? '').trim();
  if (s?.useRichQuestionText && html) {
    return (
      <div
        className={`max-w-none flex-1 break-words [&_img]:h-auto [&_img]:max-w-full ${compact ? 'prose prose-sm' : 'prose prose-lg'} ${plainClassName}`}
        dangerouslySetInnerHTML={{ __html: s.richContent! }}
      />
    );
  }
  return (
    <h2 className={`break-words [overflow-wrap:anywhere] ${plainClassName}`}>
      {question.text || emptyFallback}
    </h2>
  );
}
