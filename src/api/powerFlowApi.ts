import type { PowerFlowPayload, PowerFlowResponse } from '../types/powerFlow';

export async function postPowerFlow(
  payload: PowerFlowPayload
): Promise<PowerFlowResponse> {
  const res = await fetch('/api/calculate-power-flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<PowerFlowResponse>;
}
