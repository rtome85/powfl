import type { Node } from 'reactflow';

export type IslandStatus = 'ok' | 'no-slack' | 'multi-slack';

export interface NetworkIsland {
  id: number;
  nodes: Node[];
  status: IslandStatus;
  slackCount: number;
}

export interface TopologyReport {
  islands: NetworkIsland[];
  orphans: Node[];
  isReadyForCalculation: boolean;
  errors: string[];
  warnings: string[];
}
