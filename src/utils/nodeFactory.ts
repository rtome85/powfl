import type { Node } from 'reactflow';
import type { BusNodeData, TransformerNodeData } from '../types';

let nodeIdCounter = 1;
const genId = () => `node-${nodeIdCounter++}`;

export function createBusNode(position: { x: number; y: number }): Node<BusNodeData> {
  return {
    id: genId(),
    type: 'busNode',
    position,
    data: {
      label: 'Bus',
      busType: 'PQ',
      variant: 'bus' as const,
      v_nom: 110,
      v_mag: 1.0,
      v_ang: 0,
      p_gen: 0,
      q_gen: 0,
      p_load: 0,
      q_load: 0,
    },
  };
}

export function createTransformerNode(position: { x: number; y: number }): Node<TransformerNodeData> {
  return {
    id: genId(),
    type: 'transformerNode',
    position,
    data: {
      label: 'Transformer',
      v_primary: 220,
      v_secondary: 110,
      rating_mva: 100,
      tap_ratio: 1.0,
      x_pu: 0.1,
    },
  };
}

export function createLoadNode(position: { x: number; y: number }): Node<BusNodeData> {
  return {
    ...createBusNode(position),
    data: {
      label: 'Load',
      busType: 'PQ',
      variant: 'load' as const,
      v_nom: 110,
      v_mag: 1.0,
      v_ang: 0,
      p_gen: 0,
      q_gen: 0,
      p_load: 10,
      q_load: 0,
    },
  };
}

export function createGeneratorNode(position: { x: number; y: number }): Node<BusNodeData> {
  const node = createBusNode(position);
  return {
    ...node,
    data: {
      ...node.data,
      label: 'Generator',
      busType: 'PV',
      variant: 'generator' as const,
      p_gen: 50,
    },
  };
}
