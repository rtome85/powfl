import type { IslandPayload } from './powerFlow';

export interface ShortCircuitRequest {
  s_base_mva: number;
  fault_bus_id: string;
  islands: IslandPayload[];
}

export interface ShortCircuitBusResult {
  id: string;
  ikss_ka: number;
}

export interface ShortCircuitBranchResult {
  branch_id: string;
  ikss_ka: number;
}

export interface ShortCircuitResponse {
  status: 'success' | 'error';
  message: string;
  fault_bus_id: string;
  ikss_ka: number;
  skss_mw: number;
  bus_results: ShortCircuitBusResult[];
  branch_results: ShortCircuitBranchResult[];
}
