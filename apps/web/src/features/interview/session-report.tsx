import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";

import { SessionCharts } from "./session-charts";
import { SessionEvaluation } from "./session-evaluation";
import { displayTime } from "./session-overview";
import type { getSessionReport } from "./sessions";
import { FileChangeBadge, WorkspaceDiff } from "./workspace-diff";

type Report = NonNullable<Awaited<ReturnType<typeof getSessionReport>>>;

export const SessionReport = ({ report }: { report: Report }) => (
  <main className="overflow-auto">
    <div className="mx-auto max-w-6xl space-y-5 px-5 py-7">
      <Link
        to="/dashboard"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Back to interviews
      </Link>
      <header>
        <p className="text-muted-foreground text-sm capitalize">
          {report.status}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {report.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {report.email} · {displayTime(report.scheduledAt)}
        </p>
      </header>
      {report.summary ? (
        <>
          {report.status === "submitted" && (
            <SessionEvaluation
              key={report.id}
              sessionId={report.id}
              initialEvaluation={report.evaluation}
            />
          )}
          <SessionCharts
            summary={report.summary}
            eventLimitReached={report.eventLimitReached}
          />
          <section className="bg-card space-y-2 rounded-xl border p-5">
            <h2 className="font-semibold">Submitted work</h2>
            <p className="text-sm whitespace-pre-wrap">
              {report.response ?? "No submission was received."}
            </p>
          </section>
          {report.fileChanges.length > 0 && (
            <section className="bg-card space-y-2 rounded-xl border p-5">
              <h2 className="font-semibold">Workspace changes</h2>
              <ul className="divide-y">
                {report.fileChanges.map((change) => (
                  <li key={change.path} className="py-2">
                    <details>
                      <summary className="cursor-pointer text-sm">
                        <span className="mx-2 font-mono break-all">
                          {change.path}
                        </span>
                        <FileChangeBadge change={change.change} />
                      </summary>
                      <div className="pt-2">
                        <WorkspaceDiff change={change} />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {report.events.length > 0 && (
            <section className="bg-card space-y-3 rounded-xl border p-5">
              <h2 className="font-semibold">Session activity</h2>
              <ol className="max-h-96 divide-y overflow-auto">
                {report.events.map((event) => (
                  <li className="space-y-1 py-3" key={event.id}>
                    <p className="text-muted-foreground text-xs capitalize">
                      {event.kind} · {displayTime(event.time)}
                    </p>
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {event.detail}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      ) : (
        <p className="bg-card rounded-xl border p-5 text-sm">
          This report unlocks when the candidate submits or the interview window
          ends.
        </p>
      )}
    </div>
  </main>
);
