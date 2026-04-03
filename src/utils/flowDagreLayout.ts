import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';
import type { NodePositions, SequentialEdges } from '../types/survey';

/** Aynı kaynaktan yalnızca tek sıralı özel kenar (liste sonundaki kazanır). */
export function normalizeCustomSequentialEdges(
  list: { source: string; target: string }[] | undefined,
): { source: string; target: string }[] {
  if (!list?.length) return [];
  const bySource = new Map<string, { source: string; target: string }>();
  for (const e of list) {
    bySource.set(e.source, e);
  }
  return Array.from(bySource.values());
}

/** Akış kaydını normalize eder (custom sıralı kenarlar kaynak başına tek). */
export function normalizeSequentialEdges(se: SequentialEdges | undefined): SequentialEdges | undefined {
  if (!se) return undefined;
  const custom = normalizeCustomSequentialEdges(se.customEdges);
  const hasBlocked = (se.blockedEdges?.length ?? 0) > 0;
  const hasCustom = custom.length > 0;
  if (!hasBlocked && !hasCustom) return undefined;
  return {
    ...(hasBlocked ? { blockedEdges: se.blockedEdges } : {}),
    ...(hasCustom ? { customEdges: custom } : {}),
  };
}

/**
 * Tahmini düğüm boyutları (px). React Flow ölçümü olmadan Dagre aralıklarını ayarlamak için;
 * gerçek kartlar min-w 300 / ~150px yükseklik civarında.
 */
const NODE_DIMS: Record<string, { width: number; height: number }> = {
  start: { width: 280, height: 92 },
  question: { width: 336, height: 172 },
  end: { width: 280, height: 92 },
  invalidEnd: { width: 296, height: 92 },
};

function getDim(node: Node): { width: number; height: number } {
  const t = node.type ?? 'question';
  return NODE_DIMS[t] ?? NODE_DIMS.question;
}

/**
 * Mevcut düğüm/kenar listesine Dagre hiyerarşik yerleşimi uygular (anket akışı için TB önerilir).
 * Aynı kaynak-hedef çifti için yalnızca bir kenar kullanılır; katman ataması yine de doğru kalır.
 */
export function applyDagreLayout(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB'): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    align: 'UL',
    ranker: 'tight-tree',
    ranksep: 80,
    nodesep: 104,
    edgesep: 28,
    marginx: 80,
    marginy: 44,
    acyclicer: 'greedy',
  });

  for (const node of nodes) {
    const { width, height } = getDim(node);
    g.setNode(node.id, { width, height });
  }

  const seenEdge = new Set<string>();
  for (const edge of edges) {
    if (!g.hasNode(edge.source) || !g.hasNode(edge.target)) continue;
    const key = `${edge.source}\0${edge.target}`;
    if (seenEdge.has(key)) continue;
    seenEdge.add(key);
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const laid = g.node(node.id);
    if (!laid || typeof laid.x !== 'number' || typeof laid.y !== 'number') return node;
    const { width, height } = getDim(node);
    return {
      ...node,
      position: {
        x: laid.x - width / 2,
        y: laid.y - height / 2,
      },
    };
  });
}

export function hasSavedNodePositions(positions: NodePositions | undefined): boolean {
  if (!positions) return false;
  return Object.values(positions).some((v): v is { x: number; y: number } => v != null);
}
