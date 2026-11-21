import { readInvitation } from "@agentfluency/db/assessment-invites";
import { readDemoAssessment } from "@agentfluency/db/demo-assessment";

import { createServices } from "@/services";

import { assessmentSchema } from "./config";
import { demoAssessment } from "./demo-config";
import { warmupRemaining } from "./warmup";

export const loadDraft = async (interviewerId: string) => {
  const { db } = createServices();
  const record =
    (await readDemoAssessment(db, `draft:${interviewerId}`)) ??
    (await readDemoAssessment(db));
  return record ? assessmentSchema.parse(record) : demoAssessment;
};

export const getAssignedState = async (
  inviteId: string,
  candidateId: string
) => {
  const record = await readInvitation(
    createServices().db,
    inviteId,
    candidateId
  );
  if (!record) {
    return { stage: "unavailable" as const };
  }
  if (!record.startedAt) {
    return { stage: "join" as const, title: record.title };
  }
  const remaining = warmupRemaining(record.startedAt);
  if (remaining > 0) {
    return { stage: "warmup" as const, title: record.title, remaining };
  }
  return {
    stage: "assessment" as const,
    config: assessmentSchema.parse(record.config),
    submission: record.response ?? "",
  };
};

export const requireAssignedAssessment = async (
  inviteId: string,
  candidateId: string
) => {
  const state = await getAssignedState(inviteId, candidateId);
  if (state.stage !== "assessment") {
    throw new Error("Open your invitation and complete the warmup first.");
  }
  return state.config;
};
