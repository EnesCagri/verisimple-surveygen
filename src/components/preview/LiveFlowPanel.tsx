import { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Question, ConditionalRule, NodePositions } from '../../types/survey';
import { LiveFlowNode, type LiveFlowNodeData } from './LiveFlowNode';
import { LiveFlowEndNode, type LiveFlowEndNodeData } from './LiveFlowEndNode';
import { LiveFlowStartNode, type LiveFlowStartNodeData } from './LiveFlowStartNode';
import { conditionDescription, operatorLabel } from '../../utils/condition';
import type { ConditionSummary } from '../flow/QuestionNodeTooltip';
import type { ConditionOperator } from '../../types/survey';
import { questionListPlainText } from '../../utils/questionDisplayText';

const START_NODE_ID = '__start__';
const END_NODE_ID = '__end__';

const nodeTypes = {
  liveStart: LiveFlowStartNode,
  liveQuestion: LiveFlowNode,
  liveEnd: LiveFlowEndNode,
};

interface LiveFlowPanelProps {
  questions: Question[];
  conditions: ConditionalRule[];
  /** Saved node positions from Builder FlowCanvas */
  nodePositions?: NodePositions;
  /** The guid of the currently active question (null if survey completed) */
  currentQuestionGuid: string | null;
  /** Ordered list of question guids the user has visited */
  visitedPath: string[];
  /** Whether the survey has ended */
  isCompleted: boolean;
  onClose: () => void;
}

function buildEdgeLabel(rule: ConditionalRule, questions: Question[]): string {
  const src = questions.find((q) => q.guid === rule.sourceQuestionId);
  const op = rule.operator ?? (rule.answer === '*' ? 'any' : 'equals');
  if (op === 'any') return 'Herhangi';
  if (op === 'choice_unanswered') return 'Boş geçme';
  if (op === 'equals') return rule.answer;
  if (op === 'equals_any') {
    const vals =
      rule.answerValues && rule.answerValues.length > 0
        ? rule.answerValues
        : rule.answer
          ? [rule.answer]
          : [];
    return vals.length ? vals.join(' veya ') : 'Şıklardan biri';
  }
  if (op === 'row_equals' && src?.settings?.rows && rule.rowIndex !== undefined) {
    const rowLabel = src.settings.rows[rule.rowIndex] ?? `Satır ${rule.rowIndex + 1}`;
    return `${rowLabel} → ${rule.answer}`;
  }
  return `${operatorLabel(op as ConditionOperator)} ${rule.answer}`;
}

/* ── Build nodes ── */

function buildConditionSummaries(
  questionGuid: string,
  conditions: ConditionalRule[],
  questions: Question[],
): ConditionSummary[] {
  return conditions
    .filter((c) => c.sourceQuestionId === questionGuid)
    .map((rule) => {
      const srcQ = questions.find((q) => q.guid === rule.sourceQuestionId);
      const desc = conditionDescription(rule, srcQ);

      let actionLabel: string;
      let isEnd = false;
      const action = rule.action;
      if (action.type === 'end_survey') {
        actionLabel = 'Bitir';
        isEnd = true;
      } else {
        const target = questions.find((q) => q.guid === action.targetQuestionId);
        actionLabel = target ? `S${target.order}` : '?';
      }

      return { description: desc, actionLabel, isEnd };
    });
}

