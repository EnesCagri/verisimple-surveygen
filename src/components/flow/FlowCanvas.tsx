import {
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  type Node,
  type Edge,
  type Connection,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  applyDagreLayout,
  hasSavedNodePositions,
  normalizeCustomSequentialEdges,
} from "../../utils/flowDagreLayout";

import type {
  Question,
  ConditionalRule,
  ConditionInput,
  NodePositions,
  SequentialEdges,
} from "../../types/survey";
import { QuestionNode, type QuestionNodeData } from "./QuestionNode";
import { EndNode } from "./EndNode";
import { InvalidEndNode } from "./InvalidEndNode";
import { StartNode } from "./StartNode";
import { ConditionEditorModal } from "../modals/ConditionEditorModal";
import { EdgeContextMenu } from "./EdgeContextMenu";
import { operatorLabel, conditionDescription } from "../../utils/condition";
import type { ConditionSummary } from "./QuestionNodeTooltip";

const START_NODE_ID = "__start__";
const END_NODE_ID = "__end__";
const INVALID_END_NODE_ID = "__invalid_end__";

function collectNodePositionsFromNodes(nodes: Node[]): NodePositions {
  const positions: NodePositions = {};
  for (const node of nodes) {
    const p = { x: node.position.x, y: node.position.y };
    if (node.id === END_NODE_ID) positions.__end__ = p;
    else if (node.id === INVALID_END_NODE_ID) positions.__invalid_end__ = p;
    else if (node.id === START_NODE_ID) positions.__start__ = p;
    else positions[node.id] = p;
  }
  return positions;
}

const nodeTypes = {
  start: StartNode,
  question: QuestionNode,
  end: EndNode,
  invalidEnd: InvalidEndNode,
};

interface FlowCanvasProps {
  /** Anket değişince otomatik fit/layout davranışı için (opsiyonel) */
  surveyId?: string;
  questions: Question[];
  conditions: ConditionalRule[];
  /** Saved node positions (optional) */
  nodePositions?: NodePositions;
  /** Sequential edge management (optional) */
  sequentialEdges?: SequentialEdges;
  onAddCondition: (sourceId: string, input: ConditionInput) => void;
  onUpdateCondition: (conditionId: string, input: ConditionInput) => void;
  onRemoveCondition: (conditionId: string) => void;
  onSelectQuestion: (guid: string) => void;
  onDeleteQuestion?: (guid: string) => void;
  /** Callback when node positions change (user drags nodes) */
  onNodePositionsChange?: (positions: NodePositions) => void;
  /** Callback when sequential edges change */
  onSequentialEdgesChange?: (edges: SequentialEdges) => void;
}

// --- Node & Edge builders ---

function buildConditionSummaries(
  questionGuid: string,
  conditions: ConditionalRule[],
  questions: Question[],
): ConditionSummary[] {
  return (conditions ?? [])
    .filter((c) => c.sourceQuestionId === questionGuid)
    .map((rule) => {
      const srcQ = questions.find((q) => q.guid === rule.sourceQuestionId);
      const desc = conditionDescription(rule, srcQ);

      let actionLabel: string;
      let isEnd = false;
      if (rule.action.type === "end_survey") {
        actionLabel = "Bitir";
        isEnd = true;
      } else {
        // TypeScript knows this is 'jump_to' here
        const jumpAction = rule.action;
        if (jumpAction.type === "jump_to") {
          if (jumpAction.targetQuestionId === "__invalid_end__") {
            actionLabel = "Geçersiz";
            isEnd = true;
            return { description: desc, actionLabel, isEnd };
          }
          const target = questions.find(
            (q) => q.guid === jumpAction.targetQuestionId,
          );
          actionLabel = target ? `S${target.order}` : "?";
        } else {
          actionLabel = "?";
        }
      }

      return { description: desc, actionLabel, isEnd };
    });
}

