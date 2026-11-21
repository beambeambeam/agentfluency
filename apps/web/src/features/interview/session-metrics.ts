import type { SessionMetric } from "./session-config";

export const activitySeries = [
  { kind: "step", metric: "steps", label: "Step visits", color: "#818cf8" },
  { kind: "file", metric: "files", label: "File opens", color: "#06b6d4" },
  {
    kind: "attachment",
    metric: "files",
    label: "File attachments",
    color: "#f59e0b",
  },
  { kind: "prompt", metric: "prompts", label: "AI prompts", color: "#34d399" },
] as const;

export const reportEventKinds = (metrics: SessionMetric[]): string[] => {
  const transcript = metrics.includes("transcript");
  const kinds: string[] = activitySeries
    .filter(
      ({ kind, metric }) =>
        metrics.includes(metric) || (kind === "prompt" && transcript)
    )
    .map(({ kind }) => kind);
  return transcript ? [...kinds, "reply"] : kinds;
};

export const percentOf = (value: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

interface Activity {
  kind: string;
  itemId: string | null;
  detail: string | null;
  createdAt: Date;
}

const elapsedSeconds = (end: Date, start: Date) =>
  Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));

const countActions = (events: Activity[]) => ({
  step: events.filter(({ kind }) => kind === "step").length,
  file: events.filter(({ kind }) => kind === "file").length,
  attachment: events.filter(({ kind }) => kind === "attachment").length,
  prompt: events.filter(({ kind }) => kind === "prompt").length,
});

const countCoverage = (
  actions: Activity[],
  steps: { id: string; title: string }[],
  providedFiles: string[]
) => {
  const stepsById = new Map(steps.map(({ id, title }) => [id, title]));
  const visitedSteps = new Map<string, string>();
  const legacyTitles = new Set<string>();
  const touchedFiles = new Set<string>();
  const provided = new Set(providedFiles);
  for (const { kind, itemId, detail } of actions) {
    if (kind === "step") {
      const title = itemId && stepsById.get(itemId);
      if (itemId && title) {
        visitedSteps.set(itemId, title);
      } else if (detail) {
        legacyTitles.add(detail);
      }
    }
    if (
      (kind === "file" || kind === "attachment") &&
      detail &&
      provided.has(detail)
    ) {
      touchedFiles.add(detail);
    }
  }
  const knownTitles = new Set(visitedSteps.values());
  for (const { id, title } of steps) {
    if (!knownTitles.has(title) && legacyTitles.has(title)) {
      visitedSteps.set(id, title);
      knownTitles.add(title);
    }
  }

  return {
    steps: { count: visitedSteps.size, total: steps.length },
    files: { count: touchedFiles.size, total: providedFiles.length },
  };
};

const buildTimeline = (
  actions: Activity[],
  startTime: Date,
  elapsed: number
) => {
  const bucketSize = Math.max(1, Math.ceil(elapsed / 6));
  const buckets = Array.from(
    { length: Math.max(1, Math.ceil(elapsed / bucketSize)) },
    (_, index) => ({
      start: index * bucketSize,
      end: Math.min((index + 1) * bucketSize, elapsed),
      events: [] as Activity[],
    })
  );
  for (const event of actions) {
    const index = Math.min(
      Math.floor(elapsedSeconds(event.createdAt, startTime) / bucketSize),
      buckets.length - 1
    );
    buckets[index]?.events.push(event);
  }
  return buckets.map(({ start, end, events }) => ({
    start,
    end,
    counts: countActions(events),
  }));
};

export const summarizeSession = ({
  events,
  metrics,
  steps,
  providedFiles,
  startedAt,
  endedAt,
  deadline,
}: {
  events: Activity[];
  metrics: SessionMetric[];
  steps: { id: string; title: string }[];
  providedFiles: string[];
  startedAt: Date | null;
  endedAt: Date;
  deadline: Date;
}) => {
  const enabled = reportEventKinds(metrics);
  const actions = events.filter(
    ({ kind }) => kind !== "reply" && enabled.includes(kind)
  );
  const coverage = countCoverage(actions, steps, providedFiles);
  const counts = countActions(actions);
  const elapsed = startedAt ? elapsedSeconds(endedAt, startedAt) : null;
  const budget = startedAt ? elapsedSeconds(deadline, startedAt) : null;
  return {
    elapsed,
    budget,
    steps: metrics.includes("steps") ? coverage.steps : null,
    files: metrics.includes("files") ? coverage.files : null,
    prompts: enabled.includes("prompt") ? counts.prompt : null,
    totalActions: actions.length,
    activity: activitySeries
      .filter(({ kind }) => enabled.includes(kind))
      .map((series) => ({ ...series, count: counts[series.kind] })),
    timeline:
      startedAt && elapsed !== null
        ? buildTimeline(actions, startedAt, elapsed)
        : [],
  };
};

export type SessionMetrics = ReturnType<typeof summarizeSession>;