function buildNodes(
  questions: Question[],
  conditions: ConditionalRule[],
  currentGuid: string | null,
  visitedPath: string[],
  isCompleted: boolean,
  savedPositions?: NodePositions,
): Node[] {
  // Default layout (fallback if no saved positions)
  const xCenter = 360;
  const yStartOffset = 200; // leave room for start node
  const yGap = 180;

  const visitedSet = new Set(visitedPath);
  const nodes: Node[] = [];

  // Start node
  const savedStartPos = savedPositions?.__start__;
  const defaultStartPos = { x: xCenter + 30, y: 20 };
  const isStartActive = visitedPath.length === 0 && !isCompleted && currentGuid === null;
  nodes.push({
    id: START_NODE_ID,
    type: 'liveStart',
    position: savedStartPos ?? defaultStartPos,
    data: {
      isActive: isStartActive || visitedPath.length > 0,
    } satisfies LiveFlowStartNodeData,
    draggable: false,
    selectable: false,
    connectable: false,
  });

  // Question nodes
  questions.forEach((q, i) => {
    const savedPos = savedPositions?.[q.guid];
    const defaultPos = { x: xCenter, y: yStartOffset + i * yGap };

    const condSummaries = buildConditionSummaries(q.guid, conditions, questions);

    nodes.push({
      id: q.guid,
      type: 'liveQuestion',
      position: savedPos ?? defaultPos,
      data: {
        order: q.order,
        text: questionListPlainText(q),
        type: q.type,
        guid: q.guid,
        answers: q.answers,
        settings: q.settings,
        conditions: condSummaries,
        isActive: q.guid === currentGuid,
        isVisited: visitedSet.has(q.guid),
      } satisfies LiveFlowNodeData,
      draggable: false,
      selectable: false,
      connectable: false,
    });
  });

  // End node
  const savedEndPos = savedPositions?.__end__;
  const defaultEndPos = { x: xCenter + 30, y: yStartOffset + questions.length * yGap };
  nodes.push({
    id: END_NODE_ID,
    type: 'liveEnd',
    position: savedEndPos ?? defaultEndPos,
    data: {
      isActive: isCompleted,
    } satisfies LiveFlowEndNodeData,
    draggable: false,
    selectable: false,
    connectable: false,
  });

  return nodes;
}

/* ── Build edges ── */