function buildNodes(
  questions: Question[],
  conditions: ConditionalRule[],
  savedPositions?: NodePositions,
  onDeleteQuestion?: (guid: string) => void,
): Node[] {
  const xCenter = 400;
  const yStartOffset = 220; // leave room for start node
  const yGap = 160;

  const allNodes: Node[] = [];

  // Start node
  const savedStartPos = savedPositions?.__start__;
  const defaultStartPos = { x: xCenter + 60, y: 30 };
  allNodes.push({
    id: START_NODE_ID,
    type: "start",
    position: savedStartPos ?? defaultStartPos,
    data: {},
  });

  // Question nodes
  questions.forEach((q, i) => {
    const savedPos = savedPositions?.[q.guid];
    const defaultPos = {
      x: xCenter + (i % 2 === 0 ? 0 : 220),
      y: yStartOffset + i * yGap,
    };

    const condSummaries = buildConditionSummaries(
      q.guid,
      conditions,
      questions,
    );

    allNodes.push({
      id: q.guid,
      type: "question",
      position: savedPos ?? defaultPos,
      data: {
        order: q.order,
        text: q.text,
        type: q.type,
        answers: Array.isArray(q.answers) ? q.answers : [],
        guid: q.guid,
        settings: q.settings,
        conditions: condSummaries,
        onDelete: onDeleteQuestion,
      } satisfies QuestionNodeData,
    });
  });

  // End node
  const savedEndPos = savedPositions?.__end__;
  const defaultEndPos = {
    x: xCenter + 60,
    y: yStartOffset + questions.length * yGap + 40,
  };
  allNodes.push({
    id: END_NODE_ID,
    type: "end",
    position: savedEndPos ?? defaultEndPos,
    data: {},
  });

  // Invalid end node
  const savedInvalidEndPos = savedPositions?.__invalid_end__;
  const defaultInvalidEndPos = {
    x: xCenter + 320,
    y: yStartOffset + questions.length * yGap + 40,
  };
  allNodes.push({
    id: INVALID_END_NODE_ID,
    type: "invalidEnd",
    position: savedInvalidEndPos ?? defaultInvalidEndPos,
    data: {},
  });

  return allNodes;
}

function buildEdgeLabel(rule: ConditionalRule, questions: Question[]): string {
  const src = questions.find((q) => q.guid === rule.sourceQuestionId);
  const op = rule.operator ?? (rule.answer === "*" ? "any" : "equals");

  if (op === "any") return "Herhangi";
  if (op === "equals") return rule.answer;
  if (
    op === "row_equals" &&
    src?.settings?.rows &&
    rule.rowIndex !== undefined
  ) {
    const rowLabel =
      src.settings.rows[rule.rowIndex] ?? `Satır ${rule.rowIndex + 1}`;
    return `${rowLabel} → ${rule.answer}`;
  }
  // Rating / TextEntry: show "operator value"
  return `${operatorLabel(op)} ${rule.answer}`;
}

