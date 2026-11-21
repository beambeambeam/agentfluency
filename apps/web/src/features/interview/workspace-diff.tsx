import type { FileChange, workspaceChanges } from "./workspace-state";

export const fileChangeLabels: Record<FileChange, string> = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
};

const badgeTone: Record<FileChange, string> = {
  added: "text-emerald-700 dark:text-emerald-400",
  modified: "text-amber-700 dark:text-amber-400",
  deleted: "text-red-700 dark:text-red-400",
};

export const FileChangeBadge = ({
  change,
  compact = false,
}: {
  change: FileChange;
  compact?: boolean;
}) => (
  <span
    className={`shrink-0 text-xs font-semibold ${badgeTone[change]}`}
    title={fileChangeLabels[change]}
  >
    {compact ? fileChangeLabels[change][0] : fileChangeLabels[change]}
    {compact && <span className="sr-only"> {fileChangeLabels[change]}</span>}
  </span>
);

type ChangedFile = ReturnType<typeof workspaceChanges>[number];

export const WorkspaceDiff = ({ change }: { change: ChangedFile }) => (
  <div
    className={
      change.original && change.file
        ? "grid min-w-0 gap-2 md:grid-cols-2"
        : "min-w-0"
    }
  >
    {change.original && (
      <figure className="min-w-0 rounded-md border border-red-500/30 bg-red-500/5 p-2">
        <figcaption className="px-1 text-xs font-medium">Original</figcaption>
        <pre className="mt-1 max-h-56 overflow-auto p-1 text-xs">
          <code>{change.original.content || "Empty file"}</code>
        </pre>
      </figure>
    )}
    {change.file && (
      <figure className="min-w-0 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2">
        <figcaption className="px-1 text-xs font-medium">Current</figcaption>
        <pre className="mt-1 max-h-56 overflow-auto p-1 text-xs">
          <code>{change.file.content || "Empty file"}</code>
        </pre>
      </figure>
    )}
  </div>
);
