import {
  Add01Icon,
  ArrowUp02Icon,
  Delete02Icon,
  Calendar03Icon,
  Folder01Icon,
  InboxIcon,
  Settings02Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { HarnessPicker, ModelPicker } from "./assistant-picker";
import { openAiModelSchema, sandboxes } from "./config";
import type { AssessmentConfig } from "./config";
import { demoAssessment } from "./demo-config";
import { InterviewFlow } from "./interview-flow";
import {
  createSessionSchema,
  metricLabels,
  selectedMetric,
} from "./session-config";
import type { SessionMetric } from "./session-config";
import { NewInvite, SessionOverview } from "./session-overview";
import type { InterviewerSession } from "./session-overview";
import { createInterviewSession } from "./sessions";
import { WorkspaceFiles } from "./workspace-files";

const field =
  "border-input bg-background w-full rounded-md border px-3 py-2 text-sm";
const panel = "bg-card space-y-4 rounded-xl border p-5";

export const InterviewerWorkspace = ({
  sessions,
  initialConfig,
}: {
  sessions: InterviewerSession[];
  initialConfig: AssessmentConfig | null;
}) => {
  const router = useRouter();
  const [draft, setDraft] = useState<AssessmentConfig>({
    ...(initialConfig ?? demoAssessment),
    harness: "workspace",
    model:
      openAiModelSchema.safeParse(initialConfig?.model).data ?? "gpt-6.1-sol",
    allowHarnessSelection: false,
    allowModelSelection: false,
  });
  const [tab, setTab] = useState<"flow" | "workspace" | "sessions">("flow");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState("");
  const [schedule, setSchedule] = useState("");
  const [duration, setDuration] = useState<30 | 60>(30);
  const [metrics, setMetrics] = useState<SessionMetric[]>([
    "steps",
    "files",
    "prompts",
  ]);
  const [useCodeInterpreter, setUseCodeInterpreter] = useState(true);
  const [invite, setInvite] = useState<string>();

  const change = <Key extends keyof AssessmentConfig>(
    key: Key,
    value: AssessmentConfig[Key]
  ) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setStatus("");
  };

  const useCurrentTime = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    setSchedule(local.toISOString().slice(0, 16));
  };

  const save = async () => {
    const localDate = new Date(schedule);
    const parsed = createSessionSchema.safeParse({
      assessment: draft,
      candidateEmail: email,
      scheduledAt: Number.isFinite(localDate.getTime())
        ? localDate.toISOString()
        : "",
      duration,
      metrics,
      useCodeInterpreter,
    });
    if (!parsed.success) {
      const [issue] = parsed.error.issues;
      if (issue?.path[0] === "assessment" && issue.path[1] === "files") {
        setTab("workspace");
      }
      setStatus(
        issue
          ? `${issue.path.join(" › ")}: ${issue.message}`
          : "Check your settings."
      );
      return;
    }
    setSaving(true);
    try {
      const result = await createInterviewSession({ data: parsed.data });
      setInvite(result.invite);
      setTab("sessions");
      await router.invalidate();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not create the session. Try again."
      );
    }
    setSaving(false);
  };

  return (
    <main className="w-full min-w-0 space-y-5 overflow-auto px-4 py-6 sm:px-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">
            Interviewer
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Interview studio
          </h1>
          <p className="text-muted-foreground text-sm">{draft.title}</p>
        </div>
        <Button type="button" disabled={saving || uploading} onClick={save}>
          <HugeiconsIcon icon={Calendar03Icon} aria-hidden="true" />
          {saving ? "Creating…" : "Create session link"}
        </Button>
      </header>
      {status && (
        <output className="bg-card block rounded-md border px-3 py-2 text-sm">
          {status}
        </output>
      )}
      {invite && <NewInvite invite={invite} />}
      <nav
        aria-label="Assessment builder sections"
        className="flex flex-wrap gap-2 border-b pb-3"
      >
        <Button
          type="button"
          variant={tab === "flow" ? "secondary" : "ghost"}
          onClick={() => setTab("flow")}
        >
          <HugeiconsIcon icon={Task01Icon} aria-hidden="true" /> Flow
        </Button>
        <Button
          type="button"
          variant={tab === "workspace" ? "secondary" : "ghost"}
          onClick={() => setTab("workspace")}
        >
          <HugeiconsIcon icon={Folder01Icon} aria-hidden="true" /> Workspace and
          files
        </Button>
        <Button
          type="button"
          variant={tab === "sessions" ? "secondary" : "ghost"}
          onClick={() => setTab("sessions")}
        >
          <HugeiconsIcon icon={InboxIcon} aria-hidden="true" /> Sessions (
          {sessions.length})
        </Button>
      </nav>
      {tab === "flow" && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className={panel} aria-labelledby="flow-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="flow-title" className="font-semibold">
                Interview flow
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={draft.steps.length >= 8}
                onClick={() =>
                  change("steps", [
                    ...draft.steps,
                    {
                      id: crypto.randomUUID(),
                      title: "New step",
                      instructions: "",
                    },
                  ])
                }
              >
                <HugeiconsIcon icon={Add01Icon} aria-hidden="true" /> Add step
              </Button>
            </div>
            <InterviewFlow steps={draft.steps} />
            <ol className="space-y-3">
              {draft.steps.map((step, index) => {
                const update = (values: Partial<typeof step>) =>
                  change(
                    "steps",
                    draft.steps.map((item) =>
                      item.id === step.id ? { ...item, ...values } : item
                    )
                  );
                return (
                  <li
                    key={step.id}
                    className="bg-background space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-muted-foreground text-sm font-medium">
                        Step {index + 1}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={index === 0}
                          aria-label={`Move step ${index + 1} up`}
                          onClick={() => {
                            const reordered = [...draft.steps];
                            reordered.splice(index, 1);
                            reordered.splice(index - 1, 0, step);
                            change("steps", reordered);
                          }}
                        >
                          <HugeiconsIcon
                            icon={ArrowUp02Icon}
                            aria-hidden="true"
                          />{" "}
                          Move up
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={draft.steps.length === 1}
                          aria-label={`Remove step ${index + 1}`}
                          onClick={() =>
                            change(
                              "steps",
                              draft.steps.filter((item) => item.id !== step.id)
                            )
                          }
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            aria-hidden="true"
                          />{" "}
                          Remove
                        </Button>
                      </div>
                    </div>
                    <label className="block space-y-1 text-sm">
                      <span>Step title</span>
                      <Input
                        value={step.title}
                        maxLength={90}
                        onChange={(event) =>
                          update({ title: event.target.value })
                        }
                      />
                    </label>
                    <label className="block space-y-1 text-sm">
                      <span>Candidate instructions</span>
                      <Textarea
                        className={field}
                        rows={2}
                        maxLength={1600}
                        value={step.instructions}
                        onChange={(event) =>
                          update({ instructions: event.target.value })
                        }
                      />
                    </label>
                  </li>
                );
              })}
            </ol>
          </section>
          <section className={panel} aria-labelledby="runtime-title">
            <h2
              id="runtime-title"
              className="flex items-center gap-2 font-semibold"
            >
              <HugeiconsIcon
                icon={Settings02Icon}
                size={17}
                aria-hidden="true"
              />{" "}
              Assistant and sandbox
            </h2>
            <div className="space-y-1 text-sm">
              <div>Harness preset</div>
              <HarnessPicker locked value="workspace" />
            </div>
            <div className="space-y-1 text-sm">
              <div>Model</div>
              <ModelPicker
                supportedModels={openAiModelSchema.options}
                value={draft.model}
                onChange={(value) => change("model", value)}
              />
            </div>
            <label className="block space-y-1 text-sm">
              <span>Sandbox mode</span>
              <select
                className={field}
                value={draft.sandbox}
                onChange={(event) =>
                  change(
                    "sandbox",
                    event.target.value === "scratchpad"
                      ? "scratchpad"
                      : "read-only"
                  )
                }
              >
                {Object.entries(sandboxes).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.allowFileAttachments}
                onChange={(event) =>
                  change("allowFileAttachments", event.target.checked)
                }
              />
              Allow attaching files to chat
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useCodeInterpreter}
                onChange={(event) =>
                  setUseCodeInterpreter(event.target.checked)
                }
              />
              Enable sandboxed Python analysis
            </label>
            <div className="space-y-3 border-t pt-4">
              <h2 className="font-semibold">Schedule and invite</h2>
              <label className="block space-y-1 text-sm">
                Candidate email
                <Input
                  type="email"
                  value={email}
                  placeholder="candidate@example.com"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label className="block space-y-1 text-sm">
                Start time (your local time)
                <Input
                  type="datetime-local"
                  value={schedule}
                  onChange={(event) => setSchedule(event.target.value)}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useCurrentTime}
              >
                Start now
              </Button>
              <label className="block space-y-1 text-sm">
                Duration
                <select
                  className={field}
                  value={duration}
                  onChange={(event) =>
                    setDuration(event.target.value === "60" ? 60 : 30)
                  }
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </label>
            </div>
            <fieldset className="space-y-2 border-t pt-4">
              <legend className="font-semibold">Review metrics</legend>
              {selectedMetric.options.map((metric) => (
                <label key={metric} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={metrics.includes(metric)}
                    onChange={(event) =>
                      setMetrics(
                        event.target.checked
                          ? [...metrics, metric]
                          : metrics.filter((item) => item !== metric)
                      )
                    }
                  />
                  {metricLabels[metric]}
                </label>
              ))}
            </fieldset>
          </section>
        </div>
      )}
      {tab === "workspace" && (
        <div className="grid items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className={panel} aria-labelledby="brief-title">
            <h2 id="brief-title" className="font-semibold">
              Workspace brief
            </h2>
            <label className="block space-y-1 text-sm">
              <span>Assessment title</span>
              <Input
                value={draft.title}
                maxLength={120}
                onChange={(event) => change("title", event.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Workspace name</span>
              <Input
                value={draft.workspace}
                maxLength={60}
                onChange={(event) => change("workspace", event.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Problem brief</span>
              <Textarea
                className={field}
                rows={7}
                maxLength={2400}
                value={draft.brief}
                onChange={(event) => change("brief", event.target.value)}
              />
            </label>
          </section>
          <WorkspaceFiles
            files={draft.files}
            uploading={uploading}
            onUploadingChange={setUploading}
            onChange={(update) => {
              setDraft((previous) => ({
                ...previous,
                files: update(previous.files),
              }));
              setStatus("");
            }}
          />
        </div>
      )}
      {tab === "sessions" && <SessionOverview sessions={sessions} />}
    </main>
  );
};
