import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { writeAssessmentDraft } from "./demo-assessment";
import type { Database } from "./index";
import {
  assessmentAttempt as attempt,
  assessmentInvite as invite,
} from "./schema/assessment";
import { user } from "./schema/auth";

const title = sql<string>`${invite.config}->>'title'`;
const candidateAttempt = (inviteId: string, candidateId: string) =>
  and(eq(attempt.inviteId, inviteId), eq(attempt.candidateId, candidateId));

export const createInvite = (
  db: Database,
  interviewerId: string,
  config: unknown
) =>
  db.transaction(async (tx) => {
    await writeAssessmentDraft(tx, interviewerId, config);
    const [record] = await tx
      .insert(invite)
      .values({ interviewerId, config })
      .returning({ id: invite.id });
    if (!record) {
      throw new Error("Invitation creation failed.");
    }
    return record.id;
  });

export const latestInvite = async (db: Database, interviewerId: string) => {
  const [record] = await db
    .select({ id: invite.id, title })
    .from(invite)
    .where(eq(invite.interviewerId, interviewerId))
    .orderBy(desc(invite.createdAt))
    .limit(1);
  return record ?? null;
};

export const candidateInvites = (db: Database, candidateId: string) =>
  db
    .select({ id: invite.id, title })
    .from(attempt)
    .innerJoin(invite, eq(invite.id, attempt.inviteId))
    .where(eq(attempt.candidateId, candidateId))
    .orderBy(desc(attempt.startedAt));

export const readInvitation = async (
  db: Database,
  inviteId: string,
  candidateId: string
) => {
  const [record] = await db
    .select({
      title,
      config: invite.config,
      startedAt: attempt.startedAt,
      response: attempt.response,
    })
    .from(invite)
    .leftJoin(attempt, candidateAttempt(inviteId, candidateId))
    .where(eq(invite.id, inviteId));
  return record;
};

export const beginAttempt = async (
  db: Database,
  inviteId: string,
  candidateId: string
) => {
  await db
    .insert(attempt)
    .values({ inviteId, candidateId })
    .onConflictDoNothing();
};

export const submitAttempt = (
  db: Database,
  inviteId: string,
  candidateId: string,
  response: string
) =>
  db
    .update(attempt)
    .set({ response, submittedAt: new Date() })
    .where(candidateAttempt(inviteId, candidateId));

export const submittedAttempts = (db: Database, interviewerId: string) =>
  db
    .select({
      inviteId: invite.id,
      title,
      candidateId: user.id,
      candidateName: user.name,
      response: attempt.response,
      submittedAt: attempt.submittedAt,
    })
    .from(invite)
    .innerJoin(attempt, eq(invite.id, attempt.inviteId))
    .innerJoin(user, eq(user.id, attempt.candidateId))
    .where(
      and(
        eq(invite.interviewerId, interviewerId),
        isNotNull(attempt.submittedAt)
      )
    )
    .orderBy(desc(attempt.submittedAt));
