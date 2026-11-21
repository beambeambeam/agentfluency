import {
  ArrowRight01Icon,
  Attachment01Icon,
  CheckmarkCircle02Icon,
  Folder01Icon,
  FullScreenIcon,
  LockKeyIcon,
  MinimizeScreenIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AssistantChat } from "@/features/assistant-chat";

import { sandboxes } from "./config";
import { EditorTabs } from "./editor-tabs";
import type { WorkspaceTab } from "./editor-tabs";
import { FileExplorer, getFileKind } from "./file-explorer";
import type { WorkspaceFile } from "./file-explorer";
import { submitInterview } from "./server";
import type { InterviewData } from "./server";
import { SourcePreview } from "./source-preview";
import { WorkbenchSplit } from "./workbench-split";

import "./workbench.css";

const scratchpadTab = "scratchpad";
const fileTab = (path: string) => `file:${path}`;

const FilePreview = ({
  file,
  attached,
  attachFile,
}: {
  file?: WorkspaceFile;
  attached: boolean;
  attachFile?: (file: WorkspaceFile) => void;
}) => {
  if (!file) {
    return (
      <p className="wb-editor-empty">
        Select a file in the explorer to open it.
      </p>
    );
  }
  return (
    <>
      <div className="wb-breadcrumbs">
        <span className="wb-path" title={file.path}>
          {file.path.split("/").join(" / ")}
        </span>
        {attachFile && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="wb-attach-file"
            onClick={() => attachFile(file)}
            disabled={attached}
          >
            <HugeiconsIcon
              icon={Attachment01Icon}
              size={15}
              aria-hidden="true"
            />
            {attached ? "Attached" : "Attach to chat"}
          </Button>
        )}
      </div>
      <SourcePreview file={file} />
    </>
  );
};

const EditorStatus = ({
  file,
  showNotes,
}: {
  file?: WorkspaceFile;
  showNotes: boolean;
}) => {
  if (showNotes) {
    return <span>Scratchpad</span>;
  }
  if (!file) {
    return null;
  }
  return (
    <span>
      {getFileKind(file).label} <span className="wb-status-dot">·</span> Read
      only
    </span>
  );
};

