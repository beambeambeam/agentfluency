import type { UIMessage } from "@tanstack/ai";
import { useChat } from "@tanstack/ai-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_CHAT_MESSAGES,
  streamAssistantChat,
} from "./chat";

const messageText = (message: UIMessage) =>
  message.parts.map((part) => (part.type === "text" ? part.content : "")).join("");

export function AssistantChat() {
  const chatId = useId();
  const [prompt, setPrompt] = useState("");
  const [chatVersion, setChatVersion] = useState(0);
  const { messages, sendMessage, stop, isLoading, error } = useChat({
    threadId: `assistant-${chatId}-${chatVersion}`,
    fetcher: ({ messages: history, runId, threadId }, { signal }) =>
      streamAssistantChat({
        data: {
          messages: history
            .filter(
              (message) => message.role === "user" || message.role === "assistant"
            )
            .map((message) => ({
              role: message.role,
              content: messageText(message).slice(0, MAX_CHAT_MESSAGE_LENGTH),
            }))
            .filter((message) => message.content.trim())
            .slice(-MAX_CHAT_MESSAGES),
          runId,
          threadId,
        },
        signal,
      }),
  });

  return (
    <section
      aria-labelledby="assistant-title"
      className="space-y-4 rounded-lg border p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="assistant-title" className="text-lg font-semibold">
          AI assistant
        </h2>
        <Button
          variant="outline"
          disabled={isLoading || messages.length === 0}
          onClick={() => {
            setChatVersion((version) => version + 1);
            setPrompt("");
          }}
        >
          New chat
        </Button>
      </div>
      <ol aria-label="Conversation" className="max-h-[45vh] space-y-3 overflow-y-auto">
        {messages.map((message) => (
          <li key={message.id} className="bg-muted rounded-md p-3">
            <p className="text-sm font-medium">
              {message.role === "user" ? "You" : "Assistant"}
            </p>
            <p className="wrap-break-word whitespace-pre-wrap text-sm">
              {messageText(message)}
            </p>
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          The assistant could not complete this request. Try again in a moment.
        </p>
      )}
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          const message = prompt.trim();
          if (message && !isLoading) {
            void sendMessage(message);
            setPrompt("");
          }
        }}
      >
        <Label htmlFor="assistant-prompt">Message</Label>
        <textarea
          id="assistant-prompt"
          className="border-input focus-visible:ring-ring w-full resize-y rounded-md border bg-transparent p-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          maxLength={4000}
          onChange={(event) => setPrompt(event.target.value)}
          rows={3}
          value={prompt}
        />
        {isLoading ? (
          <Button type="button" variant="outline" onClick={() => stop()}>
            Stop
          </Button>
        ) : (
          <Button type="submit" disabled={!prompt.trim()}>
            Send
          </Button>
        )}
      </form>
    </section>
  );
}