function buildEdges(
  questions: Question[],
  conditions: ConditionalRule[],
  visitedPath: string[],
  isCompleted: boolean,
): Edge[] {
  const edges: Edge[] = [];

  // Build a set of "active" edge connections from the visited path
  const activeEdges = new Set<string>();
  // Start → first visited question
  if (visitedPath.length > 0) {
    activeEdges.add(`${START_NODE_ID}-${visitedPath[0]}`);
  }
  for (let i = 0; i < visitedPath.length - 1; i++) {
    activeEdges.add(`${visitedPath[i]}-${visitedPath[i + 1]}`);
  }
  // If completed, last visited → end
  if (isCompleted && visitedPath.length > 0) {
    activeEdges.add(`${visitedPath[visitedPath.length - 1]}-${END_NODE_ID}`);
  }

  // Start → first question edge
  if (questions.length > 0) {
    const firstGuid = questions[0].guid;
    const isTraversed = activeEdges.has(`${START_NODE_ID}-${firstGuid}`);

    edges.push({
      id: `seq-start-${firstGuid}`,
      source: START_NODE_ID,
      target: firstGuid,
      type: 'smoothstep',
      animated: isTraversed,
      style: {
        stroke: isTraversed ? 'oklch(62% 0.18 155)' : 'oklch(85% 0.01 280)',
        strokeWidth: isTraversed ? 2.5 : 2,
        strokeDasharray: isTraversed ? undefined : '5 4',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isTraversed ? 'oklch(62% 0.18 155)' : 'oklch(85% 0.01 280)',
        width: 14,
        height: 14,
      },
    });
  }

  // Sequential edges
  for (let i = 0; i < questions.length - 1; i++) {
    const src = questions[i].guid;
    const tgt = questions[i + 1].guid;
    const isTraversed = activeEdges.has(`${src}-${tgt}`);

    edges.push({
      id: `seq-${src}-${tgt}`,
      source: src,
      target: tgt,
      type: 'smoothstep',
      animated: isTraversed,
      style: {
        stroke: isTraversed ? 'oklch(62% 0.19 281)' : 'oklch(85% 0.01 280)',
        strokeWidth: isTraversed ? 2.5 : 2,
        strokeDasharray: isTraversed ? undefined : '5 4',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isTraversed ? 'oklch(62% 0.19 281)' : 'oklch(85% 0.01 280)',
        width: 14,
        height: 14,
      },
    });
  }

  // Last → end
  if (questions.length > 0) {
    const lastGuid = questions[questions.length - 1].guid;
    const isTraversed = activeEdges.has(`${lastGuid}-${END_NODE_ID}`);

    edges.push({
      id: `seq-${lastGuid}-end`,
      source: lastGuid,
      target: END_NODE_ID,
      type: 'smoothstep',
      animated: isTraversed,
      style: {
        stroke: isTraversed ? 'oklch(65% 0.2 25)' : 'oklch(85% 0.01 280)',
        strokeWidth: isTraversed ? 2.5 : 2,
        strokeDasharray: isTraversed ? undefined : '5 4',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isTraversed ? 'oklch(65% 0.2 25)' : 'oklch(85% 0.01 280)',
        width: 14,
        height: 14,
      },
    });
  }

  // Conditional edges
  conditions.forEach((rule) => {
    const target =
      rule.action.type === 'end_survey' ? END_NODE_ID : rule.action.targetQuestionId;
    const isTraversed = activeEdges.has(`${rule.sourceQuestionId}-${target}`);
    const isEnd = rule.action.type === 'end_survey';
    const activeColor = isEnd ? 'oklch(65% 0.2 25)' : 'oklch(62% 0.19 281)';
    const inactiveColor = 'oklch(88% 0.01 280)';
    const label = buildEdgeLabel(rule, questions);
    const edgeColor = isTraversed ? activeColor : inactiveColor;

    edges.push({
      id: `cond-${rule.id}`,
      source: rule.sourceQuestionId,
      target,
      type: 'smoothstep',
      animated: isTraversed,
      label,
      labelStyle: { fontSize: 11, fontWeight: 600, fill: edgeColor },
      labelBgStyle: { fill: 'oklch(98% 0 0)', fillOpacity: 0.85 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 6,
      style: {
        stroke: edgeColor,
        strokeWidth: isTraversed ? 2.5 : 1.5,
        strokeDasharray: isTraversed ? undefined : '4 3',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
        width: 12,
        height: 12,
      },
    });
  });

  return edges;
}

/* ── Inner component (has access to useReactFlow) ── */

function LiveFlowInner({
  questions,
  conditions,
  nodePositions,
  currentQuestionGuid,
  visitedPath,
  isCompleted,
  onClose,
}: LiveFlowPanelProps) {
  const { setCenter } = useReactFlow();

  // Sort questions by order to ensure flow diagram matches sidebar order
  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => a.order - b.order);
  }, [questions]);

  const builtNodes = useMemo(
    () => buildNodes(sortedQuestions, conditions, currentQuestionGuid, visitedPath, isCompleted, nodePositions),
    [sortedQuestions, conditions, currentQuestionGuid, visitedPath, isCompleted, nodePositions],
  );

  const builtEdges = useMemo(
    () => buildEdges(sortedQuestions, conditions, visitedPath, isCompleted),
    [sortedQuestions, conditions, visitedPath, isCompleted],
  );

  const [nodes, setNodes] = useNodesState(builtNodes);
  const [edges, setEdges] = useEdgesState(builtEdges);

  // Sync nodes and edges when data changes
  useEffect(() => {
    setNodes(builtNodes);
  }, [builtNodes, setNodes]);

  useEffect(() => {
    setEdges(builtEdges);
  }, [builtEdges, setEdges]);

  // Auto-center on the current question node
  useEffect(() => {
    if (!currentQuestionGuid && !isCompleted) return;

    const targetId = isCompleted ? END_NODE_ID : currentQuestionGuid;
    const node = builtNodes.find((n) => n.id === targetId);
    if (!node) return;

    // Small delay for smooth animation
    // Calculate center offset based on node width (approximately half of max node width)
    const centerOffset = 225; // ~450px max width / 2
    const timer = setTimeout(() => {
      setCenter(node.position.x + centerOffset, node.position.y + 50, {
        zoom: 1,
        duration: 500,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [currentQuestionGuid, isCompleted, builtNodes, setCenter]);

  return (
    <div className="w-full h-full flex flex-col bg-base-200/50 border-l border-base-300/40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-300/30 bg-base-100/80">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
          </span>
          <span className="text-sm font-semibold text-base-content/70">Live Flow</span>
        </div>
        <button
          className="p-1.5 rounded-lg hover:bg-base-200 text-base-content/30 hover:text-base-content/60 transition-colors"
          onClick={onClose}
          title="Akış panelini kapat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Flow */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          className="bg-transparent"
          minZoom={0.3}
          maxZoom={1.5}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={0.5}
            color="oklch(82% 0.01 280)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

/* ── Exported wrapper with ReactFlowProvider ── */

export function LiveFlowPanel(props: LiveFlowPanelProps) {
  return (
    <ReactFlowProvider>
      <LiveFlowInner {...props} />
    </ReactFlowProvider>
  );
}

