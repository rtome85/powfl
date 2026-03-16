import type { PowerFlowPayload, PowerFlowResponse } from '../types/powerFlow';

const REQUEST_TIMEOUT_MS = 30_000;

export class PowerFlowError extends Error {
  constructor(
    message: string,
    public readonly elementIds: string[] = [],
  ) {
    super(message);
    this.name = 'PowerFlowError';
  }
}

export async function postPowerFlow(
  payload: PowerFlowPayload
): Promise<PowerFlowResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch('/api/calculate-power-flow', {
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
    return res.json() as Promise<PowerFlowResponse>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new PowerFlowError(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
