import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DocumentFlowNode, type DocumentFlowNodeData } from './DocumentFlowNode';
import { applyElkLayout } from '../../lib/graph/elk-layout';
import { useHoverHighlight } from '../../lib/graph/use-hover-highlight';
import type { DocumentChain } from '../../hooks/useDocumentChain';

const nodeTypes = { documentFlow: DocumentFlowNode };

const ELK_OPTIONS = { direction: 'RIGHT' as const, nodeSpacingH: 60, nodeSpacingV: 40, layerSpacing: 100 };

const NODE_WIDTH = 200;
const NODE_HEIGHT = 90;

interface Props {
  chain: DocumentChain;
  onNodeClick: (objectType: string, objectId: string) => void;
}

function DocumentFlowInner({ chain, onNodeClick }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  const flatNodes = useMemo(
    () => chain.nodes.map((n) => ({ id: n.id, parentId: null })),
    [chain.nodes]
  );

  const rfEdges = useMemo<Edge[]>(
    () =>
      chain.edges.map((e) => ({
        id: e.id,
        source: `${e.fromObjectType}:${e.fromObjectId}`,
        target: `${e.toObjectType}:${e.toObjectId}`,
        type: 'smoothstep',
        style: { stroke: '#94A3B8', strokeWidth: 2 },
      })),
    [chain.edges]
  );

  const { highlightedNodeIds, highlightedEdgeIds, onNodeMouseEnter, onNodeMouseLeave } =
    useHoverHighlight(flatNodes, rfEdges);

  const runLayout = useCallback(() => {
    const rfNodes: Node[] = chain.nodes.map((n) => ({
      id: n.id,
      type: 'documentFlow',
      position: { x: 0, y: 0 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: {
        ...n,
        isDimmed: highlightedNodeIds.size > 0 && !highlightedNodeIds.has(n.id),
        onClick: onNodeClick,
      } satisfies DocumentFlowNodeData,
    }));

    const styledEdges = rfEdges.map((e) => ({
      ...e,
      style: {
        ...e.style,
        opacity: highlightedEdgeIds.size > 0 && !highlightedEdgeIds.has(e.id) ? 0.15 : 1,
      },
    }));

    applyElkLayout(rfNodes, styledEdges, ELK_OPTIONS).then((result) => {
      setNodes(result.nodes);
      setEdges(result.edges);
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
    });
  }, [chain, rfEdges, highlightedNodeIds, highlightedEdgeIds, onNodeClick, setNodes, setEdges, fitView]);

  // Re-layout when chain data changes
  useEffect(() => {
    runLayout();
  }, [chain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update dim state when hover changes — separate from layout to avoid re-running ELK
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isDimmed: highlightedNodeIds.size > 0 && !highlightedNodeIds.has(n.id),
        },
      }))
    );
  }, [highlightedNodeIds, setNodes]);

  useEffect(() => {
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: highlightedEdgeIds.size > 0 && !highlightedEdgeIds.has(e.id) ? 0.15 : 1,
        },
      }))
    );
  }, [highlightedEdgeIds, setEdges]);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#CBD5E1" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

export function DocumentFlowGraph({ chain, onNodeClick }: Props) {
  return (
    <ReactFlowProvider>
      <DocumentFlowInner chain={chain} onNodeClick={onNodeClick} />
    </ReactFlowProvider>
  );
}
