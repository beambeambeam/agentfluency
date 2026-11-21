import {
  ArrowRight01Icon,
  Attachment01Icon,
  CheckmarkCircle02Icon,
  FullScreenIcon,
  LockKeyIcon,
  MinimizeScreenIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AssistantChat } from "@/features/assistant-chat";

import { sandboxes } from "./config";
import type { AssessmentConfig } from "./config";
import { EditorTabs } from "./editor-tabs";
import type { WorkspaceTab } from "./editor-tabs";
import { FileExplorer, getFileKind } from "./file-explorer";
import type { WorkspaceFile } from "./file-explorer";
import type { SessionMetric } from "./session-config";
import {
  getCandidateWorkspace,
  keepInterviewSandboxAlive,
  recordInterviewActivity,
  submitInterviewSession,
} from "./sessions";
import { SourcePreview } from "./source-preview";
import { WorkbenchSplit } from "./workbench-split";
import { FileChangeBadge, WorkspaceDiff } from "./workspace-diff";
import { workspaceChanges } from "./workspace-state";
import type { WorkspaceState } from "./workspace-state";

import "./workbench.css";

const scratchpadTab = "scratchpad";
const fileTab = (path: string) => `file:${path}`;

const FilePreview = ({
  file,
  attached,
  attachFile,
  allowAttachments,
  change,
}: {
  file?: WorkspaceFile;
  attached: boolean;
  attachFile: (file: WorkspaceFile) => void;
  allowAttachments: boolean;
  change?: ReturnType<typeof workspaceChanges>[number];
}) => {
  const [showChanges, setShowChanges] = useState(false);
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
        {change && (
          <>
            <FileChangeBadge change={change.change} />
            {change.change !== "deleted" && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={showChanges}
                onClick={() => setShowChanges(!showChanges)}
              >
                {showChanges ? "View file" : "View changes"}
              </Button>
            )}
          </>
        )}
        {allowAttachments && change?.change !== "deleted" && (
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
      {change && (showChanges || change.change === "deleted") ? (
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <WorkspaceDiff change={change} />
        </div>
      ) : (
        <SourcePreview file={file} />
      )}
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
    update();
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

const WorkspaceExplorerPanel = ({
  syncWorkspace,
  syncError,
  ...explorer
}: ComponentProps<typeof FileExplorer> & {
  syncWorkspace: () => void;
  syncError: boolean;
}) => (
  <>
    <div className="flex items-center justify-between gap-2 pr-2">
      <h2 className="wb-panel-heading">Explorer</h2>
      <Button type="button" size="sm" variant="ghost" onClick={syncWorkspace}>
        Refresh files
      </Button>
    </div>
    {syncError && (
      <p className="text-destructive px-3 text-xs" role="alert">
        Could not refresh files.
      </p>
    )}
    <div className="wb-file-scroll">
      <FileExplorer {...explorer} />
    </div>
  </>
);

const WorkspaceCount = ({
  files,
  changes,
}: {
  files: number;
  changes: number;
}) => (
  <>
    <span>Files: {files}</span>
    {changes > 0 && <span aria-live="polite">{changes} changed</span>}
  </>
);

export const CandidateWorkspace = ({
  config,
  initialWorkspace,
  sessionId,
  endsAt,
  metrics,
  onComplete,
}: {
  config: AssessmentConfig;
  initialWorkspace: WorkspaceState;
  sessionId: string;
  endsAt: string;
  metrics: SessionMetric[];
  onComplete: () => void;
}) => {
  const [initialFile] = initialWorkspace.files;
  const hasScratchpad = config.sandbox === "scratchpad";
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [syncError, setSyncError] = useState(false);
  const initialTab = initialFile && fileTab(initialFile.path);
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [showProblem, setShowProblem] = useState(true);
  const [remaining, setRemaining] = useState<number>();
  const [tabOrder, setTabOrder] = useState(() =>
    [initialTab, hasScratchpad ? scratchpadTab : undefined].filter(
      (id): id is string => id !== undefined
    )
  );
  const [activeTab, setActiveTab] = useState<string | undefined>(initialTab);
  const [attachment, setAttachment] = useState<WorkspaceFile>();
  const [scratchpad, setScratchpad] = useState("");
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const step = config.steps[stepIndex];
  const lastStep = stepIndex === config.steps.length - 1;
  const changes = workspaceChanges(config.files, workspace.files);
  const changesByPath = new Map(changes.map((change) => [change.path, change]));
  const explorerFiles = [
    ...workspace.files,
    ...changes.flatMap((change) =>
      change.change === "deleted" && change.original ? [change.original] : []
    ),
  ];
  const files = new Map(
    explorerFiles.map((item) => [fileTab(item.path), item])
  );
  const file = activeTab ? files.get(activeTab) : undefined;
  const fileChange = file && changesByPath.get(file.path);
  const activeAttachment = workspace.files.find(
    ({ id }) => id === attachment?.id
  );
  const showNotes = hasScratchpad && activeTab === scratchpadTab;
  const tabs = tabOrder.flatMap<WorkspaceTab>((id) => {
    if (id === scratchpadTab && hasScratchpad) {
      return [{ id }];
    }
    const opened = files.get(id);
    return opened ? [{ id, file: opened }] : [];
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const seconds = Math.max(
        0,
        Math.ceil((Date.parse(endsAt) - Date.now()) / 1000)
      );
      setRemaining(seconds);
      if (seconds === 0) {
        window.clearInterval(timer);
        onComplete();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt, onComplete]);

  useEffect(() => {
    // OpenAI uses a 20-minute idle expiry. Keep the same container while the interview is open.
    const timer = window.setInterval(() => {
      if (Date.now() >= Date.parse(endsAt)) {
        window.clearInterval(timer);
        return;
      }
      void keepInterviewSandboxAlive({ data: sessionId }).catch(() => null);
    }, 8 * 60_000);
    return () => window.clearInterval(timer);
  }, [endsAt, sessionId]);

  useEffect(() => {
    if (metrics.includes("steps") && step) {
      void recordInterviewActivity({
        data: { id: sessionId, kind: "step", itemId: step.id },
      }).catch(() => null);
    }
  }, [metrics, sessionId, step]);

  const recordFile = (selected: WorkspaceFile, kind: "file" | "attachment") => {
    if (metrics.includes("files")) {
      void recordInterviewActivity({
        data: { id: sessionId, kind, itemId: selected.id },
      }).catch(() => null);
    }
  };

  const syncWorkspace = async () => {
    try {
      const latest = await getCandidateWorkspace({ data: sessionId });
      if (latest) {
        setWorkspace((current) =>
          latest.revision > current.revision ? latest : current
        );
        setSyncError(false);
      }
    } catch {
      setSyncError(true);
    }
  };

  const navigateToStep = (index: number) => {
    setStepIndex(index);
    setFurthestStep((furthest) => Math.max(furthest, index));
    setShowProblem(true);
  };

  const openFile = (selected: WorkspaceFile) => {
    recordFile(selected, "file");
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
      const otherTabs = order.filter((tab) => tab !== id);
      const position = otherTabs.indexOf(target) + Number(after);
      otherTabs.splice(position, 0, id);
      return otherTabs;
    });
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      await submitInterviewSession({ data: { id: sessionId, response } });
      onComplete();
    } catch {
      setStatus("Could not submit. Try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <main className="candidate-workbench">
      <header className="wb-heading">
        <BrandLogo compact />
        <div className="wb-project">
          <h1 title={config.workspace}>{config.workspace}</h1>
          <p title={config.title}>{config.title}</p>
        </div>
        <span className="wb-sandbox" title={sandboxes[config.sandbox]}>
          <HugeiconsIcon icon={LockKeyIcon} size={14} aria-hidden="true" />
          <span>{sandboxes[config.sandbox]}</span>
        </span>
        <span className="wb-sandbox tabular-nums" aria-label="Time remaining">
          {remaining === undefined
            ? "—:—"
            : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="wb-problem-toggle"
          aria-expanded={showProblem}
          aria-controls="interview-problem"
          onClick={() => setShowProblem((shown) => !shown)}
        >
          <HugeiconsIcon icon={Task01Icon} aria-hidden="true" />
          <span>{showProblem ? "Hide problem" : "View problem"}</span>
        </Button>
        <FullscreenButton />
      </header>

      <div className="wb-shell">
        <aside className="wb-sidebar" aria-label="Workspace explorer">
          <WorkspaceExplorerPanel
            files={explorerFiles}
            projectName={config.workspace}
            activePath={file?.path}
            changes={new Map(changes.map(({ path, change }) => [path, change]))}
            openFile={openFile}
            syncWorkspace={syncWorkspace}
            syncError={syncError}
          />
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
                    disabled={index > furthestStep}
                    onClick={() => navigateToStep(index)}
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
                  key={file?.path}
                  file={file}
                  change={fileChange}
                  attached={Boolean(
                    file && activeAttachment?.path === file.path
                  )}
                  allowAttachments={config.allowFileAttachments}
                  attachFile={(selected) => {
                    setAttachment(selected);
                    recordFile(selected, "attachment");
                  }}
                />
              )}

              <div
                id="interview-problem"
                className="wb-task"
                hidden={!showProblem}
              >
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
                      Your submission
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
                      {isSubmitting ? "Submitting…" : "Submit interview"}
                    </Button>
                    {status && <output>{status}</output>}
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="wb-next"
                    type="button"
                    onClick={() => navigateToStep(stepIndex + 1)}
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
              mode="live"
              sessionId={sessionId}
              attachment={activeAttachment}
              onClearAttachment={() => setAttachment(undefined)}
              onWorkspaceChange={syncWorkspace}
            />
          }
        />

        <footer className="wb-statusbar">
          <WorkspaceCount
            files={workspace.files.length}
            changes={changes.length}
          />
          <EditorStatus file={file} showNotes={showNotes} />
        </footer>
      </div>
    </main>
  );
};
