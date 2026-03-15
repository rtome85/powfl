export type BusType = 'Slack' | 'PV' | 'PQ';

export interface BusNodeData {
  label: string;
  busType: BusType;
  variant?: 'bus' | 'load' | 'generator';
  v_nom: number;
  v_mag: number;
  v_ang: number;
  p_gen: number;
  q_gen: number;
  p_load: number;
  q_load: number;
}

export interface TransformerNodeData {
  label: string;
  v_primary: number;
  v_secondary: number;
  rating_mva: number;
  tap_ratio: number;
  x_pu: number;
}

export interface TransmissionEdgeData {
  label: string;
  r: number;
  x: number;
  b: number;
  rating_mva: number;
}

export type SelectedElement =
  | { kind: 'node'; id: string; nodeType: 'busNode' | 'transformerNode' }
  | { kind: 'edge'; id: string }
  | null;

export interface DragPayload {
  nodeType: 'busNode' | 'transformerNode';
}
