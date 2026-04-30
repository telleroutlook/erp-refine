import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from '@xyflow/react';

const elk = new ELK();

export interface ElkLayoutOptions {
  direction: 'DOWN' | 'RIGHT' | 'UP' | 'LEFT';
  nodeSpacingH?: number;
  nodeSpacingV?: number;
  layerSpacing?: number;
}

export async function applyElkLayout(
  nodes: Node[],
  edges: Edge[],
  options: ElkLayoutOptions,
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const {
    direction,
    nodeSpacingH = 40,
    nodeSpacingV = 40,
    layerSpacing = 80,
  } = options;

  const elkChildren: ElkNode[] = nodes.map(n => ({
    id: n.id,
    width: n.measured?.width ?? n.width ?? 260,
    height: n.measured?.height ?? n.height ?? 100,
  }));

  const elkEdges: ElkExtendedEdge[] = edges.map(e => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
  }));

  const graph = await elk.layout({
    id: 'root',
    children: elkChildren,
    edges: elkEdges,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': String(nodeSpacingV),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
      'elk.spacing.componentComponent': String(nodeSpacingH),
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    },
  });

  const positionedNodes = nodes.map(n => {
    const elkChild = graph.children?.find(c => c.id === n.id);
    return {
      ...n,
      position: { x: elkChild?.x ?? 0, y: elkChild?.y ?? 0 },
    };
  });

  return { nodes: positionedNodes, edges };
}
