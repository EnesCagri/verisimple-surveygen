import type { Question } from '../../types/survey';
import { QuestionEditor } from './QuestionEditor';

interface EditorPanelProps {
  question: Question | null;
  onUpdate: (guid: string, updates: Partial<Omit<Question, 'guid'>>) => void;
}

export function EditorPanel({ question, onUpdate }: EditorPanelProps) {
  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-base-content/30">
        <div className="w-16 h-16 rounded-2xl bg-base-300/30 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/20">
            <path d="M12 20h9" />
            <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
          </svg>
        </div>
        <p className="text-base font-medium mb-1">Düzenlemek için bir soru seçin</p>
        <p className="text-sm text-base-content/20">
          Soldaki panelden bir soru seçin veya yeni soru ekleyin
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <QuestionEditor question={question} onUpdate={onUpdate} />
    </div>
  );
}
