import { readSession } from "@agentfluency/db/interview-sessions";
import type { SessionRecord } from "@agentfluency/db/interview-sessions";

import { createServices } from "@/services";

import { sessionConfigSchema } from "./session-config";

export const canJoinSession = (
  session: SessionRecord | undefined,
  profile: { id: string; email: string; role?: string }
) =>
  session &&
  profile.role === "candidate" &&
  session.candidateEmail === profile.email.toLowerCase() &&
  (!session.candidateId || session.candidateId === profile.id);

export const sessionStatus = (session: SessionRecord, now = Date.now()) => {
  if (session.submittedAt) {
    return "submitted";
  }
  if (session.endsAt.getTime() <= now) {
    return "expired";
  }
  if (session.scheduledAt.getTime() > now) {
    return "scheduled";
  }
  return session.startedAt ? "active" : "ready";
};

export const activeCandidateSession = async (
  id: string,
  candidateId: string
) => {
  const { db } = createServices();
  const session = await readSession(db, id);
  if (
    !session?.containerId ||
    session.candidateId !== candidateId ||
    sessionStatus(session) !== "active"
  ) {
    return;
  }

  return {
    db,
    session,
    containerId: session.containerId,
    config: sessionConfigSchema.parse(session.config),
  };
};
