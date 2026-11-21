import { Buffer } from "node:buffer";

import { codeInterpreterTool } from "@tanstack/ai-openai/tools";
import { z } from "zod";

import type { AssessmentConfig } from "./config";

const containerIdSchema = z.string().regex(/^cntr_[\w-]+$/u);
const requestIdSchema = z.string().regex(/^req_[a-f\d]{8,64}$/iu);
const providerErrorSchema = z.object({
  error: z.object({
    param: z
      .enum([
        "expires_after",
        "expires_after.anchor",
        "expires_after.minutes",
        "file",
        "file_id",
        "memory_limit",
        "name",
        "network_policy",
      ])
      .nullish()
      .catch(null),
    code: z
      .enum([
        "billing_hard_limit_reached",
        "insufficient_quota",
        "invalid_api_key",
        "invalid_value",
        "missing_required_parameter",
        "rate_limit_exceeded",
        "unknown_parameter",
        "unsupported_value",
      ])
      .nullish()
      .catch(null),
  }),
});

export const createSessionInterpreter = (id: string) => {
  const container = containerIdSchema.parse(id);
  const tool = codeInterpreterTool({ type: "code_interpreter", container });
  // The installed adapter's factory expects the entire tool type but forwards metadata.container directly.
  return { ...tool, metadata: { ...tool.metadata, container } };
};

const openAiRequest = async (
  apiKey: string,
  operation: "create" | "upload" | "refresh" | "delete",
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
    const providerError = providerErrorSchema.safeParse(
      await response.json().catch(() => null)
    ).data?.error;
    const requestId = requestIdSchema.safeParse(
      response.headers.get("x-request-id")
    ).data;
    console.error("OpenAI sandbox request failed", {
      operation,
      status: response.status,
      requestId,
      parameter: providerError?.param,
      code: providerError?.code,
    });
    throw new Error(
      `OpenAI sandbox ${operation} failed (${response.status}).${requestId ? ` Request ID ${requestId}.` : ""}`
    );
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
  openAiRequest(apiKey, "delete", `/${containerIdSchema.parse(id)}`, {
    method: "DELETE",
  });

export const refreshSandbox = (apiKey: string, id: string) =>
  openAiRequest(apiKey, "refresh", `/${containerIdSchema.parse(id)}`, {
    method: "GET",
  });

export const provisionSandbox = async (
  apiKey: string,
  sessionId: string,
  files: AssessmentConfig["files"]
) => {
  const response = await openAiRequest(apiKey, "create", "", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `agentfluency-${sessionId}`,
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
    await openAiRequest(apiKey, "upload", `/${id}/files`, {
      method: "POST",
      body: form,
    });
    return id;
  } catch (error) {
    await releaseSandbox(apiKey, id).catch(() => null);
    throw error;
  }
};
