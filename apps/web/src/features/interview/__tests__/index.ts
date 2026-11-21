import { expect, test } from "vite-plus/test";

import { evaluationPercent, ratingsSchema } from "../evaluation";
import { reportEventKinds, summarizeSession } from "../session-metrics";
import {
  applyWorkspaceEdit,
  readWorkspace,
  workspaceChanges,
} from "../workspace-state";

test("classifies live edits against the original interview files", () => {
  const starter = [
    { id: "one", path: "data/sales.csv", content: "100" },
    { id: "two", path: "notes.txt", content: "Original notes" },
  ];
  const snapshot = readWorkspace(null, starter);
  const updated = applyWorkspaceEdit(
    snapshot,
    { path: "data/sales.csv", content: "80" },
    "new"
  );
  const added = applyWorkspaceEdit(
    updated,
    { path: "output/report.md", content: "Result" },
    "three"
  );
  const final = applyWorkspaceEdit(
    added,
    { path: "notes.txt", content: null },
    "unused"
  );

  expect(final.revision).toBe(3);
  expect(final.files[0]).toEqual({
    id: "one",
    path: "data/sales.csv",
    content: "80",
  });
  expect(
    workspaceChanges(starter, final.files).map(({ path, change }) => [
      path,
      change,
    ])
  ).toEqual([
    ["data/sales.csv", "modified"],
    ["output/report.md", "added"],
    ["notes.txt", "deleted"],
  ]);
  expect(
    applyWorkspaceEdit(
      final,
      { path: "output/report.md", content: "Result" },
      "four"
    )
  ).toBe(final);
  expect(snapshot.files[0]?.content).toBe("100");
});

test("rejects a path outside the workspace and paths that overlap folders", () => {
  const snapshot = readWorkspace(null, [
    { id: "one", path: "data/sales.csv", content: "100" },
  ]);
  expect(() =>
    applyWorkspaceEdit(
      snapshot,
      { path: "../secrets.txt", content: "x" },
      "new"
    )
  ).toThrow("Use a relative path");
  expect(() =>
    applyWorkspaceEdit(snapshot, { path: "data", content: "x" }, "new")
  ).toThrow("A file and a folder cannot share the same path.");
});

test("uses configured metrics and counts repeated opens once for coverage", () => {
  const start = new Date("2026-11-21T09:30:00Z");
  const summarize = (offset: number) =>
    new Date(start.getTime() + offset * 1000);
  const report = summarizeSession({
    metrics: ["steps", "files"],
    steps: [
      { id: "one", title: "Inspect" },
      { id: "two", title: "Inspect" },
    ],
    providedFiles: ["data.csv", "readme.md"],
    startedAt: start,
    endedAt: summarize(60),
    deadline: summarize(1800),
    events: [
      { kind: "step", itemId: "one", detail: "Inspect", createdAt: start },
      { kind: "step", itemId: "two", detail: "Inspect", createdAt: start },
      { kind: "file", itemId: null, detail: "data.csv", createdAt: start },
      {
        kind: "attachment",
        itemId: null,
        detail: "data.csv",
        createdAt: summarize(22),
      },
      {
        kind: "file",
        itemId: null,
        detail: "generated.md",
        createdAt: summarize(24),
      },
      {
        kind: "prompt",
        itemId: null,
        detail: "hidden text",
        createdAt: summarize(25),
      },
    ],
  });
  expect(report.steps).toEqual({ count: 2, total: 2 });
  expect(report.files).toEqual({ count: 1, total: 2 });
  expect(report.prompts).toBeNull();
  expect(report.totalActions).toBe(5);
  expect(report.timeline[2]?.counts).toEqual({
    step: 0,
    file: 1,
    attachment: 1,
    prompt: 0,
  });
  expect(reportEventKinds(["prompts"])).toEqual(["prompt"]);
  expect(reportEventKinds(["transcript"])).toEqual(["prompt", "reply"]);
});

test("calculates the saved score from only the four equally weighted ratings", () => {
  const ratings = {
    direction: 4,
    verification: 3,
    iteration: 2,
    deliverable: 3,
  };
  expect(evaluationPercent(ratings)).toBe(75);
  expect(ratingsSchema.safeParse({ ...ratings, iteration: 5 }).success).toBe(
    false
  );
});
