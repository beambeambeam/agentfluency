import {
  Add01Icon,
  ArrowUp02Icon,
  Attachment01Icon,
  Cancel01Icon,
  SparklesIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "@tanstack/ai";
import { useChat } from "@tanstack/ai-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  HarnessPicker,
  ModelPicker,
} from "@/features/interview/assistant-picker";
import {
  harnessSchema,
  modelSchema,
  openAiModelSchema,
} from "@/features/interview/config";
import type { Harness, Model } from "@/features/interview/config";

import {
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_CHAT_MESSAGES,
  streamAssistantChat,
} from "./chat";

const messageText = (message: UIMessage) =>
  message.parts
    .map((part) => (part.type === "text" ? part.content : ""))
    .join("");

interface AssistantChatProps {
  inviteId: string;
  initialHarness: Harness;
  initialModel: Model;
  allowHarnessSelection: boolean;
  allowModelSelection: boolean;
  mode: string;
  attachment?: { id: string; path: string };
  onClearAttachment: () => void;
}

export const AssistantChat = ({
  inviteId,
  initialHarness,
  initialModel,
  allowHarnessSelection,
  allowModelSelection,
  mode,
  attachment,
  onClearAttachment,
}: AssistantChatProps) => {
  const chatId = useId();
  const transcript = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const followReplies = useRef(true);
  const [harness, setHarness] = useState(initialHarness);
  const [model, setModel] = useState(initialModel);
  const modelUnavailable =
    mode === "live" && !openAiModelSchema.safeParse(model).success;
  const [prompt, setPrompt] = useState("");
  const [chatVersion, setChatVersion] = useState(0);
  const { messages, sendMessage, stop, isLoading, error } = useChat({
    threadId: `assistant-${chatId}-${chatVersion}`,
    fetcher: ({ data, messages: history, runId, threadId }, { signal }) =>
      streamAssistantChat({
        data: {
          inviteId,
          harness: harnessSchema.parse(data?.harness ?? initialHarness),
          model: modelSchema.parse(data?.model ?? initialModel),
          attachmentId:
            typeof data?.attachmentId === "string"
              ? data.attachmentId
              : undefined,
          messages: history
            .flatMap((message) => {
              const { role } = message;
              const content = messageText(message).slice(
                0,
                MAX_CHAT_MESSAGE_LENGTH
              );
              return (role === "user" || role === "assistant") && content.trim()
                ? [{ role, content }]
                : [];
            })
            .slice(-MAX_CHAT_MESSAGES),
          runId,
          threadId,
        },
        signal,
      }),
  });

  useEffect(() => {
    if (messages.length > 0 && followReplies.current && transcript.current) {
      transcript.current.scrollTop = transcript.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const message = prompt.trim();
    if (message && !isLoading && mode !== "offline" && !modelUnavailable) {
      followReplies.current = true;
      setPrompt("");
      void sendMessage(message, {
        body: { harness, model, attachmentId: attachment?.id },
      });
    }
  };

  return (
    <section aria-labelledby="assistant-title" className="wb-assistant">
      <header className="wb-assistant-header">
        <div>
          <HugeiconsIcon icon={SparklesIcon} size={17} aria-hidden="true" />
          <h2 id="assistant-title">Assistant</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="wb-icon-button"
          type="button"
          aria-label="New chat"
          title="New chat"
          disabled={isLoading || messages.length === 0}
          onClick={() => {
            setChatVersion((version) => version + 1);
            setPrompt("");
            input.current?.focus();
          }}
        >
          <HugeiconsIcon icon={Add01Icon} size={18} aria-hidden="true" />
        </Button>
      </header>

      <div
        className="wb-transcript"
        ref={transcript}
        onScroll={(event) => {
          const element = event.currentTarget;
          followReplies.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            50;
        }}
      >
        {messages.length === 0 ? (
          <div className="wb-assistant-empty">
            <span className="wb-assistant-emblem">
              <HugeiconsIcon icon={SparklesIcon} size={26} aria-hidden="true" />
            </span>
            <h3>
              {mode === "offline"
                ? "Assistant unavailable"
                : "Work through the task"}
            </h3>
            {mode !== "offline" && (
              <>
                <p>Ask a question or attach a workspace file for context.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="wb-prompt-suggestion"
                  onClick={() => {
                    setPrompt("What should I verify first for this task?");
                    input.current?.focus();
                  }}
                >
                  What should I verify first?{" "}
                  <HugeiconsIcon
                    icon={ArrowUp02Icon}
                    size={13}
                    aria-hidden="true"
                  />
                </Button>
              </>
            )}
          </div>
        ) : (
          <ol className="wb-messages" aria-label="Conversation">
            {messages.map((message) => (
              <li key={message.id} data-role={message.role}>
                {message.role === "assistant" && (
                  <div className="wb-message-label">
                    <HugeiconsIcon
                      icon={SparklesIcon}
                      size={15}
                      aria-hidden="true"
                    />{" "}
                    Assistant
                  </div>
                )}
                <p>{messageText(message)}</p>
              </li>
            ))}
          </ol>
        )}
        {error && (
          <p role="alert" className="wb-assistant-error">
            The assistant couldn’t complete this request. Try again.
          </p>
        )}
      </div>

      <div className="wb-composer-wrap">
        <form
          className="wb-composer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          {attachment && (
            <Button
              variant="ghost"
              size="sm"
              className="wb-attachment"
              type="button"
              aria-label={`Remove ${attachment.path}`}
              title={attachment.path}
              onClick={onClearAttachment}
            >
              <HugeiconsIcon
                icon={Attachment01Icon}
                size={14}
                aria-hidden="true"
              />
              <span>{attachment.path.split("/").at(-1)}</span>
              <HugeiconsIcon icon={Cancel01Icon} size={12} aria-hidden="true" />
            </Button>
          )}
          <Textarea
            ref={input}
            id="assistant-prompt"
            aria-label="Message"
            maxLength={4000}
            placeholder="Message the assistant…"
            disabled={mode === "offline" || modelUnavailable}
            rows={3}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                send();
              }
            }}
          />
          <div className="wb-composer-toolbar">
            <div className="wb-composer-settings">
              <HarnessPicker
                compact
                value={harness}
                locked={!allowHarnessSelection}
                onChange={setHarness}
              />
              <ModelPicker
                compact
                value={model}
                locked={!allowModelSelection}
                onChange={setModel}
              />
            </div>
            {isLoading ? (
              <Button
                variant="ghost"
                size="sm"
                className="wb-send"
                type="button"
                aria-label="Stop"
                title="Stop"
                onClick={() => stop()}
              >
                <HugeiconsIcon icon={StopIcon} size={17} aria-hidden="true" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="wb-send"
                type="submit"
                aria-label="Send"
                title="Send (Ctrl or ⌘ + Enter)"
                disabled={
                  !prompt.trim() || mode === "offline" || modelUnavailable
                }
              >
                <HugeiconsIcon
                  icon={ArrowUp02Icon}
                  size={17}
                  aria-hidden="true"
                />
              </Button>
            )}
          </div>
        </form>
        {mode === "demo" && <p className="wb-mode">Scripted demo responses</p>}
        {modelUnavailable && (
          <p className="wb-mode">
            This model is available in the scripted demo.
          </p>
        )}
        {mode === "live" && !modelUnavailable && (
          <p className="wb-mode">
            OpenAI stream · selected harness is a preset
          </p>
        )}
      </div>
    </section>
  );
};
