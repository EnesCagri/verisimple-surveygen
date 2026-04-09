import type {
  Question,
  QuestionSettings,
  ConditionAction,
  ConditionInput,
  ConditionOperator,
  ConditionalRule,
} from '../types/survey';
import { QuestionType } from '../types/survey';
import { generateId } from './id';

// ── Gemini action shapes ──

interface AIAddQuestions {
  type: 'add_questions';
  questions: AIQuestionDef[];
  /** Insert after this order position. If omitted, appends to end. */
  insertAfterOrder?: number;
}

interface AIQuestionDef {
  text: string;
  questionType: number;
  answers?: string[];
  settings?: QuestionSettings;
  required?: boolean;
}

interface AIUpdateQuestion {
  type: 'update_question';
  questionOrder: number;
  updates: Partial<{
    text: string;
    questionType: number;
    answers: string[];
    settings: QuestionSettings;
    required: boolean;
  }>;
}

interface AIDeleteQuestion {
  type: 'delete_question';
  questionOrder: number;
}

interface AIAddCondition {
  type: 'add_condition';
  sourceQuestionOrder: number;
  operator?: string;
  /** Tek şık / çoğu operatör için */
  answer?: string;
  /** equals_any için şık listesi */
  answerValues?: string[];
  actionType: 'end_survey' | 'jump_to';
  targetQuestionOrder?: number;
  rowIndex?: number;
}

interface AIRemoveCondition {
  type: 'remove_condition';
  sourceQuestionOrder: number;
  answer?: string;
}

interface AISetTitle {
  type: 'set_title';
  title: string;
}

interface AIReplaceAll {
  type: 'replace_all';
  title?: string;
  questions: AIQuestionDef[];
  conditions?: AIAddCondition[];
}

// ── NEW action shapes ──

interface AIMoveQuestion {
  type: 'move_question';
  fromOrder: number;
  toOrder: number;
}

interface AIDuplicateQuestion {
  type: 'duplicate_question';
  questionOrder: number;
}

interface AIUpdateCondition {
  type: 'update_condition';
  sourceQuestionOrder: number;
  oldAnswer: string;
  updates: {
    answer?: string;
    answerValues?: string[];
    operator?: string;
    actionType?: 'end_survey' | 'jump_to';
    targetQuestionOrder?: number;
    rowIndex?: number;
  };
}

interface AIBulkDeleteQuestions {
  type: 'bulk_delete_questions';
  questionOrders: number[];
}

interface AIRemoveAllConditions {
  type: 'remove_all_conditions';
  sourceQuestionOrder: number;
}

interface AISwapQuestions {
  type: 'swap_questions';
  orderA: number;
  orderB: number;
}

export type AIAction =
  | AIAddQuestions
  | AIUpdateQuestion
  | AIDeleteQuestion
  | AIAddCondition
  | AIRemoveCondition
  | AISetTitle
  | AIReplaceAll
  | AIMoveQuestion
  | AIDuplicateQuestion
  | AIUpdateCondition
  | AIBulkDeleteQuestions
  | AIRemoveAllConditions
  | AISwapQuestions;

export interface AIResponse {
  message: string;
  actions: AIAction[];
}

// ── Callbacks that BuilderPage will provide ──

export interface SurveyMutators {
  setTitle: (title: string) => void;
  addQuestionWithData: (question: Question) => void;
  updateQuestion: (guid: string, updates: Partial<Omit<Question, 'guid'>>) => void;
  deleteQuestion: (guid: string) => void;
  addCondition: (sourceQuestionId: string, input: ConditionInput) => void;
  updateCondition: (conditionId: string, input: ConditionInput) => void;
  removeCondition: (conditionId: string) => void;
  /** Replace the entire survey (questions + conditions) */
  replaceAll: (title: string, questions: Question[], conditions: ConditionalRule[]) => void;
  /** Reorder questions (pass full reordered array) */
  reorderQuestions: (reordered: Question[]) => void;
  /** Current state getters */
  getQuestions: () => Question[];
  getConditions: () => ConditionalRule[];
}

/**
 * Parse and validate the raw JSON string from Gemini.
 */
export function parseAIResponse(raw: string): AIResponse {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    // Remove first line (```json or ```) and last line (```)
    const lines = cleaned.split('\n');
    lines.shift(); // remove opening fence
    if (lines[lines.length - 1]?.trim() === '```') {
      lines.pop();
    }
    cleaned = lines.join('\n').trim();
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Geçersiz AI yanıtı');
  }

  return {
    message: typeof parsed.message === 'string' ? parsed.message : 'İşlem tamamlandı.',
    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
  };
}

/**
 * Execute all AI actions against the survey state.
 * Returns a summary of what was done.
 */
