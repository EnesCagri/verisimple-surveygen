import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";
import type { NodePositions, SequentialEdges } from "../types/survey";

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
export function normalizeSequentialEdges(
  se: SequentialEdges | undefined,
): SequentialEdges | undefined {
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
  const t = node.type ?? "question";
  return NODE_DIMS[t] ?? NODE_DIMS.question;
}

/** Koşullu kenarlarda aynı kaynaktan giden benzersiz hedefler */
function condTargetsBySource(edges: Edge[]): Map<string, string[]> {
  const map = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!e.id.startsWith("cond-")) continue;
    if (!map.has(e.source)) map.set(e.source, new Set());
    map.get(e.source)!.add(e.target);
  }
  const out = new Map<string, string[]>();
  for (const [src, set] of map) {
    out.set(src, Array.from(set));
  }
  return out;
}

type Center = { cx: number; cy: number };

/**
 * Çok dallanan düğümü, koşullu hedef kümesinin merkezinden biraz daha uzağa iter
 * (TB akışta yelpaze için boşluk; ekran görüntüsündeki gibi hub hedeflerden ayrılır).
 */
function hubAwayFromTargetsNudge(
  sourceId: string,
  targetIds: string[],
  centers: Map<string, Center>,
  fan: number,
): { dx: number; dy: number } {
  if (fan < 2 || targetIds.length < 2) return { dx: 0, dy: 0 };
  const s = centers.get(sourceId);
  if (!s) return { dx: 0, dy: 0 };

  let tcx = 0;
  let tcy = 0;
  let n = 0;
  for (const tid of targetIds) {
    const t = centers.get(tid);
    if (!t) continue;
    tcx += t.cx;
    tcy += t.cy;
    n++;
  }
  if (n === 0) return { dx: 0, dy: 0 };
  tcx /= n;
  tcy /= n;

  let vx = s.cx - tcx;
  let vy = s.cy - tcy;
  const len = Math.hypot(vx, vy);
  if (len < 1e-3) {
    // Üst üste binmişse: tipik TB’de hedefler aşağıda → kaynağı yukarı-sola it
    vx = -0.85;
    vy = -0.52;
  } else {
    vx /= len;
    vy /= len;
  }

  const strength = Math.min(36 + (fan - 2) * 48, 220);
  return { dx: vx * strength, dy: vy * strength };
}

/**
 * Dinamik Dagre yerleşimi.
 *
 * Yatay spacing **fan-out** (aynı kaynaktan kaç koşul) ile büyür.
 * Layout sonrası: aynı düğümden 2+ koşullu hedef varsa o düğüm, hedef
 * kümesinin merkezinden uzağa hafifçe kaydırılır (dallanma “açılır”).
 *
 * Kenar stratejisi:
 *  - Sıralı kenarlar (seq-*): yüksek ağırlık → ana zinciri dikey tutar
 *  - Koşullu kenarlar (cond-*): düşük ağırlık + atlanan rank sayısına
 *    orantılı minlen → dallar doğru katmana yerleşir ve oklar çakışmaz
 */
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
): Node[] {
  // --- 1. Soru sıra haritası (rank-distance hesabı için) ---
  const nodeOrder = new Map<string, number>();
  for (const node of nodes) {
    if (
      node.type === "question" &&
      node.data &&
      typeof (node.data as Record<string, unknown>).order === "number"
    ) {
      nodeOrder.set(
        node.id,
        (node.data as Record<string, unknown>).order as number,
      );
    }
  }
  const maxOrder = nodeOrder.size;
  nodeOrder.set("__start__", 0);
  nodeOrder.set("__end__", maxOrder + 1);
  nodeOrder.set("__invalid_end__", maxOrder + 2);

  // --- 2. Dallanma karmaşıklığı (fan-out + toplam koşul) ---
  const condEdges = edges.filter((e) => e.id.startsWith("cond-"));
  const condCountBySource = new Map<string, number>();
  for (const e of condEdges) {
    condCountBySource.set(e.source, (condCountBySource.get(e.source) ?? 0) + 1);
  }
  const maxFanOut =
    condCountBySource.size === 0 ? 0 : Math.max(...condCountBySource.values());
  const totalCond = condEdges.length;
  const uniqueCondSources = condCountBySource.size;

  // Yatay yayılım: fan-out baskın; çok dal = çok geniş nodesep
  const horizontalBonus = Math.min(
    440,
    maxFanOut * 108 + totalCond * 24 + uniqueCondSources * 20,
  );
  const nodesep = 132 + horizontalBonus;
  const edgesep = 34 + Math.min(maxFanOut * 18 + totalCond * 8, 110);
  const marginx = 100 + Math.min(Math.floor(horizontalBonus * 0.42), 220);
  const ranksep = 168 + Math.min(uniqueCondSources * 18 + totalCond * 6, 96);

  // --- 3. Dinamik graph yapılandırması ---
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranker: "network-simplex",
    ranksep,
    nodesep,
    edgesep,
    marginx,
    marginy: 60,
    acyclicer: "greedy",
  });

  for (const node of nodes) {
    const { width, height } = getDim(node);
    g.setNode(node.id, { width, height });
  }

  // --- 4. Kenar ekleme (ağırlık + dinamik minlen) ---
  const seenEdge = new Set<string>();
  for (const edge of edges) {
    if (!g.hasNode(edge.source) || !g.hasNode(edge.target)) continue;
    const key = `${edge.source}\0${edge.target}`;
    if (seenEdge.has(key)) continue;
    seenEdge.add(key);

    const isConditional = edge.id.startsWith("cond-");

    if (isConditional) {
      // Koşullu kenar: atlanan rank sayısı kadar minlen ver → doğru katmana yerleşir
      const srcOrd = nodeOrder.get(edge.source) ?? 0;
      const tgtOrd = nodeOrder.get(edge.target) ?? srcOrd + 1;
      const distance = Math.abs(tgtOrd - srcOrd);
      g.setEdge(edge.source, edge.target, {
        weight: 1,
        minlen: Math.max(1, distance),
      });
    } else {
      // Sıralı kenar: yüksek ağırlık ana zinciri sabit tutar
      g.setEdge(edge.source, edge.target, {
        weight: 5,
        minlen: 1,
      });
    }
  }

  // --- 5. Layout uygula ---
  dagre.layout(g);

  const targetsBySource = condTargetsBySource(edges);
  const centers = new Map<string, Center>();
  for (const node of nodes) {
    const laid = g.node(node.id);
    if (!laid || typeof laid.x !== "number" || typeof laid.y !== "number")
      continue;
    centers.set(node.id, { cx: laid.x, cy: laid.y });
  }

  const hubNudge = new Map<string, { dx: number; dy: number }>();
  for (const [sourceId, tids] of targetsBySource) {
    const fan = tids.length;
    hubNudge.set(
      sourceId,
      hubAwayFromTargetsNudge(sourceId, tids, centers, fan),
    );
  }

  return nodes.map((node) => {
    const laid = g.node(node.id);
    if (!laid || typeof laid.x !== "number" || typeof laid.y !== "number")
      return node;
    const { width, height } = getDim(node);
    const nudge = hubNudge.get(node.id) ?? { dx: 0, dy: 0 };
    return {
      ...node,
      position: {
        x: laid.x - width / 2 + nudge.dx,
        y: laid.y - height / 2 + nudge.dy,
      },
    };
  });
}

export function hasSavedNodePositions(
  positions: NodePositions | undefined,
): boolean {
  if (!positions) return false;
  return Object.values(positions).some(
    (v): v is { x: number; y: number } => v != null,
  );
}