function buildEdges(
  questions: Question[],
  conditions: ConditionalRule[],
  sequentialEdges?: SequentialEdges,
): Edge[] {
  const edges: Edge[] = [];
  const blockedSet = new Set(sequentialEdges?.blockedEdges ?? []);
  const customEdgesList = normalizeCustomSequentialEdges(sequentialEdges?.customEdges);

  // Track which sources already have an outgoing sequential edge → prevent duplicates
  const seqSourceUsed = new Set<string>();

  // Helper to add a sequential edge (skips if source already has one)
  const addSeqEdge = (
    id: string,
    source: string,
    target: string,
    isStart = false,
  ) => {
    if (seqSourceUsed.has(source)) return; // ← only ONE outgoing sequential per source
    if (blockedSet.has(id)) return;

    const startColor = "oklch(65% 0.18 155)";
    const seqColor = "oklch(80% 0.02 280)";
    const color = isStart ? startColor : seqColor;

    edges.push({
      id,
      source,
      target,
      type: "smoothstep",
      animated: false,
      style: {
        stroke: color,
        strokeWidth: isStart ? 3 : 2.4,
        strokeDasharray: isStart ? undefined : "6 4",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 18,
        height: 18,
      },
    });
    seqSourceUsed.add(source);
  };

  // 1. Custom edges first (they have priority over defaults)
  customEdgesList.forEach((custom) => {
    const realSource =
      custom.source === "__start__" ? START_NODE_ID : custom.source;
    const realTarget =
      custom.target === "__end__"
        ? END_NODE_ID
        : custom.target === "__invalid_end__"
          ? INVALID_END_NODE_ID
          : custom.target;
    const edgeId = `seq-${custom.source}-${custom.target}`;
    addSeqEdge(edgeId, realSource, realTarget, custom.source === "__start__");
  });

  // 2. Start → first question (default, only if not already set by custom edge)
  if (questions.length > 0) {
    const edgeId = `seq-__start__-${questions[0].guid}`;
    addSeqEdge(edgeId, START_NODE_ID, questions[0].guid, true);
  }

  // 3. Default sequential edges between questions
  for (let i = 0; i < questions.length - 1; i++) {
    const edgeId = `seq-${questions[i].guid}-${questions[i + 1].guid}`;
    addSeqEdge(edgeId, questions[i].guid, questions[i + 1].guid);
  }

  // 4. Last question → end node
  if (questions.length > 0) {
    const edgeId = `seq-${questions[questions.length - 1].guid}-end`;
    addSeqEdge(edgeId, questions[questions.length - 1].guid, END_NODE_ID);
  }

  // 5. Conditional edges (these are separate and always shown)
  (conditions ?? []).forEach((rule) => {
    const target =
      rule.action.type === "end_survey"
        ? END_NODE_ID
        : rule.action.targetQuestionId;
    const isInvalidEnd = target === "__invalid_end__";
    const isEnd = rule.action.type === "end_survey" || isInvalidEnd;
    const color = isInvalidEnd
      ? "oklch(83% 0.16 85)"
      : isEnd
        ? "oklch(65% 0.2 25)"
        : "oklch(65% 0.19 281)";
    const label = isInvalidEnd
      ? "Geçersiz Bitir"
      : buildEdgeLabel(rule, questions);
    const realTarget =
      target === "__invalid_end__" ? INVALID_END_NODE_ID : target;

    edges.push({
      id: `cond-${rule.id}`,
      source: rule.sourceQuestionId,
      target: realTarget,
      type: "smoothstep",
      animated: true,
      label,
      labelStyle: { fontSize: 13, fontWeight: 700, fill: color },
      labelBgStyle: { fill: "white", fillOpacity: 0.9 },
      labelBgPadding: [8, 5] as [number, number],
      labelBgBorderRadius: 8,
      style: { stroke: color, strokeWidth: 2.8 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 18,
        height: 18,
      },
    });
  });

  return edges;
}

/** Kayıtlı pozisyon yoksa Dagre ile hizalı düğümler; varsa mevcut kaydı kullanır. */
function computeNodesForCanvas(
  questions: Question[],
  conditions: ConditionalRule[],
  nodePositions: NodePositions | undefined,
  sequentialEdges: SequentialEdges | undefined,
  onDeleteQuestion?: (guid: string) => void,
): Node[] {
  const built = buildNodes(
    questions,
    conditions,
    nodePositions,
    onDeleteQuestion,
  );
  if (hasSavedNodePositions(nodePositions)) return built;
  const ed = buildEdges(questions, conditions, sequentialEdges);
  return applyDagreLayout(built, ed);
}

// --- State types ---

interface PendingConnection {
  sourceQuestionId: string;
  targetNodeId: string;
}

/** Menu shown when user draws a new connection, to choose between sequential or conditional */
interface ConnectionTypeMenu {
  sourceId: string;
  targetId: string;
  x: number;
  y: number;
}

interface ContextMenuState {
  type: "condition" | "sequential";
  id: string; // conditionId for conditions, edgeId for sequential edges
  x: number;
  y: number;
}

