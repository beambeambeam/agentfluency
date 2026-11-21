import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

const defaultEditorShare = 62;

export const WorkbenchSplit = ({
  editor,
  assistant,
}: {
  editor: ReactNode;
  assistant: ReactNode;
}) => {
  const split = useRef<HTMLDivElement>(null);
  const grabOffset = useRef(0);
  const [width, setWidth] = useState(0);
  const [preferredShare, setPreferredShare] = useState(defaultEditorShare);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const element = split.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const minimum = width ? Math.ceil((250 / width) * 100) : 35;
  const maximum = width ? Math.floor((1 - 300 / width) * 100) : 65;
  const clamp = (share: number) => Math.min(maximum, Math.max(minimum, share));
  const editorShare = clamp(preferredShare);

  return (
    <div
      ref={split}
      className="wb-split"
      data-resizing={dragging || undefined}
      style={{ "--wb-editor-share": `${editorShare}%` } as CSSProperties}
    >
      {editor}
      <div
        className="wb-resize"
        role="separator"
        tabIndex={0}
        aria-label="Resize editor and assistant"
        aria-controls="candidate-editor"
        aria-orientation="vertical"
        aria-valuemin={minimum}
        aria-valuemax={maximum}
        aria-valuenow={editorShare}
        aria-valuetext={`Editor: ${editorShare}%`}
        title="Drag to resize. Double-click to reset."
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) {
            return;
          }
          event.preventDefault();
          event.currentTarget.focus();
          grabOffset.current =
            event.clientX - event.currentTarget.getBoundingClientRect().left;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const bounds = split.current?.getBoundingClientRect();
          if (
            !bounds?.width ||
            !event.currentTarget.hasPointerCapture(event.pointerId)
          ) {
            return;
          }

          const offset = event.clientX - bounds.left - grabOffset.current;
          setPreferredShare(clamp(Math.round((offset / bounds.width) * 100)));
        }}
        onLostPointerCapture={() => setDragging(false)}
        onDoubleClick={() => setPreferredShare(defaultEditorShare)}
        onKeyDown={(event) => {
          const positions: Record<string, number> = {
            ArrowLeft: editorShare - 3,
            ArrowRight: editorShare + 3,
            Home: minimum,
            End: maximum,
          };
          const position = positions[event.key];
          if (position === undefined) {
            return;
          }
          event.preventDefault();
          setPreferredShare(clamp(position));
        }}
      />
      {assistant}
    </div>
  );
};
