import {
  Add01Icon,
  ArrowUp02Icon,
  Delete02Icon,
  FileAddIcon,
  FloppyDiskIcon,
  Folder01Icon,
  InboxIcon,
  Settings02Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useHydrated } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { HarnessPicker, ModelPicker } from "./assistant-picker";
import { assessmentSchema, sandboxes } from "./config";
import type { AssessmentConfig } from "./config";
import { generateInvitation, updateInterview } from "./server";
import type { InterviewData } from "./server";

const field =
  "border-input bg-background w-full rounded-md border px-3 py-2 text-sm";
const panel = "bg-card space-y-4 rounded-xl border p-5";

export const InterviewerWorkspace = ({
  config,
  invite,
  submissions,
}: Extract<InterviewData, { role: "interviewer" }>) => {
  const [draft, setDraft] = useState(config);
  const [tab, setTab] = useState<"flow" | "workspace" | "submissions">("flow");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [sharedInvite, setSharedInvite] = useState(invite);
  const origin = useHydrated() ? window.location.origin : "";
  const [copyStatus, setCopyStatus] = useState("");
  const inviteUrl =
    sharedInvite && origin ? `${origin}/invite/${sharedInvite.id}` : "";

  const change = <Key extends keyof AssessmentConfig>(
    key: Key,
    value: AssessmentConfig[Key]
  ) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setStatus("");
  };

  const save = async (generate: boolean) => {
    const parsed = assessmentSchema.safeParse(draft);
    if (!parsed.success) {
      const [issue] = parsed.error.issues;
      setStatus(
        issue
          ? `${issue.path.join(" › ")}: ${issue.message}`
          : "Check your settings."
      );
      return;
    }
    setSaving(true);
    try {
      if (generate) {
        const id = await generateInvitation({ data: parsed.data });
        setSharedInvite({ id, title: parsed.data.title });
        setCopyStatus("");
      } else {
        await updateInterview({ data: parsed.data });
      }
      setDraft(parsed.data);
      setStatus(
        generate
          ? "Assessment saved. Your invitation is ready to share."
          : "Assessment draft saved."
      );
    } catch {
      setStatus("Could not save. Try again.");
    }
    setSaving(false);
  };

  return (
    <main className="w-full min-w-0 space-y-5 px-4 py-6 sm:px-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">
            Interviewer
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Assessment builder
          </h1>
          <p className="text-muted-foreground text-sm">{draft.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => save(false)}
          >
            <HugeiconsIcon icon={FloppyDiskIcon} aria-hidden="true" />
            {saving ? "Saving…" : "Save assessment"}
          </Button>
          <Button type="button" disabled={saving} onClick={() => save(true)}>
            Generate invitation
          </Button>
        </div>
      </header>
      {status && (
        <output className="bg-card block rounded-md border px-3 py-2 text-sm">
          {status}
        </output>
      )}
      {inviteUrl && sharedInvite && (
        <section
          className={`${panel} flex flex-wrap items-center gap-5`}
          aria-label="Share assessment invitation"
        >
          <QRCodeSVG
            value={inviteUrl}
            size={152}
            marginSize={4}
            title={`Invitation QR code for ${sharedInvite.title}`}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="font-semibold">Share invitation</h2>
            <p className="text-muted-foreground text-sm">
              {sharedInvite.title} · Each candidate gets a separate attempt with
              this configuration.
            </p>
            <label className="block text-sm" htmlFor="assessment-link">
              Invitation link
            </label>
            <Input
              id="assessment-link"
              readOnly
              value={inviteUrl}
              onFocus={(event) => event.target.select()}
            />
            <Button
              variant="outline"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteUrl);
                  setCopyStatus("Link copied.");
                } catch {
                  setCopyStatus(
                    "Select the invitation link above and copy it."
                  );
                }
              }}
            >
              Copy link
            </Button>{" "}
            <output className="text-sm">{copyStatus}</output>
          </div>
        </section>
      )}
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
          variant={tab === "submissions" ? "secondary" : "ghost"}
          onClick={() => setTab("submissions")}
        >
          <HugeiconsIcon icon={InboxIcon} aria-hidden="true" /> Submissions (
          {submissions.length})
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
              <HarnessPicker
                value={draft.harness}
                onChange={(value) => change("harness", value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.allowHarnessSelection}
                onChange={(event) =>
                  change("allowHarnessSelection", event.target.checked)
                }
              />
              Candidate can change harness
            </label>
            <div className="space-y-1 text-sm">
              <div>Model</div>
              <ModelPicker
                value={draft.model}
                onChange={(value) => change("model", value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.allowModelSelection}
                onChange={(event) =>
                  change("allowModelSelection", event.target.checked)
                }
              />
              Candidate can change model
            </label>
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
          <section className={panel} aria-labelledby="files-title">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 id="files-title" className="font-semibold">
                  Provided files
                </h2>
                <p className="text-muted-foreground text-sm">
                  Use paths like data/sales.csv to create folders.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={draft.files.length >= 18}
                onClick={() =>
                  change("files", [
                    ...draft.files,
                    { id: crypto.randomUUID(), path: "", content: "" },
                  ])
                }
              >
                <HugeiconsIcon icon={FileAddIcon} aria-hidden="true" /> Add file
              </Button>
            </div>
            <div className="space-y-3">
              {draft.files.map((file) => {
                const update = (values: Partial<typeof file>) =>
                  change(
                    "files",
                    draft.files.map((item) =>
                      item.id === file.id ? { ...item, ...values } : item
                    )
                  );
                return (
                  <div
                    key={file.id}
                    className="bg-background space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-end gap-2">
                      <label className="grow space-y-1 text-sm">
                        <span>File path</span>
                        <Input
                          value={file.path}
                          maxLength={160}
                          placeholder="folder/example.txt"
                          onChange={(event) =>
                            update({ path: event.target.value })
                          }
                        />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          change(
                            "files",
                            draft.files.filter((item) => item.id !== file.id)
                          )
                        }
                      >
                        <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />{" "}
                        Remove file
                      </Button>
                    </div>
                    <label className="block space-y-1 text-sm">
                      <span>Contents</span>
                      <Textarea
                        className={`${field} font-mono`}
                        rows={5}
                        maxLength={12_000}
                        value={file.content}
                        onChange={(event) =>
                          update({ content: event.target.value })
                        }
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
      {tab === "submissions" && (
        <section className={panel} aria-labelledby="submissions-title">
          <h2 id="submissions-title" className="font-semibold">
            Candidate submissions
          </h2>
          {submissions.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Submitted recommendations will appear here.
            </p>
          )}
          {submissions.map((submission) => (
            <article
              key={`${submission.inviteId}/${submission.candidateId}`}
              className="bg-background space-y-2 rounded-lg border p-4"
            >
              <h3 className="font-medium">{submission.candidateName}</h3>
              <p className="text-muted-foreground text-sm">
                {submission.title}
              </p>
              <p className="text-muted-foreground text-xs">
                <time dateTime={submission.submittedAt.toISOString()}>
                  {submission.submittedAt
                    .toISOString()
                    .slice(0, 16)
                    .replace("T", " ")}{" "}
                  UTC
                </time>
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {submission.response}
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};
