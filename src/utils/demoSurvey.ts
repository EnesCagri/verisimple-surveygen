import type { Question, ConditionalRule } from '../types/survey';
import { QuestionType } from '../types/survey';
import { generateId } from './id';

/**
 * Returns a ready-to-use demo survey with 8 questions
 * (SingleChoice, MultipleChoice, TextEntry, Rating, MatrixLikert)
 * and 2 conditions.
 */
export function buildDemoData(): {
  title: string;
  questions: Question[];
  conditions: ConditionalRule[];
} {
  const q1Guid = generateId();
  const q2Guid = generateId();
  const q3Guid = generateId();
  const q4Guid = generateId();
  const q5Guid = generateId();
  const q6Guid = generateId();
  const q7Guid = generateId();
  const q8Guid = generateId();

  const questions: Question[] = [
    {
      order: 1,
      text: 'Otelimizde genel deneyiminizi nasıl değerlendirirsiniz?',
      type: QuestionType.SingleChoice,
      answers: ['Mükemmel', 'İyi', 'Orta', 'Kötü'],
      guid: q1Guid,
    },
    {
      order: 2,
      text: 'Konaklamanızda en çok neyi beğendiniz?',
      type: QuestionType.MultipleChoice,
      answers: ['Temizlik', 'Personel', 'Konum', 'Yemekler', 'Spa & Havuz'],
      guid: q2Guid,
    },
    {
      order: 3,
      text: 'Otelimizi arkadaşlarınıza tavsiye eder misiniz?',
      type: QuestionType.SingleChoice,
      answers: ['Kesinlikle evet', 'Muhtemelen evet', 'Emin değilim', 'Hayır'],
      guid: q3Guid,
    },
    {
      order: 4,
      text: 'Otelimize genel olarak kaç yıldız verirsiniz?',
      type: QuestionType.Rating,
      answers: [],
      guid: q4Guid,
      settings: {
        ratingCount: 5,
        ratingLabels: { low: 'Çok Kötü', high: 'Mükemmel' },
      },
    },
    {
      order: 5,
      text: 'Aşağıdaki hizmetleri nasıl değerlendirirsiniz?',
      type: QuestionType.MatrixLikert,
      answers: [],
      guid: q5Guid,
      settings: {
        rows: [
          'Resepsiyon hizmeti',
          'Oda temizliği',
          'Restoran kalitesi',
          'Personel ilgisi',
        ],
        columns: [
          'Çok Kötü',
          'Kötü',
          'Orta',
          'İyi',
          'Çok İyi',
        ],
        matrixType: 'single',
      },
    },
    {
      order: 6,
      text: 'Hangi ek hizmetleri kullandınız?',
      type: QuestionType.MultipleChoice,
      answers: ['Oda servisi', 'Restoran', 'Fitness', 'Transfer', 'Tur rehberliği'],
      guid: q6Guid,
    },
    {
      order: 7,
      text: 'Odanızın temizliğini nasıl değerlendirirsiniz?',
      type: QuestionType.SingleChoice,
      answers: ['Çok iyi', 'İyi', 'Kabul edilebilir', 'Yetersiz'],
      guid: q7Guid,
    },
    {
      order: 8,
      text: 'Deneyiminiz hakkında eklemek istediğiniz bir şey var mı?',
      type: QuestionType.TextEntry,
      answers: [],
      guid: q8Guid,
      settings: {
        maxLength: 1250,
        placeholder: 'Düşüncelerinizi buraya yazabilirsiniz...',
      },
    },
  ];

  const conditions: ConditionalRule[] = [
    {
      id: generateId(),
      sourceQuestionId: q1Guid,
      answer: 'Kötü',
      action: { type: 'end_survey' },
    },
    {
      id: generateId(),
      sourceQuestionId: q3Guid,
      answer: 'Hayır',
      action: { type: 'jump_to', targetQuestionId: q7Guid },
    },
  ];

  return {
    title: 'Otel Misafir Deneyimi Anketi',
    questions,
    conditions,
  };
}
