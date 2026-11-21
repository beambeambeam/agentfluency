import { Flag03Icon, Task01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
} from "@xyflow/react";
import type { Edge, Node } from "@xyflow/react";

import type { AssessmentConfig } from "./config";

import "@xyflow/react/dist/style.css";

export const InterviewFlow = ({
  steps,
}: {
  steps: AssessmentConfig["steps"];
}) => {
  const stages = [
    ...steps.map((step) => step.title || "Untitled step"),
    "Submit work",
  ];
  const nodes: Node[] = stages.map((stage, index) => {
    const finish = index === stages.length - 1;
    return {
      id: String(index),
      position: { x: index * 206, y: 30 },
      width: 174,
      height: 60,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      className:
        "!border-border !bg-card !text-foreground !rounded-xl !text-left",
      data: {
        label: (
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="bg-muted grid size-7 shrink-0 place-items-center rounded-md">
              <HugeiconsIcon
                icon={finish ? Flag03Icon : Task01Icon}
                className="size-4"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="text-muted-foreground block text-[10px]">
                {finish ? "Finish" : `Step ${index + 1}`}
              </span>
              <span
                className="block truncate text-xs font-semibold"
                title={stage}
              >
                {stage}
              </span>
            </span>
          </span>
        ),
      },
    };
  });
  const edges: Edge[] = nodes.slice(1).map((node, index) => ({
    id: `${index}-${node.id}`,
    source: String(index),
    target: node.id,
    type: "straight",
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  return (
    <div
      className="bg-muted/35 h-36 overflow-hidden rounded-xl border"
      aria-label="Read-only preview of the interview sequence"
    >
      <ReactFlow
        key={nodes.length}
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ maxZoom: 1, minZoom: 0.18, padding: 0.14 }}
        minZoom={0.18}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
      >
        <Background gap={17} color="var(--border)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
};
