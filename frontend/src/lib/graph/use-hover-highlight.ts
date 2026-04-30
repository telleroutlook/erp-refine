import { useState, useMemo, useCallback } from 'react';
import type { Edge } from '@xyflow/react';

interface HoverNode {
  id: string;
  parentId: string | null;
}

export function useHoverHighlight(flatNodes: HoverNode[], edges: Edge[]) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const parentMap = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const n of flatNodes) m.set(n.id, n.parentId);
    return m;
  }, [flatNodes]);

  const childrenMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const n of flatNodes) {
      if (n.parentId) {
        const list = m.get(n.parentId) || [];
        list.push(n.id);
        m.set(n.parentId, list);
      }
    }
    return m;
  }, [flatNodes]);

  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!hoveredNodeId) return ids;

    ids.add(hoveredNodeId);

    // Ancestors
    let cur = parentMap.get(hoveredNodeId) ?? null;
    while (cur) {
      ids.add(cur);
      cur = parentMap.get(cur) ?? null;
    }

    // Children
    const children = childrenMap.get(hoveredNodeId);
    if (children) children.forEach(c => ids.add(c));

    // Siblings
    const myParent = parentMap.get(hoveredNodeId) ?? null;
    if (myParent) {
      const siblings = childrenMap.get(myParent);
      if (siblings) siblings.forEach(s => ids.add(s));
    }

    return ids;
  }, [hoveredNodeId, parentMap, childrenMap]);

  const highlightedEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    if (highlightedNodeIds.size === 0) return ids;
    for (const e of edges) {
      if (highlightedNodeIds.has(e.source) && highlightedNodeIds.has(e.target)) {
        ids.add(e.id);
      }
    }
    return ids;
  }, [highlightedNodeIds, edges]);

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
