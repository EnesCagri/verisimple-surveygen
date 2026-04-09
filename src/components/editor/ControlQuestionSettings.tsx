import type { Question, QuestionSettings } from '../../types/survey';
import { QuestionType } from '../../types/survey';
import { supportsControlQuestionType } from '../../utils/controlQuestion';

interface ControlQuestionSettingsProps {
  question: Question;
  settings: QuestionSettings;
  onChange: (settings: QuestionSettings) => void;
}

export function ControlQuestionSettings({ question, settings, onChange }: ControlQuestionSettingsProps) {
  const isControlQuestion = settings.isControlQuestion ?? false;
  const correctAnswer = settings.correctAnswer ?? [];
  const typeOk = supportsControlQuestionType(question.type);

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      // Enable control question - set default correct answer based on type
      let defaultCorrect: string[] = [];
      if (question.type === QuestionType.SingleChoice || question.type === QuestionType.MultipleChoice) {
        // Default to first answer if available
        defaultCorrect = question.answers.length > 0 ? [question.answers[0]] : [];
      } else if (question.type === QuestionType.Rating) {
        // Default to middle rating
        const ratingCount = settings.ratingCount ?? 5;
        defaultCorrect = [Math.ceil(ratingCount / 2).toString()];
      }
      onChange({ ...settings, isControlQuestion: true, correctAnswer: defaultCorrect });
    } else {
      // Disable control question
      onChange({ ...settings, isControlQuestion: false, correctAnswer: undefined });
    }
  };

  const handleCorrectAnswerChange = (answer: string, checked: boolean) => {
    if (question.type === QuestionType.MultipleChoice) {
      // Multiple choice: allow multiple correct answers
      const newCorrect = checked
        ? [...correctAnswer, answer]
        : correctAnswer.filter((a) => a !== answer);
      onChange({ ...settings, correctAnswer: newCorrect });
    } else {
      // Single choice or rating: single correct answer
      onChange({ ...settings, correctAnswer: checked ? [answer] : [] });
    }
  };

  if (!typeOk) {
    if (!isControlQuestion) {
      return (
        <div className="rounded-xl border border-base-300/50 bg-base-200/25 px-4 py-3">
          <p className="text-sm font-medium text-base-content/55">Kontrol sorusu</p>
          <p className="mt-1 text-xs text-base-content/40 leading-relaxed">
            Bu soru tipi kontrol sorusu olarak desteklenmiyor. Yalnızca tek seçim, çoklu seçim ve derecelendirme soruları kullanılabilir.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-3 rounded-xl border-2 border-warning/40 bg-warning/10 p-4">
        <p className="text-sm font-semibold text-base-content/80">Kontrol sorusu — desteklenmeyen tip</p>
        <p className="text-xs text-base-content/50 leading-relaxed">
          Bu soru tipinde doğru cevap tanımlanamaz. Kontrol sorusunu kapatın veya soru tipini tek seçim, çoklu seçim veya derecelendirme yapın.
        </p>
        <button
          type="button"
          onClick={() => handleToggle(false)}
          className="btn btn-warning btn-sm rounded-lg"
        >
          Kontrol sorusunu kapat
        </button>
      </div>
    );
  }

  if (!isControlQuestion) {
    return (
      <div className="space-y-3">
        <div
          className={`
            flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
            border-base-300/40 bg-base-200/30
          `}
          onClick={() => handleToggle(true)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-base-content/80">Kontrol Sorusu</p>
            </div>
            <p className="text-xs text-base-content/50">
              Bu soruyu kontrol sorusu olarak işaretleyin. Doğru cevabı belirleyin ve kullanıcının cevabını kontrol edin.
            </p>
          </div>
          <div className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 bg-base-300">
            <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 left-1" />
          </div>
        </div>
      </div>
    );
  }

  // Show correct answer selector
  return (
    <div className="space-y-4 p-4 rounded-xl border-2 border-primary/40 bg-primary/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-base-content/80">Kontrol Sorusu</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            Aktif
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleToggle(false)}
          className="btn btn-ghost btn-xs rounded-lg"
        >
          Kapat
        </button>
      </div>

      <div>
        <p className="text-xs font-medium text-base-content/60 mb-2">Doğru Cevap</p>
        <p className="text-xs text-base-content/40 mb-3">
          {question.type === QuestionType.MultipleChoice
            ? 'Birden fazla doğru cevap seçebilirsiniz'
            : 'Bir doğru cevap seçin'}
        </p>

        {question.type === QuestionType.SingleChoice || question.type === QuestionType.MultipleChoice ? (
          <div className="space-y-2">
            {question.answers.map((answer, index) => {
              const isCorrect = correctAnswer.includes(answer);
              return (
                <label
                  key={index}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${isCorrect
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-base-300/40 bg-base-100'
                    }
                  `}
                >
                  <input
                    type={question.type === QuestionType.MultipleChoice ? 'checkbox' : 'radio'}
                    name="correct-answer"
                    checked={isCorrect}
                    onChange={(e) => handleCorrectAnswerChange(answer, e.target.checked)}
                    className="checkbox checkbox-primary checkbox-sm"
                  />
                  <span className="text-sm text-base-content/70 flex-1">{answer || `Seçenek ${index + 1}`}</span>
                  {isCorrect && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </label>
              );
            })}
          </div>
        ) : question.type === QuestionType.Rating ? (
          <div className="space-y-2">
            {Array.from({ length: settings.ratingCount ?? 5 }, (_, i) => i + 1).map((rating) => {
              const isCorrect = correctAnswer.includes(rating.toString());
              return (
                <label
                  key={rating}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${isCorrect
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-base-300/40 bg-base-100'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="correct-rating"
                    checked={isCorrect}
                    onChange={(e) => handleCorrectAnswerChange(rating.toString(), e.target.checked)}
                    className="radio radio-primary radio-sm"
                  />
                  <span className="text-sm text-base-content/70 flex-1">
                    {rating} {rating === 1 ? 'yıldız' : 'yıldız'}
                  </span>
                  {isCorrect && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </label>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

