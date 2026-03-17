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
  surveyId: string;
  title: string;
  questions: SurveyPayloadQuestion[];
  conditions?: SurveyPayloadCondition[];
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
  action: string | { jumpTo: string };
  operator?: string;
  rowIndex?: number;
}

// ── Response from Host → React ──

export interface BridgeResponse {
  success: boolean;
  message?: string;
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

declare global {
  interface Window {
    VeriSimpleBridge?: VeriSimpleBridge;
  }
}
