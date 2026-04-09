import { QuestionType } from '../types/survey';

/**
 * Human-readable labels for each question type.
 */
export const questionTypeLabels: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: 'Tek Seçim',
  [QuestionType.MultipleChoice]: 'Çoklu Seçim',
  [QuestionType.TextEntry]: 'Metin Girişi',
  [QuestionType.Rating]: 'Derecelendirme',
  [QuestionType.MatrixLikert]: 'Matrix Likert',
  [QuestionType.Sortable]: 'Sıralama',
};

/**
 * Short tooltip descriptions for each question type.
 * Shown when hovering over type badges / icons.
 */
export const questionTypeDescriptions: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: 'Katılımcı yalnızca bir seçenek işaretler',
  [QuestionType.MultipleChoice]: 'Katılımcı birden fazla seçenek işaretleyebilir',
  [QuestionType.TextEntry]: 'Katılımcı serbest metin yazar',
  [QuestionType.Rating]: 'Yıldız veya puan bazlı derecelendirme',
  [QuestionType.MatrixLikert]: 'Satır-sütun tabanlı ölçek sorusu',
  [QuestionType.Sortable]: 'Katılımcı seçenekleri sürükleyerek sıralar',
};