const FullscreenButton = () => {
  const [fullscreen, setFullscreen] = useState(false);
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const label = fullscreen ? "Exit fullscreen" : "Enter fullscreen";
  const toggle = async () => {
    try {
      await (document.fullscreenElement
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen());
    } catch {
      setAvailable(false);
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={!available}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <HugeiconsIcon
        icon={fullscreen ? MinimizeScreenIcon : FullScreenIcon}
        aria-hidden="true"
      />
    </Button>
  );
};

export const CandidateWorkspace = ({
  assistantMode,
  config,
  submission,
}: Extract<InterviewData, { role: "candidate" }>) => {
  const [initialFile] = config.files;
  const hasScratchpad = config.sandbox === "scratchpad";
  const initialTab = initialFile && fileTab(initialFile.path);
  const [stepIndex, setStepIndex] = useState(0);
  const [tabOrder, setTabOrder] = useState(() =>
    [initialTab, hasScratchpad ? scratchpadTab : undefined].filter(
      (id): id is string => id !== undefined
    )
  );
  const [activeTab, setActiveTab] = useState<string | undefined>(initialTab);
  const [attachment, setAttachment] = useState<WorkspaceFile>();
  const [scratchpad, setScratchpad] = useState("");
  const [response, setResponse] = useState(submission);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(
    submission ? "Recommendation submitted." : ""
  );
  const step = config.steps[stepIndex];
  const lastStep = stepIndex === config.steps.length - 1;
  const files = new Map(config.files.map((item) => [fileTab(item.path), item]));
  const file = activeTab ? files.get(activeTab) : undefined;
  const showNotes = hasScratchpad && activeTab === scratchpadTab;
  const tabs = tabOrder.flatMap<WorkspaceTab>((id) => {
    if (id === scratchpadTab && hasScratchpad) {
      return [{ id }];
    }
    const opened = files.get(id);
    return opened ? [{ id, file: opened }] : [];
  });

  const openFile = (selected: WorkspaceFile) => {
    const id = fileTab(selected.path);
    setTabOrder((order) => {
      if (order.includes(id)) {
        return order;
      }
      const index =
        order.at(-1) === scratchpadTab ? order.length - 1 : order.length;
      return [...order.slice(0, index), id, ...order.slice(index)];
    });
    setActiveTab(id);
  };

  const closeTab = (id: string) => {
    const index = tabs.findIndex((tab) => tab.id === id);
    setTabOrder((order) => order.filter((tab) => tab !== id));
    if (activeTab === id) {
      setActiveTab((tabs[index + 1] ?? tabs[index - 1])?.id);
    }
  };

  const reorderTab = (id: string, target: string, after: boolean) => {
    if (id === target) {
      return;
    }
    setTabOrder((order) => {
      if (!order.includes(id) || !order.includes(target)) {
        return order;
      }
      const remaining = order.filter((tab) => tab !== id);
      const position = remaining.indexOf(target) + Number(after);
      remaining.splice(position, 0, id);
      return remaining;
    });
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      await submitInterview({ data: { response } });
      setStatus("Recommendation submitted.");
    } catch {
      setStatus("Could not submit. Try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <main className="candidate-workbench">
      <header className="wb-heading">
        <span className="wb-project-icon">
          <HugeiconsIcon icon={Folder01Icon} size={21} aria-hidden="true" />
        </span>
        <div className="wb-project">
          <h1 title={config.workspace}>{config.workspace}</h1>
          <p title={config.title}>{config.title}</p>
        </div>
        <span className="wb-sandbox" title={sandboxes[config.sandbox]}>
          <HugeiconsIcon icon={LockKeyIcon} size={14} aria-hidden="true" />
          <span>{sandboxes[config.sandbox]}</span>
        </span>
        <FullscreenButton />
      </header>

      <div className="wb-shell">
        <aside className="wb-sidebar" aria-label="Workspace explorer">
          <h2 className="wb-panel-heading">Explorer</h2>
          <div className="wb-file-scroll">
            <FileExplorer
              files={config.files}
              projectName={config.workspace}
              activePath={file?.path}
              openFile={openFile}
            />
          </div>
          <nav className="wb-step-nav" aria-label="Interview steps">
            <h2 className="wb-panel-heading">Interview steps</h2>
            <ol>
              {config.steps.map((item, index) => (
                <li key={item.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    aria-current={index === stepIndex ? "step" : undefined}
                    onClick={() => setStepIndex(index)}
                  >
                    {index < stepIndex ? (
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={15}
                        className="wb-step-complete"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="wb-step-number" aria-hidden="true">
                        {index + 1}
                      </span>
                    )}
                    <span>{item.title}</span>
                  </Button>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <WorkbenchSplit
          editor={
            <section
              id="candidate-editor"
              className="wb-editor"
              aria-label="Workspace editor"
            >
              <EditorTabs
                tabs={tabs}
                active={activeTab}
                select={setActiveTab}
                close={closeTab}
                reorder={reorderTab}
              />

              {showNotes && (
                <Textarea
                  className="wb-notes"
                  aria-label="Scratchpad notes"
                  placeholder="Record calculations and checks…"
                  value={scratchpad}
                  onChange={(event) => setScratchpad(event.target.value)}
                />
              )}
              {!showNotes && (
                <FilePreview
                  file={file}
                  attached={Boolean(file && attachment?.path === file.path)}
                  attachFile={
                    config.allowFileAttachments ? setAttachment : undefined
                  }
                />
              )}

              <div className="wb-task">
                <div className="wb-task-heading">
                  <HugeiconsIcon
                    icon={Task01Icon}
                    size={18}
                    aria-hidden="true"
                  />
                  <h2>{step?.title}</h2>
                  <span>
                    Step {stepIndex + 1} of {config.steps.length}
                  </span>
                </div>
                {stepIndex === 0 && <p>{config.brief}</p>}
                <p>{step?.instructions}</p>
                {lastStep ? (
                  <form
                    className="wb-submit"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      await submit();
                    }}
                  >
                    <label htmlFor="workspace-recommendation">
                      Your recommendation
                    </label>
                    <Textarea
                      id="workspace-recommendation"
                      rows={4}
                      maxLength={12_000}
                      value={response}
                      onChange={(event) => {
                        setResponse(event.target.value);
                        setStatus("");
                      }}
                    />
                    <Button
                      size="sm"
                      type="submit"
                      disabled={isSubmitting || !response.trim()}
                    >
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        aria-hidden="true"
                      />
                      {isSubmitting ? "Submitting…" : "Submit recommendation"}
                    </Button>
                    {status && <output>{status}</output>}
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="wb-next"
                    type="button"
                    onClick={() => setStepIndex(stepIndex + 1)}
                  >
                    Next step{" "}
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={14}
                      aria-hidden="true"
                    />
                  </Button>
                )}
              </div>
            </section>
          }
          assistant={
            <AssistantChat
              initialHarness={config.harness}
              initialModel={config.model}
              allowHarnessSelection={config.allowHarnessSelection}
              allowModelSelection={config.allowModelSelection}
              mode={assistantMode}
              attachment={attachment}
              onClearAttachment={() => setAttachment(undefined)}
            />
          }
        />

        <footer className="wb-statusbar">
          <span>Files: {config.files.length}</span>
          <EditorStatus file={file} showNotes={showNotes} />
        </footer>
      </div>
    </main>
  );
};
