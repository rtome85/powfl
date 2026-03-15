import type { Node, Edge } from 'reactflow';
import type { BusNodeData } from '../types';
import type { NetworkIsland, TopologyReport } from '../types/topology';

export function analyzeTopology(nodes: Node[], edges: Edge[]): TopologyReport {
  if (nodes.length === 0) {
    return { islands: [], orphans: [], isReadyForCalculation: false, errors: [], warnings: [] };
  }

  // Build adjacency map
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of edges) {
    if (edge.source && edge.target) {
      adjacency.get(edge.source)?.add(edge.target);
      adjacency.get(edge.target)?.add(edge.source);
    }
  }

  // Identify orphans (degree 0)
  const orphans: Node[] = nodes.filter((n) => adjacency.get(n.id)?.size === 0);
  const orphanIds = new Set(orphans.map((n) => n.id));

  // BFS to find connected components (exclude orphans)
  const visited = new Set<string>();
  const islands: NetworkIsland[] = [];
  let islandId = 0;

  for (const node of nodes) {
    if (visited.has(node.id) || orphanIds.has(node.id)) continue;

    // BFS from this node
    const queue: string[] = [node.id];
    const component: Node[] = [];
    visited.add(node.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentNode = nodes.find((n) => n.id === current);
      if (currentNode) component.push(currentNode);

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Count slack buses in this island
    const slackCount = component.filter(
      (n) => n.type === 'busNode' && (n.data as BusNodeData).busType === 'Slack'
    ).length;

    const status =
      slackCount === 1 ? 'ok' : slackCount === 0 ? 'no-slack' : 'multi-slack';

    islands.push({ id: islandId++, nodes: component, status, slackCount });
  }

  // Build errors and warnings
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const island of islands) {
    if (island.status === 'no-slack') {
      errors.push(`Island ${island.id + 1}: no reference bus (Slack) — power flow cannot be solved`);
    } else if (island.status === 'multi-slack') {
      errors.push(`Island ${island.id + 1}: multiple Slack buses (${island.slackCount}) — only one allowed`);
    }
  }

  if (orphans.length > 0) {
    warnings.push(`${orphans.length} isolated node${orphans.length > 1 ? 's' : ''} with no connections`);
  }

  const isReadyForCalculation = errors.length === 0 && orphans.length === 0 && islands.length > 0;

  return { islands, orphans, isReadyForCalculation, errors, warnings };
}