// --- Component ---

function FlowCanvasInner({
  surveyId,
  questions,
  conditions,
  nodePositions,
  sequentialEdges,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onSelectQuestion,
  onDeleteQuestion,
  onNodePositionsChange,
  onSequentialEdgesChange,
}: FlowCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const lastAutoFitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    lastAutoFitKeyRef.current = null;
  }, [surveyId]);

  // Sort questions by order to ensure flow diagram matches sidebar order
  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => a.order - b.order);
  }, [questions]);

  const initialNodes = useMemo(
    () =>
      computeNodesForCanvas(
        sortedQuestions,
        conditions,
        nodePositions,
        sequentialEdges,
        onDeleteQuestion,
      ),
    [
      sortedQuestions,
      conditions,
      nodePositions,
      sequentialEdges,
      onDeleteQuestion,
    ],
  );
  const initialEdges = useMemo(
    () => buildEdges(sortedQuestions, conditions, sequentialEdges),
    [sortedQuestions, conditions, sequentialEdges],
  );

  /** Kaynak başına tek görünen sıralı kenar (koşullar hariç) — çift bağlantıyı engellemek için */
  const activeSequentialTargets = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of initialEdges) {
      if (!e.id.startsWith("seq-")) continue;
      if (!m.has(e.source)) m.set(e.source, e.target);
    }
    return m;
  }, [initialEdges]);

  const isValidConnection = useCallback(
    (c: Connection | Edge) => {
      if (!c.source || !c.target) return false;
      if (c.source === END_NODE_ID) return false;
      if (c.source === INVALID_END_NODE_ID) return false;
      if (c.target === START_NODE_ID) return false;
      if (c.source === c.target) return false;
      const existing = activeSequentialTargets.get(c.source);
      if (existing !== undefined && existing === c.target) return false;
      return true;
    },
    [activeSequentialTargets],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Track if any node is currently being dragged
  const [isDragging, setIsDragging] = useState(false);

  const [pendingConn, setPendingConn] = useState<PendingConnection | null>(
    null,
  );
  const [editingCondition, setEditingCondition] =
    useState<ConditionalRule | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [connTypeMenu, setConnTypeMenu] = useState<ConnectionTypeMenu | null>(
    null,
  );
  const [nodeMenu, setNodeMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  // Track node positions and notify parent when they change (only when not dragging)
  useEffect(() => {
    if (!onNodePositionsChange || isDragging) return;

    const positions: NodePositions = {};
    nodes.forEach((node) => {
      if (node.id === END_NODE_ID) {
        positions.__end__ = node.position;
      } else if (node.id === INVALID_END_NODE_ID) {
        positions.__invalid_end__ = node.position;
      } else if (node.id === START_NODE_ID) {
        positions.__start__ = node.position;
      } else {
        positions[node.id] = node.position;
      }
    });

    // Only update if positions actually changed (avoid infinite loops)
    const hasChanges = Object.keys(positions).some((id) => {
      const saved =
        id === "__end__"
          ? nodePositions?.__end__
          : id === "__invalid_end__"
            ? nodePositions?.__invalid_end__
            : id === "__start__"
              ? nodePositions?.__start__
              : nodePositions?.[id];
      const current = positions[id];
      if (!saved || !current) return true;
      return saved.x !== current.x || saved.y !== current.y;
    });

    if (hasChanges) {
      onNodePositionsChange(positions);
    }
  }, [nodes, nodePositions, onNodePositionsChange, isDragging]);

  // Track drag state from node changes
  useEffect(() => {
    const isAnyDragging = nodes.some((node) => node.dragging === true);
    setIsDragging(isAnyDragging);
  }, [nodes]);

  const handleAutoLayout = useCallback(() => {
    setNodes((prev) => {
      const next = applyDagreLayout(prev, edges);
      onNodePositionsChange?.(collectNodePositionsFromNodes(next));
      return next;
    });
    requestAnimationFrame(() => {
      fitView({ padding: 0.32, maxZoom: 1, duration: 320 });
    });
  }, [edges, setNodes, fitView, onNodePositionsChange]);

  const sequentialKey = useMemo(
    () => JSON.stringify(sequentialEdges ?? {}),
    [sequentialEdges],
  );

  // Kayıtlı yerleşim yokken Dagre sonrası görünümü kadraja al (anket/küme değişince tekrar)
  useLayoutEffect(() => {
    if (hasSavedNodePositions(nodePositions)) return;
    if (nodes.length === 0) return;
    const key = `${surveyId ?? ""}:${sortedQuestions.length}:${conditions.length}:${sequentialKey}`;
    if (lastAutoFitKeyRef.current === key) return;
    lastAutoFitKeyRef.current = key;
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.32, maxZoom: 1, duration: 240 });
    });
    return () => cancelAnimationFrame(id);
  }, [
    surveyId,
    sortedQuestions.length,
    conditions.length,
    sequentialKey,
    nodePositions,
    nodes.length,
    fitView,
  ]);

  // Soru / koşul / sıra kenarı değişince düğümleri güncelle (kayıtsız yerleşimde her zaman Dagre)
  useEffect(() => {
    if (isDragging) return;

    if (!hasSavedNodePositions(nodePositions)) {
      const layouted = computeNodesForCanvas(
        sortedQuestions,
        conditions,
        nodePositions,
        sequentialEdges,
        onDeleteQuestion,
      );
      onNodePositionsChange?.(collectNodePositionsFromNodes(layouted));
      setNodes((prev) =>
        layouted.map((n) => {
          const p = prev.find((x) => x.id === n.id);
          if (p?.dragging) {
            return {
              ...n,
              position: p.position,
              dragging: true,
              selected: p.selected,
            };
          }
          return n;
        }),
      );
      return;
    }

    setNodes((prev) => {
      const built = computeNodesForCanvas(
        sortedQuestions,
        conditions,
        nodePositions,
        sequentialEdges,
        onDeleteQuestion,
      );
      const existingIds = new Set(prev.map((n) => n.id));
      const builtIds = new Set(built.map((n) => n.id));

      const questionsChanged =
        built.length !== prev.length ||
        built.some((n) => !existingIds.has(n.id)) ||
        prev.some((n) => !builtIds.has(n.id));

      if (!questionsChanged) {
        return prev.map((existing) => {
          const builtNode = built.find((n) => n.id === existing.id);
          if (builtNode) {
            return { ...existing, data: builtNode.data };
          }
          return existing;
        });
      }

      return built.map((n) => {
        const existing = prev.find((p) => p.id === n.id);
        if (existing) {
          return { ...existing, data: n.data };
        }
        return n;
      });
    });
  }, [
    sortedQuestions,
    conditions,
    sequentialEdges,
    isDragging,
    setNodes,
    nodePositions,
    onDeleteQuestion,
    onNodePositionsChange,
  ]);

  useEffect(() => {
    setEdges(buildEdges(sortedQuestions, conditions, sequentialEdges));
  }, [sortedQuestions, conditions, sequentialEdges, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === END_NODE_ID) return;
      if (connection.source === INVALID_END_NODE_ID) return;
      if (connection.target === START_NODE_ID) return; // Cannot connect to start node
      if (connection.source === connection.target) return;

      setContextMenu(null);
      setConnTypeMenu(null);

      // If source is start node → directly create sequential (no condition menu)
      if (connection.source === START_NODE_ID) {
        if (!onSequentialEdgesChange) return;
        const current = sequentialEdges ?? {};
        const blocked = new Set(current.blockedEdges ?? []);

        // Remove any existing custom edge from start
        const customEdges = (current.customEdges ?? []).filter(
          (e) => e.source !== "__start__",
        );

        // Block the old default start edge if it points to a different target
        if (
          sortedQuestions.length > 0 &&
          sortedQuestions[0].guid !== connection.target
        ) {
          blocked.add(`seq-__start__-${sortedQuestions[0].guid}`);
        }

        onSequentialEdgesChange({
          blockedEdges: blocked.size > 0 ? Array.from(blocked) : undefined,
          customEdges: [
            ...customEdges,
            { source: "__start__", target: connection.target },
          ],
        });
        return;
      }

      // Check if this edge was previously blocked - if so, just unblock it
      const edgeId = `seq-${connection.source}-${connection.target}`;
      const blockedSet = new Set(sequentialEdges?.blockedEdges ?? []);
      if (blockedSet.has(edgeId) && onSequentialEdgesChange) {
        const newBlocked = Array.from(blockedSet).filter((id) => id !== edgeId);
        onSequentialEdgesChange({
          blockedEdges: newBlocked.length > 0 ? newBlocked : undefined,
          customEdges: sequentialEdges?.customEdges,
        });
        return;
      }

      // Show connection type chooser at center of viewport
      const rect = wrapperRef.current?.getBoundingClientRect();
      const cx = rect ? rect.width / 2 - 100 : 200;
      const cy = rect ? rect.height / 2 - 40 : 200;

      setConnTypeMenu({
        sourceId: connection.source,
        targetId: connection.target,
        x: cx,
        y: cy,
      });
    },
    [sequentialEdges, sortedQuestions, onSequentialEdgesChange],
  );

  /** Create a sequential edge from the connection type menu */
  const handleCreateSequential = useCallback(() => {
    if (!connTypeMenu || !onSequentialEdgesChange) return;
    const { sourceId, targetId } = connTypeMenu;
    const current = sequentialEdges ?? {};
    const blocked = new Set(current.blockedEdges ?? []);

    // Remove any existing custom edge from the same source (replace it)
    const customEdges = (current.customEdges ?? []).filter(
      (e) => e.source !== sourceId,
    );

    // Block ALL default sequential edges from this source (prevent duplicates)
    const sourceIdx = sortedQuestions.findIndex((q) => q.guid === sourceId);
    if (sourceIdx >= 0) {
      // Block default edge to next question
      if (sourceIdx < sortedQuestions.length - 1) {
        const defaultTarget = sortedQuestions[sourceIdx + 1].guid;
        if (defaultTarget !== targetId) {
          blocked.add(`seq-${sourceId}-${defaultTarget}`);
        }
      }
      // Block default edge to end (if this is the last question)
      if (
        sourceIdx === sortedQuestions.length - 1 &&
        targetId !== END_NODE_ID
      ) {
        blocked.add(`seq-${sourceId}-end`);
      }
    }

    onSequentialEdgesChange({
      blockedEdges: blocked.size > 0 ? Array.from(blocked) : undefined,
      customEdges: [...customEdges, { source: sourceId, target: targetId }],
    });

    setConnTypeMenu(null);
  }, [connTypeMenu, sequentialEdges, sortedQuestions, onSequentialEdgesChange]);

  /** Create a conditional edge from the connection type menu */
  const handleCreateCondition = useCallback(() => {
    if (!connTypeMenu) return;
    setPendingConn({
      sourceQuestionId: connTypeMenu.sourceId,
      targetNodeId: connTypeMenu.targetId,
    });
    setConnTypeMenu(null);
  }, [connTypeMenu]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;

    if (edge.id.startsWith("cond-")) {
      // Conditional edge
      const condId = edge.id.replace("cond-", "");
      setContextMenu({
        type: "condition",
        id: condId,
        x: event.clientX - wrapperRect.left,
        y: event.clientY - wrapperRect.top,
      });
    } else if (edge.id.startsWith("seq-")) {
      // Sequential edge
      setContextMenu({
        type: "sequential",
        id: edge.id,
        x: event.clientX - wrapperRect.left,
        y: event.clientY - wrapperRect.top,
      });
    }
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setContextMenu(null);
      setNodeMenu(null);
      if (
        node.id !== END_NODE_ID &&
        node.id !== START_NODE_ID &&
        node.id !== INVALID_END_NODE_ID
      ) {
        onSelectQuestion(node.id);
      }
    },
    [onSelectQuestion],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (
        node.id === START_NODE_ID ||
        node.id === END_NODE_ID ||
        node.id === INVALID_END_NODE_ID
      )
        return;
      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      if (!wrapperRect) return;
      setContextMenu(null);
      setConnTypeMenu(null);
      setNodeMenu({
        id: node.id,
        x: event.clientX - wrapperRect.left,
        y: event.clientY - wrapperRect.top,
      });
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
    setConnTypeMenu(null);
    setNodeMenu(null);
  }, []);

  // --- Context menu handlers ---

  const handleContextEdit = () => {
    if (!contextMenu || contextMenu.type !== "condition") return;
    const cond = conditions.find((c) => c.id === contextMenu.id);
    if (cond) {
      setEditingCondition(cond);
    }
    setContextMenu(null);
  };

  const handleContextDelete = () => {
    if (!contextMenu) return;

    if (contextMenu.type === "condition") {
      onRemoveCondition(contextMenu.id);
    } else if (contextMenu.type === "sequential" && onSequentialEdgesChange) {
      // Block this sequential edge
      const edgeId = contextMenu.id;
      const current = sequentialEdges ?? {};
      const blocked = new Set(current.blockedEdges ?? []);
      blocked.add(edgeId);

      // Parse source/target from edge id: seq-{source}-{target}
      const raw = edgeId.startsWith("seq-") ? edgeId.slice(4) : edgeId;
      const splitAt = raw.lastIndexOf("-");
      const sourceId = splitAt >= 0 ? raw.slice(0, splitAt) : raw;
      const targetId = splitAt >= 0 ? raw.slice(splitAt + 1) : "";

      // Remove custom sequential edge(s) from same source to keep it disconnected
      const customEdges = (current.customEdges ?? []).filter(
        (e) => e.source !== sourceId,
      );

      // IMPORTANT:
      // If user deletes a custom edge, default edge from the same source should NOT return.
      // So we proactively block that default path too.
      if (sourceId === START_NODE_ID) {
        if (sortedQuestions.length > 0) {
          blocked.add(`seq-__start__-${sortedQuestions[0].guid}`);
        }
      } else {
        const srcIdx = sortedQuestions.findIndex((q) => q.guid === sourceId);
        if (srcIdx >= 0) {
          if (srcIdx < sortedQuestions.length - 1) {
            blocked.add(`seq-${sourceId}-${sortedQuestions[srcIdx + 1].guid}`);
          } else {
            blocked.add(`seq-${sourceId}-end`);
          }
        }
      }

      // Also keep the exact deleted target blocked (for custom target ids)
      if (targetId) {
        blocked.add(`seq-${sourceId}-${targetId}`);
      }

      onSequentialEdgesChange({
        blockedEdges: Array.from(blocked),
        customEdges,
      });
    }

    setContextMenu(null);
  };

  // --- Modal handlers ---

  const sourceQuestion = pendingConn
    ? (questions.find((q) => q.guid === pendingConn.sourceQuestionId) ?? null)
    : editingCondition
      ? (questions.find((q) => q.guid === editingCondition.sourceQuestionId) ??
        null)
      : null;

  const handleModalSave = (input: ConditionInput) => {
    if (editingCondition) {
      onUpdateCondition(editingCondition.id, input);
      setEditingCondition(null);
    } else if (pendingConn) {
      // Override action if target is END node
      const finalInput: ConditionInput =
        pendingConn.targetNodeId === END_NODE_ID
          ? { ...input, action: { type: "end_survey" } }
          : input;
      onAddCondition(pendingConn.sourceQuestionId, finalInput);
      setPendingConn(null);
    }
  };

  const handleModalClose = () => {
    setPendingConn(null);
    setEditingCondition(null);
  };

  const modalInitialAction = editingCondition
    ? editingCondition.action
    : pendingConn
      ? pendingConn.targetNodeId === END_NODE_ID
        ? { type: "end_survey" as const }
        : {
            type: "jump_to" as const,
            targetQuestionId: pendingConn.targetNodeId,
          }
      : undefined;

  const modalInitialAnswer = editingCondition?.answer;
  const modalInitialOperator = editingCondition?.operator;
  const modalInitialRowIndex = editingCondition?.rowIndex;

  return (
    <div className="w-full h-full relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleAutoLayout}
        className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-xl border border-base-300/60 bg-base-100/95 px-3.5 py-2 text-sm font-semibold text-base-content/80 shadow-md backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
        title="Düğümleri Dagre ile yeniden hizala (sıra + koşullu kenarlar)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h7M14 17h4M14 20h7" />
        </svg>
        Otomatik yerleşim
      </button>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
        className="bg-base-200"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="oklch(80% 0.02 280)"
        />
        <Controls
          showInteractive={false}
          className="bg-base-100! border-base-300/40! rounded-xl! shadow-lg! scale-110 origin-bottom-left"
        />
      </ReactFlow>

      {/* Connection type chooser (sequential vs conditional) */}
      {connTypeMenu && (
        <div
          className="absolute z-50 bg-base-100 rounded-xl shadow-xl border border-base-300/40 p-2.5 min-w-[230px]"
          style={{ left: connTypeMenu.x, top: connTypeMenu.y }}
        >
          <p className="text-sm font-semibold text-base-content/60 px-3.5 py-2 uppercase tracking-wide">
            Bağlantı Türü Seçin
          </p>
          <button
            className="flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-base"
            onClick={handleCreateSequential}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="oklch(65% 0.19 281)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <span className="font-medium">Sıralı Bağlantı</span>
            <span className="text-sm text-base-content/40 ml-auto">
              Doğrudan geçiş
            </span>
          </button>
          <button
            className="flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-base"
            onClick={handleCreateCondition}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="oklch(65% 0.2 25)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 3h5v5" />
              <path d="M8 3H3v5" />
              <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
              <path d="m15 9 6-6" />
            </svg>
            <span className="font-medium">Koşullu Bağlantı</span>
            <span className="text-sm text-base-content/40 ml-auto">
              Kurala göre
            </span>
          </button>
          <div className="border-t border-base-300/30 mt-1 pt-1">
            <button
              className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-base text-base-content/50"
              onClick={() => setConnTypeMenu(null)}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {contextMenu && (
        <EdgeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          onEdit={
            contextMenu.type === "condition" ? handleContextEdit : undefined
          }
          onDelete={handleContextDelete}
          onClose={() => setContextMenu(null)}
        />
      )}

      {nodeMenu && (
        <>
          <div
            className="fixed inset-0 z-55"
            onClick={() => setNodeMenu(null)}
          />
          <div
            className="absolute z-56 bg-base-100 rounded-xl shadow-xl border border-base-300/40 py-2 min-w-[180px] animate-fade-slide-in"
            style={{ left: nodeMenu.x, top: nodeMenu.y }}
          >
            <button
              className="w-full flex items-center gap-3 px-4.5 py-3 text-base text-error/80 hover:bg-error/5 hover:text-error transition-colors"
              onClick={() => {
                onDeleteQuestion?.(nodeMenu.id);
                setNodeMenu(null);
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Soruyu Sil
            </button>
          </div>
        </>
      )}

      {sourceQuestion && (pendingConn || editingCondition) && (
        <ConditionEditorModal
          open
          sourceQuestion={sourceQuestion}
          questions={questions}
          conditions={conditions}
          excludeConditionId={editingCondition?.id}
          initialAnswer={modalInitialAnswer}
          initialAction={modalInitialAction}
          initialOperator={modalInitialOperator}
          initialRowIndex={modalInitialRowIndex}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
