import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";

import { metricLabels } from "./session-config";
import { displayTime } from "./session-overview";
import type { getSessionReport } from "./sessions";

type Report = NonNullable<Awaited<ReturnType<typeof getSessionReport>>>;

export const SessionReport = ({ report }: { report: Report }) => {
  const finished = report.status === "submitted" || report.status === "expired";
  const elapsed =
    report.startedAt && finished
      ? Math.max(
          0,
          Math.floor(
            (Date.parse(report.endedAt) - Date.parse(report.startedAt)) / 60_000
          )
        )
      : null;
  const counts = {
    steps: new Set(
      report.events
        .filter((event) => event.kind === "step")
        .map((event) => event.detail)
    ).size,
    files: new Set(
      report.events
        .filter((event) => event.kind === "file" || event.kind === "attachment")
        .map((event) => event.detail)
    ).size,
    prompts: report.events.filter((event) => event.kind === "prompt").length,
  };
  const visibleEvents = report.events.filter(({ kind }) =>
    kind === "prompt" || kind === "reply"
      ? report.metrics.includes("transcript")
      : true
  );

  return (
    <main className="overflow-auto">
      <div className="mx-auto max-w-5xl space-y-5 px-5 py-7">
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
        {finished ? (
          <>
            <dl className="grid gap-3 sm:grid-cols-4">
              <div className="bg-card rounded-xl border p-4">
                <dt className="text-muted-foreground text-sm">Elapsed time</dt>
                <dd className="text-xl font-semibold">
                  {elapsed === null ? "Did not start" : `${elapsed} min`}
                </dd>
              </div>
              {report.metrics
                .filter((metric) => metric !== "transcript")
                .map((metric) => (
                  <div key={metric} className="bg-card rounded-xl border p-4">
                    <dt className="text-muted-foreground text-sm">
                      {metricLabels[metric]}
                    </dt>
                    <dd className="text-xl font-semibold">{counts[metric]}</dd>
                  </div>
                ))}
            </dl>
            <section className="bg-card space-y-2 rounded-xl border p-5">
              <h2 className="font-semibold">Submitted work</h2>
              <p className="text-sm whitespace-pre-wrap">
                {report.response ?? "No submission was received."}
              </p>
            </section>
            {visibleEvents.length > 0 && (
              <section className="bg-card space-y-3 rounded-xl border p-5">
                <h2 className="font-semibold">Session activity</h2>
                <ol className="divide-y">
                  {visibleEvents.map((event) => (
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
            This report unlocks when the candidate submits or the interview
            window ends.
          </p>
        )}
      </div>
    </main>
  );
};
