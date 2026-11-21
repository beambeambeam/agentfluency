import {
  readSession,
  updateSessionWorkspace,
} from "@agentfluency/db/interview-sessions";
import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

import { filePathSchema, workspaceFileSchema } from "./config";
import type { activeCandidateSession } from "./session-access.server";
import {
  applyWorkspaceEdit,
  editablePathSchema,
  readWorkspace,
  workspaceChangedEvent,
} from "./workspace-state";

const list = toolDefinition({
  name: "list_workspace_files",
  description:
    "List the current files and folder paths in the candidate's IDE.",
  inputSchema: z.object({}),
});
const read = toolDefinition({
  name: "read_workspace_file",
  description: "Read the current text of an IDE file by relative path.",
  inputSchema: z.object({ path: filePathSchema }),
});
const write = toolDefinition({
  name: "write_workspace_file",
  description:
    "Create or replace an IDE text file. Give the relative path and the entire final text. Parent folders appear automatically.",
  inputSchema: z.object({
    path: editablePathSchema,
    content: workspaceFileSchema.shape.content,
  }),
});
const remove = toolDefinition({
  name: "delete_workspace_file",
  description: "Delete a single IDE file by relative path.",
  inputSchema: z.object({ path: editablePathSchema }),
});

type ActiveSession = NonNullable<
  Awaited<ReturnType<typeof activeCandidateSession>>
>;

export const createWorkspaceTools = (
  { db, session, config }: ActiveSession,
  candidateId: string
) => {
  const starter = config.assessment.files;
  const currentFiles = async () => {
    const current = await readSession(db, session.id);
    if (
      !current?.startedAt ||
      current.candidateId !== candidateId ||
      current.submittedAt ||
      current.endsAt.getTime() <= Date.now()
    ) {
      throw new Error("The interview workspace is closed.");
    }
    return readWorkspace(current.workspace, starter).files;
  };
  const editFile = (path: string, content: string | null) =>
    updateSessionWorkspace(db, session.id, candidateId, (saved) => {
      const previous = readWorkspace(saved, starter);
      const workspace = applyWorkspaceEdit(
        previous,
        { path, content },
        crypto.randomUUID()
      );
      return {
        workspace,
        result: {
          path,
          revision: workspace.revision,
          changed: workspace !== previous,
        },
      };
    });
  const tools = [
    list.server(async () => {
      const files = await currentFiles();
      return { files: files.map(({ path }) => path) };
    }),
    read.server(async ({ path }) => {
      const files = await currentFiles();
      const file = files.find((entry) => entry.path === path);
      return file
        ? { path, content: file.content }
        : { error: "File not found.", path };
    }),
  ];
  if (config.assessment.sandbox === "read-only") {
    return tools;
  }
  return [
    ...tools,
    write.server(async ({ path, content }, context) => {
      const result = await editFile(path, content);
      if (result.changed) {
        context?.emitCustomEvent(workspaceChangedEvent, {
          revision: result.revision,
        });
      }
      return result;
    }),
    remove.server(async ({ path }, context) => {
      const result = await editFile(path, null);
      context?.emitCustomEvent(workspaceChangedEvent, {
        revision: result.revision,
      });
      return result;
    }),
  ];
};
