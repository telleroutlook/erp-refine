import { useState, useMemo, useCallback } from 'react';
import type { Edge } from '@xyflow/react';

export function useHoverHighlight(edges: Edge[]) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Build adjacency list from edges
  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!m.has(e.source)) m.set(e.source, new Set());
      if (!m.has(e.target)) m.set(e.target, new Set());
      m.get(e.source)!.add(e.target);
      m.get(e.target)!.add(e.source);
    }
    return m;
  }, [edges]);

  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!hoveredNodeId) return ids;
    ids.add(hoveredNodeId);
    const neighbors = adjacency.get(hoveredNodeId);
    if (neighbors) neighbors.forEach(n => ids.add(n));
    return ids;
  }, [hoveredNodeId, adjacency]);

  const highlightedEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!hoveredNodeId) return ids;
    for (const e of edges) {
      if (e.source === hoveredNodeId || e.target === hoveredNodeId) {
        ids.add(e.id);
      }
    }
    return ids;
  }, [hoveredNodeId, edges]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: { id: string }) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  return {
    hoveredNodeId,
    highlightedNodeIds,
    highlightedEdgeIds,
    onNodeMouseEnter,
    onNodeMouseLeave,
  };
}
