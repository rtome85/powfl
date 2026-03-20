import type { IslandPayload } from './powerFlow';

export interface HarmonicComponent { order: number; magnitude_percent: number; }
export interface HarmonicSource { bus_id: string; injections: HarmonicComponent[]; }
export interface HarmonicRequest {
  s_base_mva: number;
  islands: IslandPayload[];
  harmonic_sources: HarmonicSource[];
}
export interface HarmonicBusResult {
  id: string;
  thd_v_percent: number;
  harmonic_voltages: HarmonicComponent[];
}
export interface HarmonicResponse {
  status: 'success' | 'error';
  message: string;
  bus_results: HarmonicBusResult[];
}
