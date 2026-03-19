import type { ShortCircuitRequest, ShortCircuitResponse } from '../types/shortCircuit';
import { PowerFlowError } from './powerFlowApi';

const REQUEST_TIMEOUT_MS = 30_000;

export async function postShortCircuit(
  payload: ShortCircuitRequest
): Promise<ShortCircuitResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch('/api/calculate-short-circuit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const bodyText = await res.text();
      let message = `HTTP ${res.status}`;
      let elementIds: string[] = [];
      try {
        const body = JSON.parse(bodyText);
        const detail = body.detail;
        if (typeof detail === 'object' && detail !== null) {
          message = detail.message ?? JSON.stringify(detail);
          elementIds = Array.isArray(detail.element_ids) ? detail.element_ids : [];
        } else if (typeof detail === 'string') {
          message = detail;
        } else {
          message = JSON.stringify(body);
        }
      } catch {
        message += `: ${bodyText}`;
      }
      throw new PowerFlowError(message, elementIds);
    }
    return res.json() as Promise<ShortCircuitResponse>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new PowerFlowError(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
