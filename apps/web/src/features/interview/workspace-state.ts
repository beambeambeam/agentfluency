import { z } from "zod";

import { filePathSchema, workspaceFileSchema } from "./config";
import type { WorkspaceFile } from "./file-explorer";

export const workspaceChangedEvent = "interview-workspace-changed";
const fileLimit = 32;

export const editablePathSchema = filePathSchema.refine(
  (path) => path.length <= 155 && (path.split("/").at(-1)?.length ?? 0) <= 100,
  "Use up to 155 characters for the path and 100 for the filename."
);

const workspaceSchema = z.object({
  revision: z.number().int().min(0),
  files: z.array(workspaceFileSchema).max(fileLimit),
});

export type WorkspaceState = z.infer<typeof workspaceSchema>;

export const readWorkspace = (
  saved: unknown,
  starter: WorkspaceFile[]
): WorkspaceState =>
  saved === null
    ? { revision: 0, files: starter }
    : workspaceSchema.parse(saved);

export const applyWorkspaceEdit = (
  workspace: WorkspaceState,
  edit: { path: string; content: string | null },
  newId: string
) => {
  const path = editablePathSchema.parse(edit.path);
  const existing = workspace.files.find((file) => file.path === path);
  if (edit.content === null) {
    if (!existing) {
      throw new Error("This file does not exist.");
    }
    return {
      revision: workspace.revision + 1,
      files: workspace.files.filter((file) => file.path !== path),
    };
  }
  if (!existing && workspace.files.length >= fileLimit) {
    throw new Error(`The workspace can hold up to ${fileLimit} files.`);
  }
  if (
    workspace.files.some(
      (file) =>
        file.path.startsWith(`${path}/`) || path.startsWith(`${file.path}/`)
    )
  ) {
    throw new Error("A file and a folder cannot share the same path.");
  }
  const file = workspaceFileSchema.parse({
    id: existing?.id ?? newId,
    path,
    content: edit.content,
  });
  if (existing?.content === file.content) {
    return workspace;
  }
  return {
    revision: workspace.revision + 1,
    files: existing
      ? workspace.files.map((item) => (item.path === path ? file : item))
      : [...workspace.files, file],
  };
};

export type FileChange = "added" | "modified" | "deleted";

export const workspaceChanges = (
  starter: WorkspaceFile[],
  current: WorkspaceFile[]
) => {
  const before = new Map(starter.map((file) => [file.path, file]));
  const after = new Map(current.map((file) => [file.path, file]));
  return [...new Set([...after.keys(), ...before.keys()])].flatMap((path) => {
    const original = before.get(path);
    const file = after.get(path);
    if (original?.content === file?.content) {
      return [];
    }
    let change: FileChange = "added";
    if (original) {
      change = file ? "modified" : "deleted";
    }
    return [{ path, change, original, file }];
  });
};
