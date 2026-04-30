import type { Node, Edge } from '@xyflow/react';

export interface TreeItem {
  id: string;
  children?: TreeItem[];
}

export interface TreeToFlowOptions<T extends TreeItem> {
  nodeType: string;
  defaultWidth: number;
  defaultHeight: number;
  edgeType?: string;
  buildNodeData: (item: T) => Record<string, unknown>;
  buildEdgeData?: (parent: T, child: T) => Record<string, unknown>;
}

export function treeToFlow<T extends TreeItem>(
  roots: T[],
  options: TreeToFlowOptions<T>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function walk(item: T, parentItem?: T) {
    nodes.push({
      id: item.id,
      type: options.nodeType,
      position: { x: 0, y: 0 },
      width: options.defaultWidth,
      height: options.defaultHeight,
      data: options.buildNodeData(item),
    });

    if (parentItem) {
      edges.push({
        id: `e-${parentItem.id}-${item.id}`,
        source: parentItem.id,
        target: item.id,
        type: options.edgeType ?? 'default',
        data: options.buildEdgeData?.(parentItem, item) ?? {},
      });
    }

    if (item.children) {
      for (const child of item.children as T[]) {
        walk(child, item);
      }
    }
  }

  for (const root of roots) walk(root);
  return { nodes, edges };
}
