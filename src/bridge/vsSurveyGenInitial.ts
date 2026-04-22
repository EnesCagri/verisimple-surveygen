import type { ConditionalRule, Question, Survey } from '../types/survey';
import { normalizeSurveyQuestion } from '../utils/normalizeSurveyQuestion';
import { generateId } from '../utils/id';

function parseQuestionsField(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  }
  return [];
}

function parseConditionsField(raw: unknown): unknown[] {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  }
  return [];
}

function coerceQuestionFromHost(row: unknown): Question | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Partial<Question>;
  if (typeof r.guid !== 'string' || !r.guid) return null;
  if (typeof r.text !== 'string') return null;
  if (typeof r.type !== 'number') return null;
  if (!Array.isArray(r.answers)) return null;
  return normalizeSurveyQuestion(r as Question);
}

function normalizeConditionFromHost(row: unknown): ConditionalRule | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id : '';
  const sourceQuestionId =
    typeof o.sourceQuestionId === 'string' ? o.sourceQuestionId : '';
  const answer = typeof o.answer === 'string' ? o.answer : '';
  if (!id || !sourceQuestionId) return null;

  let action: ConditionalRule['action'];
  const rawAction = o.action;
  if (rawAction === 'end_survey' || (rawAction && typeof rawAction === 'object' && (rawAction as { type?: string }).type === 'end_survey')) {
    action = { type: 'end_survey' };
  } else if (rawAction && typeof rawAction === 'object') {
    const a = rawAction as Record<string, unknown>;
    if (a.type === 'jump_to' && typeof a.targetQuestionId === 'string') {
      action = { type: 'jump_to', targetQuestionId: a.targetQuestionId };
    } else if (typeof a.jumpTo === 'string') {
      action = { type: 'jump_to', targetQuestionId: a.jumpTo };
    } else {
      return null;
    }
  } else {
    return null;
  }

  const out: ConditionalRule = {
    id,
    sourceQuestionId,
    answer,
    action,
  };
  if (Array.isArray(o.answerValues)) {
    out.answerValues = o.answerValues.filter((x): x is string => typeof x === 'string');
  }
  if (typeof o.operator === 'string') {
    out.operator = o.operator as ConditionalRule['operator'];
  }
  if (typeof o.rowIndex === 'number') {
    out.rowIndex = o.rowIndex;
  }
  return out;
}

/**
 * Düzenleme modu: `__VS_SURVEYGEN_INITIAL__` nesnesi (null değil) ve `surveyGuid` dolu.
 * Sunucu `questions`’ı genelde JSON **string** olarak gönderir → `JSON.parse`.
 */
export function readVsSurveyGenInitialSurvey(): Survey | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.__VS_SURVEYGEN_INITIAL__;
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== 'object') return null;

    const guidRaw = raw.surveyGuid;
    if (guidRaw == null || String(guidRaw).trim() === '') return null;

    const title =
      typeof raw.title === 'string' && raw.title.trim() ? raw.title : 'Yeni Anket';

    const qRows = parseQuestionsField(raw.questions);
    const questions: Question[] = [];
    for (let i = 0; i < qRows.length; i++) {
      const q = coerceQuestionFromHost(qRows[i]);
      if (!q) continue;
      questions.push({
        ...q,
        order: typeof q.order === 'number' && q.order > 0 ? q.order : i + 1,
      });
    }

    const cRows = parseConditionsField(raw.conditions);
    const conditions: ConditionalRule[] = [];
    for (const row of cRows) {
      const c = normalizeConditionFromHost(row);
      if (c) conditions.push(c);
    }

    const now = new Date().toISOString();
    return {
      id: generateId(),
      surveyGuid: String(guidRaw).trim(),
      title,
      questions,
      conditions,
      createdAt: now,
      updatedAt: now,
    };
  } catch (err) {
    console.error('[__VS_SURVEYGEN_INITIAL__] okuma / parse hatası:', err);
    return null;
  }
}

/**
 * Host’un sayfaya koyduğu düzenleme `Survey.Guid` — **çağrı anında** okunur.
 * `useSurvey` içi state sıfırlansa veya taslakta `surveyGuid` yoksa bile
 * `getSurveyPayload` / `saveSurvey` gövdesinde yedek olarak kullanılır
 * (host `__surveyGuidMap` + `payload.surveyGuid` zincirine ek yedek).
 */
export function readBootstrapSurveyGuid(): string | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    const init = window.__VS_SURVEYGEN_INITIAL__;
    if (init === null || init === undefined) return undefined;
    const g = init.surveyGuid;
    if (g == null) return undefined;
    const t = String(g).trim();
    return t.length > 0 ? t : undefined;
  } catch {
    return undefined;
  }
}