export function executeAIActions(
  response: AIResponse,
  mutators: SurveyMutators,
): { applied: number; errors: string[] } {
  let applied = 0;
  const errors: string[] = [];

  for (const action of response.actions) {
    try {
      switch (action.type) {
        case 'set_title':
          mutators.setTitle(action.title);
          applied++;
          break;

        case 'add_questions': {
          // First, build and append all new questions at the end
          const newGuids: string[] = [];
          for (const qDef of action.questions) {
            const q = buildQuestion(qDef, mutators.getQuestions().length + 1);
            mutators.addQuestionWithData(q);
            newGuids.push(q.guid);
            applied++;
          }

          // If insertAfterOrder is specified, reorder to place new questions at the right position
          if (action.insertAfterOrder !== undefined && newGuids.length > 0) {
            const allQuestions = [...mutators.getQuestions()].sort((a, b) => a.order - b.order);
            const insertIdx = Math.min(Math.max(action.insertAfterOrder, 0), allQuestions.length);

            // Separate: existing (without newly added) + newly added
            const existing = allQuestions.filter((q) => !newGuids.includes(q.guid));
            const added = allQuestions.filter((q) => newGuids.includes(q.guid));

            // Splice new questions into the correct position
            const reordered = [
              ...existing.slice(0, insertIdx),
              ...added,
              ...existing.slice(insertIdx),
            ];
            mutators.reorderQuestions(reordered);
          }
          break;
        }

        case 'update_question': {
          const questions = mutators.getQuestions();
          const target = questions.find((q) => q.order === action.questionOrder);
          if (!target) {
            errors.push(`Soru #${action.questionOrder} bulunamadı`);
            break;
          }
          const updates: Partial<Omit<Question, 'guid'>> = {};
          if (action.updates.text !== undefined) updates.text = action.updates.text;
          if (action.updates.answers !== undefined) updates.answers = action.updates.answers;
          if (action.updates.settings !== undefined) updates.settings = action.updates.settings;
          if (action.updates.required !== undefined) updates.required = action.updates.required;
          if (action.updates.questionType !== undefined) {
            const newType = toQuestionType(action.updates.questionType);
            updates.type = newType;
            // When changing question type, also migrate answers/settings to sensible defaults
            if (newType !== target.type) {
              if (!action.updates.answers) {
                // Provide appropriate default answers for the new type
                if (newType === QuestionType.SingleChoice || newType === QuestionType.MultipleChoice || newType === QuestionType.Sortable) {
                  updates.answers = target.answers.length > 0 ? target.answers : ['Seçenek 1', 'Seçenek 2'];
                } else {
                  updates.answers = [];
                }
              }
              if (!action.updates.settings) {
                updates.settings = getDefaultSettings(newType);
              }
            }
          }
          mutators.updateQuestion(target.guid, updates);
          applied++;
          break;
        }

        case 'delete_question': {
          const questions = mutators.getQuestions();
          const target = questions.find((q) => q.order === action.questionOrder);
          if (!target) {
            errors.push(`Soru #${action.questionOrder} bulunamadı`);
            break;
          }
          mutators.deleteQuestion(target.guid);
          applied++;
          break;
        }

        case 'add_condition': {
          const questions = mutators.getQuestions();
          const src = questions.find((q) => q.order === action.sourceQuestionOrder);
          if (!src) {
            errors.push(`Kaynak soru #${action.sourceQuestionOrder} bulunamadı`);
            break;
          }

          const condAction = buildConditionAction(action, questions);
          if (!condAction) {
            errors.push(`Koşul hedefi bulunamadı (soru #${action.targetQuestionOrder})`);
            break;
          }

          const op = (action.operator as ConditionOperator) ?? undefined;
          const multi =
            op === 'equals_any' && action.answerValues && action.answerValues.length > 0
              ? action.answerValues
              : undefined;
          const input: ConditionInput = {
            answer: multi ? multi[0] : (action.answer ?? '*'),
            answerValues: multi,
            action: condAction,
            operator: op,
            rowIndex: action.rowIndex,
          };
          mutators.addCondition(src.guid, input);
          applied++;
          break;
        }

        case 'remove_condition': {
          const questions = mutators.getQuestions();
          const conditions = mutators.getConditions();
          const src = questions.find((q) => q.order === action.sourceQuestionOrder);
          if (!src) break;

          // Find matching condition
          const match = conditions.find(
            (c) =>
              c.sourceQuestionId === src.guid &&
              (action.answer === undefined || c.answer === action.answer),
          );
          if (match) {
            mutators.removeCondition(match.id);
            applied++;
          } else {
            errors.push(`Eşleşen koşul bulunamadı (S${action.sourceQuestionOrder})`);
          }
          break;
        }

        // ── NEW: Update an existing condition ──
        case 'update_condition': {
          const questions = mutators.getQuestions();
          const conditions = mutators.getConditions();
          const src = questions.find((q) => q.order === action.sourceQuestionOrder);
          if (!src) {
            errors.push(`Kaynak soru #${action.sourceQuestionOrder} bulunamadı`);
            break;
          }

          // Find the condition to update by source + old answer
          const match = conditions.find(
            (c) => c.sourceQuestionId === src.guid && c.answer === action.oldAnswer,
          );
          if (!match) {
            errors.push(`Güncellenecek koşul bulunamadı (S${action.sourceQuestionOrder}, cevap: "${action.oldAnswer}")`);
            break;
          }

          // Build updated condition input
          const newAnswer = action.updates.answer ?? match.answer;
          let newAction: ConditionAction = match.action;
          if (action.updates.actionType) {
            const built = buildConditionAction(
              { actionType: action.updates.actionType, targetQuestionOrder: action.updates.targetQuestionOrder },
              questions,
            );
            if (built) newAction = built;
          }

          const newOp = (action.updates.operator as ConditionOperator) ?? match.operator;
          let useMulti: string[] | undefined;
          if (newOp === 'equals_any') {
            const vals =
              action.updates.answerValues !== undefined
                ? action.updates.answerValues
                : match.answerValues;
            useMulti = vals && vals.length > 0 ? [...vals] : undefined;
          }
          const updatedInput: ConditionInput = {
            answer: useMulti ? useMulti[0] : newAnswer,
            answerValues: useMulti,
            action: newAction,
            operator: newOp,
            rowIndex: action.updates.rowIndex ?? match.rowIndex,
          };
          mutators.updateCondition(match.id, updatedInput);
          applied++;
          break;
        }

        // ── NEW: Move a question from one position to another ──
        case 'move_question': {
          const questions = [...mutators.getQuestions()].sort((a, b) => a.order - b.order);
          const fromIdx = action.fromOrder - 1;
          const toIdx = action.toOrder - 1;
          if (fromIdx < 0 || fromIdx >= questions.length) {
            errors.push(`Kaynak pozisyon #${action.fromOrder} geçersiz`);
            break;
          }
          if (toIdx < 0 || toIdx >= questions.length) {
            errors.push(`Hedef pozisyon #${action.toOrder} geçersiz`);
            break;
          }
          // Remove from old position and insert at new position
          const [moved] = questions.splice(fromIdx, 1);
          questions.splice(toIdx, 0, moved);
          mutators.reorderQuestions(questions);
          applied++;
          break;
        }

        // ── NEW: Swap two questions ──
        case 'swap_questions': {
          const questions = [...mutators.getQuestions()].sort((a, b) => a.order - b.order);
          const idxA = action.orderA - 1;
          const idxB = action.orderB - 1;
          if (idxA < 0 || idxA >= questions.length || idxB < 0 || idxB >= questions.length) {
            errors.push(`Geçersiz soru pozisyonları: #${action.orderA} ve #${action.orderB}`);
            break;
          }
          // Swap in array
          [questions[idxA], questions[idxB]] = [questions[idxB], questions[idxA]];
          mutators.reorderQuestions(questions);
          applied++;
          break;
        }

        // ── NEW: Duplicate a question ──
        case 'duplicate_question': {
          const questions = mutators.getQuestions();
          const source = questions.find((q) => q.order === action.questionOrder);
          if (!source) {
            errors.push(`Kopyalanacak soru #${action.questionOrder} bulunamadı`);
            break;
          }
          const clone: Question = {
            ...structuredClone(source),
            guid: generateId(),
            order: questions.length + 1,
            text: source.text + ' (Kopya)',
          };
          mutators.addQuestionWithData(clone);
          applied++;
          break;
        }

        // ── NEW: Delete multiple questions at once ──
        case 'bulk_delete_questions': {
          const questions = mutators.getQuestions();
          // Sort descending so deletion indices don't shift
          const orders = [...action.questionOrders].sort((a, b) => b - a);
          for (const ord of orders) {
            const target = questions.find((q) => q.order === ord);
            if (target) {
              mutators.deleteQuestion(target.guid);
              applied++;
            } else {
              errors.push(`Soru #${ord} bulunamadı`);
            }
          }
          break;
        }

        // ── NEW: Remove all conditions from a specific question ──
        case 'remove_all_conditions': {
          const questions = mutators.getQuestions();
          const conditions = mutators.getConditions();
          const src = questions.find((q) => q.order === action.sourceQuestionOrder);
          if (!src) {
            errors.push(`Soru #${action.sourceQuestionOrder} bulunamadı`);
            break;
          }
          const matching = conditions.filter((c) => c.sourceQuestionId === src.guid);
          if (matching.length === 0) {
            errors.push(`Soru #${action.sourceQuestionOrder} için koşul bulunamadı`);
          }
          for (const c of matching) {
            mutators.removeCondition(c.id);
            applied++;
          }
          break;
        }

        case 'replace_all': {
          const newTitle = action.title ?? 'Yeni Anket';
          const newQuestions = action.questions.map((qDef, i) =>
            buildQuestion(qDef, i + 1),
          );

          const newConditions: ConditionalRule[] = [];
          if (action.conditions) {
            for (const cDef of action.conditions) {
              const src = newQuestions.find((q) => q.order === cDef.sourceQuestionOrder);
              if (!src) continue;
              const condAction = buildConditionAction(cDef, newQuestions);
              if (!condAction) continue;

              const rop = (cDef.operator as ConditionOperator) ?? undefined;
              const rmulti =
                rop === 'equals_any' && cDef.answerValues && cDef.answerValues.length > 0
                  ? cDef.answerValues
                  : undefined;
              newConditions.push({
                id: generateId(),
                sourceQuestionId: src.guid,
                answer: rmulti ? rmulti[0] : (cDef.answer ?? '*'),
                ...(rmulti ? { answerValues: rmulti } : {}),
                action: condAction,
                operator: rop,
                rowIndex: cDef.rowIndex,
              });
            }
          }

          mutators.replaceAll(newTitle, newQuestions, newConditions);
          applied++;
          break;
        }

        default:
          errors.push(`Bilinmeyen action tipi: ${(action as { type: string }).type}`);
      }
    } catch (e) {
      errors.push(`İşlem hatası: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { applied, errors };
}

// ── Helpers ──

function toQuestionType(n: number): QuestionType {
  const valid = [1, 2, 3, 5, 6, 7];
  return valid.includes(n) ? (n as QuestionType) : QuestionType.SingleChoice;
}

/** Get sensible default settings when changing question type */
function getDefaultSettings(type: QuestionType): QuestionSettings | undefined {
  switch (type) {
    case QuestionType.Rating:
      return { ratingCount: 5, ratingLabels: { low: 'Çok Kötü', high: 'Çok İyi' } };
    case QuestionType.TextEntry:
      return { maxLength: 1250, placeholder: '' };
    case QuestionType.MatrixLikert:
      return {
        rows: ['Satır 1'],
        columns: ['Kesinlikle Katılmıyorum', 'Katılmıyorum', 'Kararsızım', 'Katılıyorum', 'Kesinlikle Katılıyorum'],
        matrixType: 'single',
      };
    case QuestionType.Sortable:
      return {};
    default:
      return undefined;
  }
}

function buildQuestion(def: AIQuestionDef, order: number): Question {
  const legacyRich = def.questionType === 8;
  const type = legacyRich ? QuestionType.TextEntry : toQuestionType(def.questionType);
  const question: Question = {
    order,
    text: def.text ?? '',
    type,
    answers: legacyRich
      ? []
      : def.answers ?? (type <= 2 || type === QuestionType.Sortable ? [''] : []),
    guid: generateId(),
  };

  if (def.required !== undefined) {
    question.required = def.required;
  }

  if (legacyRich) {
    const s = (def.settings ?? {}) as Record<string, unknown>;
    const hasResponse = s.hasResponse === true;
    if (!hasResponse) {
      question.required = false;
    }
    question.settings = {
      useRichQuestionText: true,
      richContent: String(s.richContent ?? def.text ?? ''),
      richInformationOnly: !hasResponse,
      ...(hasResponse
        ? {
            maxLength: typeof s.responseMaxLength === 'number' ? s.responseMaxLength : 2000,
            placeholder:
              typeof s.responsePlaceholder === 'string' ? s.responsePlaceholder : 'Cevabınızı yazın...',
          }
        : {}),
    };
  } else if (def.settings && Object.keys(def.settings).length > 0) {
    question.settings = def.settings;
  } else {
    const defaults = getDefaultSettings(type);
    if (defaults) question.settings = defaults;
  }

  return question;
}

function buildConditionAction(
  def: { actionType: string; targetQuestionOrder?: number },
  questions: Question[],
): ConditionAction | null {
  if (def.actionType === 'end_survey') {
    return { type: 'end_survey' };
  }

  if (def.actionType === 'jump_to' && def.targetQuestionOrder !== undefined) {
    const target = questions.find((q) => q.order === def.targetQuestionOrder);
    if (!target) return null;
    return { type: 'jump_to', targetQuestionId: target.guid };
  }

  return null;
}
