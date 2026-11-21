import { readInvitation } from "@agentfluency/db/assessment-invites";
import { afterEach, expect, test, vi } from "vite-plus/test";

import {
  getAssignedState,
  requireAssignedAssessment,
} from "../assessment.server";
import { demoAssessment } from "../demo-config";
import { warmupRemaining } from "../warmup";

vi.mock("@/services", () => ({ createServices: () => ({ db: {} }) }));
vi.mock("@agentfluency/db/assessment-invites", () => ({
  readInvitation: vi.fn<typeof readInvitation>(),
}));
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

test("a candidate waits three full minutes from the saved warmup start", () => {
  const start = new Date("2026-11-21T08:00:00Z");
  expect(warmupRemaining(start, Date.parse("2026-11-21T08:00:00Z"))).toBe(
    180_000
  );
  expect(warmupRemaining(start, Date.parse("2026-11-21T08:02:59.999Z"))).toBe(
    1
  );
  expect(warmupRemaining(start, Date.parse("2026-11-21T08:03:00Z"))).toBe(0);
});

test("workspace, chat, and submission access wait for this candidate's saved attempt", async () => {
  const record = {
    config: demoAssessment,
    title: demoAssessment.title,
    startedAt: null,
    response: null,
  };
  const inviteId = "invite";
  const candidateId = "candidate";
  vi.mocked(readInvitation).mockResolvedValue(record);
  expect(await getAssignedState(inviteId, candidateId)).toEqual({
    stage: "join",
    title: record.title,
  });
  await expect(
    requireAssignedAssessment(inviteId, candidateId)
  ).rejects.toThrow("warmup");

  const start = new Date("2026-11-21T10:00:00Z");
  vi.mocked(readInvitation).mockResolvedValue({ ...record, startedAt: start });
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-21T10:02:59Z"));
  expect(await getAssignedState(inviteId, candidateId)).toEqual({
    stage: "warmup",
    title: record.title,
    remaining: 1000,
  });
  await expect(
    requireAssignedAssessment(inviteId, candidateId)
  ).rejects.toThrow("warmup");

  vi.advanceTimersByTime(1000);
  await expect(
    requireAssignedAssessment(inviteId, candidateId)
  ).resolves.toEqual(demoAssessment);
  expect(readInvitation).toHaveBeenLastCalledWith(
    expect.anything(),
    inviteId,
    candidateId
  );
});
