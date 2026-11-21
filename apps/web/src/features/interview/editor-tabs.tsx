import { Cancel01Icon, Note01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { FileIcon, fileName } from "./file-explorer";
import type { WorkspaceFile } from "./file-explorer";

export interface WorkspaceTab {
  id: string;
  file?: WorkspaceFile;
}

interface DropTarget {
  id: string;
  after: boolean;
}

export const EditorTabs = ({
  tabs,
  active,
  select,
  close,
  reorder,
}: {
  tabs: WorkspaceTab[];
  active?: string;
  select: (id: string) => void;
  close: (id: string) => void;
  reorder: (id: string, target: string, after: boolean) => void;
}) => {
  const strip = useRef<HTMLElement>(null);
  const drag = useRef<{ id: string; startX: number; moved: boolean }>(null);
  const suppressClick = useRef(false);
  const [target, setTarget] = useState<DropTarget>();
  const [announcement, setAnnouncement] = useState("");
  const dropSide = target?.after ? "after" : "before";

  const findTarget = (x: number, y: number): DropTarget | undefined => {
    const tab = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-tab-id]");
    if (!tab || !strip.current?.contains(tab)) {
      return undefined;
    }
    const id = tab.dataset.tabId;
    if (!id || id === drag.current?.id) {
      return undefined;
    }
    const { left, width } = tab.getBoundingClientRect();
    return { id, after: x >= left + width / 2 };
  };

  const finishDrag = () => {
    drag.current = null;
    setTarget(undefined);
  };

  return (
    <>
      <section ref={strip} className="wb-tabs" aria-label="Open tabs">
        {tabs.map(({ id, file }, index) => {
          const label = file ? fileName(file) : "Scratchpad";
          const selected = id === active;
          return (
            <div
              className="wb-tab"
              key={id}
              data-tab-id={id}
              data-active={selected || undefined}
              data-drop={target?.id === id ? dropSide : undefined}
            >
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="wb-tab-main"
                aria-pressed={selected}
                aria-keyshortcuts="Alt+Shift+ArrowLeft Alt+Shift+ArrowRight"
                onClick={(event) => {
                  if (!suppressClick.current || event.detail === 0) {
                    select(id);
                  }
                  suppressClick.current = false;
                }}
                title={file?.path ?? label}
                data-reorderable={tabs.length > 1 || undefined}
                onPointerDown={(event) => {
                  suppressClick.current = false;
                  if (
                    tabs.length < 2 ||
                    event.button !== 0 ||
                    !event.isPrimary
                  ) {
                    return;
                  }
                  drag.current = { id, startX: event.clientX, moved: false };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const moving = drag.current;
                  if (moving?.id !== id) {
                    return;
                  }
                  if (
                    !moving.moved &&
                    Math.abs(event.clientX - moving.startX) < 6
                  ) {
                    return;
                  }
                  moving.moved = true;
                  const next = findTarget(event.clientX, event.clientY);
                  setTarget((current) =>
                    current?.id === next?.id && current?.after === next?.after
                      ? current
                      : next
                  );
                }}
                onPointerUp={(event) => {
                  if (drag.current?.id !== id || !drag.current.moved) {
                    return;
                  }
                  const destination = findTarget(event.clientX, event.clientY);
                  if (destination) {
                    reorder(id, destination.id, destination.after);
                  }
                  suppressClick.current = true;
                  finishDrag();
                }}
                onLostPointerCapture={finishDrag}
                onKeyDown={(event) => {
                  if (!event.altKey || !event.shiftKey) {
                    return;
                  }
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                    return;
                  }
                  event.preventDefault();
                  const direction = event.key === "ArrowLeft" ? -1 : 1;
                  const position = index + direction;
                  const neighbor = tabs[position];
                  if (!neighbor) {
                    return;
                  }
                  reorder(id, neighbor.id, direction > 0);
                  setAnnouncement(
                    `${label} moved to position ${position + 1} of ${tabs.length}.`
                  );
                }}
              >
                {file ? (
                  <FileIcon file={file} />
                ) : (
                  <HugeiconsIcon
                    icon={Note01Icon}
                    size={15}
                    aria-hidden="true"
                  />
                )}
                <span>{label}</span>
              </Button>
              {file && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="wb-tab-close"
                  aria-label={`Close ${label}`}
                  onClick={() => close(id)}
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={13}
                    aria-hidden="true"
                  />
                </Button>
              )}
            </div>
          );
        })}
      </section>
      <output className="sr-only">{announcement}</output>
    </>
  );
};
