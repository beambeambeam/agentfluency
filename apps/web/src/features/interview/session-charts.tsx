import { DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { percentOf } from "./session-metrics";
import type { SessionMetrics } from "./session-metrics";

const panel = "bg-card min-w-0 rounded-xl border p-5";

const durationLabel = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
};

const ActivityMix = ({
  activity,
  total,
}: {
  activity: SessionMetrics["activity"];
  total: number;
}) => {
  const stops = activity.map(({ color, count }, index) => {
    const start = activity
      .slice(0, index)
      .reduce((sum, item) => sum + item.count, 0);
    return `${color} ${(start / total) * 100}% ${((start + count) / total) * 100}%`;
  });
  return (
    <figure aria-labelledby="activity-mix" className={panel}>
      <figcaption id="activity-mix" className="font-semibold">
        Activity mix
      </figcaption>
      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <div
          aria-hidden="true"
          className="bg-muted relative mx-auto grid size-28 place-items-center rounded-full"
          style={
            stops.length
              ? { backgroundImage: `conic-gradient(${stops.join(", ")})` }
              : undefined
          }
        >
          <div className="bg-card grid size-[76%] place-content-center rounded-full text-center">
            <strong className="text-2xl tabular-nums">{total}</strong>
            <span className="text-muted-foreground text-xs">actions</span>
          </div>
        </div>
        <dl className="space-y-2">
          {activity.map(({ kind, label, count, color }) => (
            <div
              key={kind}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <dt className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </dt>
              <dd className="text-muted-foreground whitespace-nowrap tabular-nums">
                {count}{" "}
                <span className="text-xs">({percentOf(count, total)}%)</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </figure>
  );
};

const ActivityTimeline = ({
  activity,
  timeline,
}: {
  activity: SessionMetrics["activity"];
  timeline: SessionMetrics["timeline"];
}) => {
  const peak = Math.max(
    1,
    ...timeline.map(({ counts }) =>
      activity.reduce((sum, { kind }) => sum + counts[kind], 0)
    )
  );
  return (
    <figure aria-labelledby="activity-timeline" className={panel}>
      <figcaption id="activity-timeline" className="font-semibold">
        Activity over time
      </figcaption>
      <p className="text-muted-foreground mt-1 text-xs">
        Elapsed time from interview start
      </p>
      <div className="mt-4 flex gap-2 sm:gap-4" aria-hidden="true">
        {timeline.map(({ start, end, counts }) => (
          <div className="min-w-0 flex-1 text-center" key={start}>
            <div className="border-border flex h-24 flex-col-reverse border-b">
              {activity.map(({ kind, color }) => (
                <span
                  key={kind}
                  style={{
                    height: `${(counts[kind] / peak) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-xs tabular-nums">
              {durationLabel(end)}
            </span>
          </div>
        ))}
      </div>
      <details className="mt-3 text-sm">
        <summary className="text-muted-foreground focus-visible:ring-ring cursor-pointer rounded-sm focus-visible:ring-2">
          View counts by time
        </summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-xs tabular-nums">
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="py-2 pr-2">
                  Elapsed
                </th>
                {activity.map(({ kind, label }) => (
                  <th scope="col" className="py-2 pr-2" key={kind}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeline.map(({ start, end, counts }) => (
                <tr className="border-b" key={start}>
                  <th
                    scope="row"
                    className="py-2 pr-2 text-left font-normal whitespace-nowrap"
                  >
                    {durationLabel(start)} – {durationLabel(end)}
                  </th>
                  {activity.map(({ kind }) => (
                    <td className="py-2 pr-2" key={kind}>
                      {counts[kind]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
};

export const SessionCharts = ({
  summary,
  eventLimitReached,
}: {
  summary: SessionMetrics;
  eventLimitReached: boolean;
}) => {
  const {
    elapsed,
    budget,
    files,
    steps,
    prompts,
    totalActions,
    activity,
    timeline,
  } = summary;
  const stats = [
    {
      title: "Elapsed time",
      value: elapsed === null ? "Did not start" : durationLabel(elapsed),
      fraction: budget && elapsed !== null ? percentOf(elapsed, budget) : null,
      detail: "of time available at start",
    },
    ...(steps
      ? [
          {
            title: "Steps visited",
            value: `${steps.count} / ${steps.total}`,
            fraction: percentOf(steps.count, steps.total),
            detail: "of interview steps",
          },
        ]
      : []),
    ...(files
      ? [
          {
            title: "Files opened or attached",
            value: `${files.count} / ${files.total}`,
            fraction:
              files.total > 0 ? percentOf(files.count, files.total) : null,
            detail: "of provided files",
          },
        ]
      : []),
    ...(prompts === null
      ? []
      : [
          {
            title: "AI prompts",
            value: prompts,
            fraction: null,
            detail: null,
          },
        ]),
  ];

  return (
    <section aria-labelledby="recorded-metrics" className="space-y-3">
      <h2
        id="recorded-metrics"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <HugeiconsIcon
          icon={DashboardSquare01Icon}
          size={19}
          aria-hidden="true"
        />
        Recorded metrics
      </h2>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {stats.map(({ title, value, fraction, detail }) => (
          <div className={panel} key={title}>
            <dt className="text-muted-foreground text-sm">{title}</dt>
            <dd className="mt-1 text-2xl leading-tight font-semibold tabular-nums">
              {value}
            </dd>
            {fraction !== null && (
              <dd className="mt-2 space-y-1">
                <div
                  className="bg-muted h-1.5 overflow-hidden rounded-full"
                  aria-hidden="true"
                >
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${fraction}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {fraction}% {detail}
                </p>
              </dd>
            )}
          </div>
        ))}
      </dl>
      {totalActions > 0 ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <ActivityMix activity={activity} total={totalActions} />
          {timeline.length > 0 && (
            <ActivityTimeline activity={activity} timeline={timeline} />
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          {activity.length > 0
            ? "No candidate actions were recorded for the selected metrics."
            : "Activity tracking was disabled for this interview."}
        </p>
      )}
      {eventLimitReached && (
        <p className="text-muted-foreground text-sm">
          Charts and the activity log show the first 1,000 recorded events.
        </p>
      )}
    </section>
  );
};
