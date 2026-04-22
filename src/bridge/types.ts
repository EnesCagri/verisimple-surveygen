/**
 * VeriSimple JS Bridge – type definitions.
 *
 * The host page (Razor) sets `window.VeriSimpleBridge` before the React bundle
 * loads.  React calls bridge methods; the host forwards them to the server.
 *
 * When no bridge is present (standalone dev mode) the app falls back to the
 * JSON preview modal.
 */

// ── Payload sent from React → Host ──

export interface SurveyPayload {
  /** Builder içi istemci kimliği (yerel draft, React key) */
  id: string;
  /** Sunucu Survey.Guid — düzenlemede dolu; yeni ankette host `undefined` bekleyebilir */
  surveyGuid?: string;
  /**
   * @deprecated `id` ile aynı anlamda; eski Razor örnekleri için korunur.
   * Yeni host sözleşmesi `id` + `surveyGuid` kullanır.
   */
  surveyId?: string;
  title: string;
  questions: SurveyPayloadQuestion[];
  /** Boş anketlerde host `null` bekleyebilir (alan yine de gönderilir). */
  conditions?: SurveyPayloadCondition[] | null;
  sequentialEdges?: {
    blockedEdges?: string[];
    customEdges?: Array<{ source: string; target: string }>;
  };
}

export interface SurveyPayloadQuestion {
  order: number;
  text: string;
  type: number;
  answers: string[];
  guid: string;
  settings?: Record<string, unknown>;
  required?: boolean;
  image?: string;
}

export interface SurveyPayloadCondition {
  id: string;
  sourceQuestionId: string;
  answer: string;
  /** equals_any operatörü için şık listesi */
  answerValues?: string[];
  action: string | { jumpTo: string };
  operator?: string;
  rowIndex?: number;
}

// ── Response from Host → React ──

export interface BridgeSaveResponseData {
  surveyGuid?: string;
  [key: string]: unknown;
}

export interface BridgeResponse {
  success: boolean;
  message?: string;
  /** Bazı Razor yanıtları kökte; bazıları `data.surveyGuid` içinde döner. */
  surveyGuid?: string;
  data?: unknown;
}

// ── Bridge contract ──

export interface VeriSimpleBridge {
  /**
   * Called when the user explicitly clicks "Kaydet" (Save).
   * Returns a response so React can show success/error feedback.
   */
  saveSurvey(payload: SurveyPayload): Promise<BridgeResponse>;

  /**
   * Called on every change (auto-save).  Fire-and-forget by default;
   * the host can buffer/debounce internally.
   */
  onSurveyChange?(payload: SurveyPayload): void;
}

// ── Augment the global Window type ──

/** Host, SurveyGen mount öncesi set eder (`readVsSurveyGenInitialSurvey`). */
export interface VsSurveyGenInitial {
  surveyGuid?: string | null;
  title?: string;
  questions?: unknown;
  conditions?: unknown;
}

declare global {
  interface Window {
    VeriSimpleBridge?: VeriSimpleBridge;
    /** VeriSimple: yeni anket = `null`; düzenle = nesne; standalone = özellik yok */
    __VS_SURVEYGEN_INITIAL__?: VsSurveyGenInitial | null;
  }
}
