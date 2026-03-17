import type { VeriSimpleBridge, SurveyPayload, BridgeResponse } from './types';

/**
 * Returns the host-provided bridge, or `null` when running standalone.
 */
export function getBridge(): VeriSimpleBridge | null {
  try {
    return window.VeriSimpleBridge ?? null;
  } catch {
    return null;
  }
}

export function isBridgeAvailable(): boolean {
  return getBridge() !== null;
}

/**
 * Safe wrapper – calls `saveSurvey` on the bridge.
 * Returns `{ success: false, message }` instead of throwing.
 */
export async function bridgeSave(payload: SurveyPayload): Promise<BridgeResponse> {
  const bridge = getBridge();
  if (!bridge) {
    return { success: false, message: 'Bridge not available (standalone mode).' };
  }
  try {
    const response = await bridge.saveSurvey(payload);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[VeriSimpleBridge] saveSurvey failed:', message);
    return { success: false, message };
  }
}

/**
 * Safe wrapper – notifies the host about every change.
 * Never throws; silently no-ops when bridge is absent.
 */
export function bridgeNotifyChange(payload: SurveyPayload): void {
  const bridge = getBridge();
  if (!bridge?.onSurveyChange) return;
  try {
    bridge.onSurveyChange(payload);
  } catch (err: unknown) {
    console.error('[VeriSimpleBridge] onSurveyChange failed:', err);
  }
}
