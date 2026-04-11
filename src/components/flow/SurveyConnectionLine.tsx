import { memo, useMemo } from "react";
import {
  ConnectionLineType,
  getBezierPath,
  getSimpleBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from "@xyflow/react";
import type { ConnectionLineComponentProps } from "@xyflow/react";
import { getHandlePosition } from "@xyflow/system";
import {
  SOURCE_BODY_HANDLE_ID,
  SOURCE_OUT_HANDLE_ID,
} from "./flowHandleIds";

function SurveyConnectionLine({
  fromNode,
  fromHandle,
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
  connectionLineStyle,
  connectionLineType,
}: ConnectionLineComponentProps) {
  const { sourceX, sourceY, sourcePosition } = useMemo(() => {
    if (fromHandle?.id !== SOURCE_BODY_HANDLE_ID || !fromNode) {
      return {
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
      };
    }
    const sources = fromNode.internals.handleBounds?.source ?? [];
    const out =
      sources.find((h) => h.id === SOURCE_OUT_HANDLE_ID) ?? sources[0];
    if (!out) {
      return {
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
      };
    }
    const p = getHandlePosition(fromNode, out, out.position, true);
    return { sourceX: p.x, sourceY: p.y, sourcePosition: out.position };
  }, [fromNode, fromHandle, fromX, fromY, fromPosition]);

  const pathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  };

  const path = useMemo(() => {
    switch (connectionLineType) {
      case ConnectionLineType.Bezier:
        return getBezierPath(pathParams)[0];
      case ConnectionLineType.SimpleBezier:
        return getSimpleBezierPath(pathParams)[0];
      case ConnectionLineType.Step:
        return getSmoothStepPath({ ...pathParams, borderRadius: 0 })[0];
      case ConnectionLineType.SmoothStep:
        return getSmoothStepPath(pathParams)[0];
      default:
        return getStraightPath(pathParams)[0];
    }
  }, [connectionLineType, pathParams]);

  return (
    <path
      d={path}
      fill="none"
      className="react-flow__connection-path"
      style={connectionLineStyle}
    />
  );
}

export default memo(SurveyConnectionLine);
