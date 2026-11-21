import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { createOpenaiChat } from "@tanstack/ai-openai";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { getServerEnv } from "@/env.server";
import { authMiddleware } from "@/middleware/auth";

export const MAX_CHAT_MESSAGE_LENGTH = 16_000;
export const MAX_CHAT_MESSAGES = 51;

const chatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
      })
    )
    .min(1)
    .max(MAX_CHAT_MESSAGES)
    .refine((messages) => messages.at(-1)?.role === "user"),
  runId: z.string().min(1).max(128),
  threadId: z.string().min(1).max(128),
});

export const streamAssistantChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(chatInput)
  .handler(({ context, data }) => {
    if (!context.session) {
      return new Response("Sign in to use the assistant.", { status: 401 });
    }

    const apiKey = getServerEnv().OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("The assistant is unavailable.", { status: 503 });
    }

    const abortController = new AbortController();
    const requestSignal = getRequest().signal;
    if (requestSignal.aborted) {
      abortController.abort();
    } else {
      requestSignal.addEventListener("abort", () => abortController.abort(), {
        once: true,
      });
    }

    const stream = chat({
      abortController,
      adapter: createOpenaiChat("gpt-6.1-sol", apiKey),
      messages: data.messages,
      modelOptions: { store: false },
      runId: data.runId,
      threadId: data.threadId,
    });

    return toServerSentEventsResponse(stream, {
      abortController,
      headers: { "Cache-Control": "no-store" },
    });
  });
