export interface BusPayload {
  id: string;
  label: string;
  type: 'Slack' | 'PV' | 'PQ';
  v_nom_kv: number;
  v_mag_pu: number;
  v_ang_deg: number;
  p_gen_mw: number;
  q_gen_mvar: number;
  p_load_mw: number;
  q_load_mvar: number;
  c_factor: number;
}

export interface BranchPayload {
  branch_id: string;
  from_bus: string;
  to_bus: string;
  r_pu: number;
  x_pu: number;
  b_pu: number;
  rating_mva: number;
  is_transformer: boolean;
  tap: number;
  vkr_percent?: number;
}

export interface IslandPayload {
  island_id: number;
  buses: BusPayload[];
  branches: BranchPayload[];
}

export interface PowerFlowPayload {
  s_base_mva: number;
  islands: IslandPayload[];
}

export interface BusResult {
  id: string;
  v_mag_pu: number;
  v_ang_deg: number;
  p_gen_mw: number;
  q_gen_mvar: number;
}

export interface BranchResult {
  branch_id: string;
  from_bus: string;
  to_bus: string;
  p_from_mw: number;
  q_from_mvar: number;
  p_to_mw: number;
  q_to_mvar: number;
  loading_percent: number;
}

export interface IslandResult {
  island_id: number;
  converged: boolean;
  buses: BusResult[];
  branches: BranchResult[];
}

export interface PowerFlowResponse {
  status: 'success' | 'error';
  message: string;
  islands: IslandResult[];
}
