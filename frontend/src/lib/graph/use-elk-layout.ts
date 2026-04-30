import { useCallback, useRef, useEffect } from 'react';
import { useReactFlow, useNodesInitialized } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { applyElkLayout, type ElkLayoutOptions } from './elk-layout';

export function useElkLayout(options: ElkLayoutOptions) {
  const { setNodes, setEdges, fitView, getNodes, getEdges } = useReactFlow();
  const initialized = useNodesInitialized();
  const versionRef = useRef(0);
  const hasRun = useRef(false);

  const runLayout = useCallback(
    async (nodes: Node[], edges: Edge[]) => {
      const version = ++versionRef.current;
      const result = await applyElkLayout(nodes, edges, options);
      // Discard stale results
      if (version !== versionRef.current) return;
      setNodes(result.nodes);
      setEdges(result.edges);
      requestAnimationFrame(() => {
        fitView({ padding: 0.15, duration: 300 });
      });
    },
    [options, setNodes, setEdges, fitView],
  );

  // Trigger layout once nodes are measured (two-pass: render → measure → layout)
  useEffect(() => {
    if (initialized && !hasRun.current) {
      hasRun.current = true;
      runLayout(getNodes(), getEdges());
    }
  }, [initialized, runLayout, getNodes, getEdges]);

  return { runLayout, initialized };
}
