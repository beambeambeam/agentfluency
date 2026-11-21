import { Buffer } from "node:buffer";

import { codeInterpreterTool } from "@tanstack/ai-openai/tools";
import { z } from "zod";

import type { AssessmentConfig } from "./config";

const containerIdSchema = z.string().regex(/^cntr_[\w-]+$/u);

export const createSessionInterpreter = (id: string) => {
  const container = containerIdSchema.parse(id);
  const tool = codeInterpreterTool({ type: "code_interpreter", container });
  // The installed adapter's factory expects the entire tool type but forwards metadata.container directly.
  return { ...tool, metadata: { ...tool.metadata, container } };
};

const openAiRequest = async (
  apiKey: string,
  path: string,
  options: RequestInit
) => {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  const response = await fetch(`https://api.openai.com/v1/containers${path}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`OpenAI sandbox request failed (${response.status}).`);
  }
  return response;
};

const archiveWorkspace = (files: AssessmentConfig["files"]) => {
  const archive: Buffer[] = [];
  for (const file of files) {
    const content = Buffer.from(file.content, "utf-8");
    const header = Buffer.alloc(512);
    const parts = file.path.split("/");
    const name = parts.pop() ?? "";
    header.write(name, 0, 100, "ascii");
    header.write("0000644\0", 100, "ascii");
    header.write("0000000\0", 108, "ascii");
    header.write("0000000\0", 116, "ascii");
    header.write(
      `${content.length.toString(8).padStart(11, "0")}\0`,
      124,
      "ascii"
    );
    header.write("00000000000\0", 136, "ascii");
    header.fill(32, 148, 156);
    header.write("0", 156, "ascii");
    header.write("ustar\0", 257, "ascii");
    header.write("00", 263, "ascii");
    header.write(parts.join("/"), 345, 155, "ascii");
    const sum = header.reduce((total, byte) => total + byte, 0);
    header.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148, "ascii");
    archive.push(
      header,
      content,
      Buffer.alloc((512 - (content.length % 512)) % 512)
    );
  }
  return new Uint8Array(Buffer.concat([...archive, Buffer.alloc(1024)]));
};

export const releaseSandbox = (apiKey: string, id: string) =>
  openAiRequest(apiKey, `/${containerIdSchema.parse(id)}`, {
    method: "DELETE",
  });

export const provisionSandbox = async (
  apiKey: string,
  sessionId: string,
  files: AssessmentConfig["files"],
  minutesRemaining: number
) => {
  const response = await openAiRequest(apiKey, "", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `agentfluency-${sessionId}`,
      expires_after: {
        anchor: "last_active_at",
        minutes: minutesRemaining + 5,
      },
      network_policy: { type: "disabled" },
    }),
  });
  const { id } = z
    .object({ id: containerIdSchema })
    .parse(await response.json());
  try {
    const form = new FormData();
    form.set(
      "file",
      new Blob([archiveWorkspace(files)], { type: "application/x-tar" }),
      "workspace.tar"
    );
    await openAiRequest(apiKey, `/${id}/files`, { method: "POST", body: form });
    return id;
  } catch (error) {
    await releaseSandbox(apiKey, id).catch(() => null);
    throw error;
  }
};
