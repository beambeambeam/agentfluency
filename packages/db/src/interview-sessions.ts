import { and, asc, count, desc, eq, gt, isNotNull, isNull } from "drizzle-orm";

import { writeAssessmentDraft } from "./demo-assessment";
import type { Database } from "./index";
import { interviewEvent, interviewSession } from "./schema/interview";

export type SessionRecord = typeof interviewSession.$inferSelect;
export type SessionEvent = Omit<
  typeof interviewEvent.$inferInsert,
  "id" | "sessionId"
>;

export const insertSession = (
  db: Database,
  values: typeof interviewSession.$inferInsert,
  draft: unknown
) =>
  db.transaction(async (tx) => {
    await tx.insert(interviewSession).values(values);
    await writeAssessmentDraft(tx, values.interviewerId, draft);
  });

export const readSession = async (db: Database, id: string) => {
  const [session] = await db
    .select()
    .from(interviewSession)
    .where(eq(interviewSession.id, id));
  return session;
};

export const listOwnedSessions = (db: Database, owner: string) =>
  db
    .select()
    .from(interviewSession)
    .where(eq(interviewSession.interviewerId, owner))
    .orderBy(desc(interviewSession.scheduledAt))
    .limit(50);

export const listEvents = (db: Database, id: string) =>
  db
    .select()
    .from(interviewEvent)
    .where(eq(interviewEvent.sessionId, id))
    .orderBy(asc(interviewEvent.createdAt), asc(interviewEvent.id))
    .limit(1000);

export const addEvent = (
  db: Database,
  sessionId: string,
  event: SessionEvent
) =>
  db
    .insert(interviewEvent)
    .values({ id: crypto.randomUUID(), sessionId, ...event });

export const reservePrompt = (
  db: Database,
  sessionId: string,
  candidateId: string,
  runId: string,
  detail: string | null
) =>
  db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(interviewSession)
      .where(
        and(
          eq(interviewSession.id, sessionId),
          eq(interviewSession.candidateId, candidateId)
        )
      )
      .for("update");
    if (
      !session?.startedAt ||
      session.submittedAt ||
      session.endsAt.getTime() <= Date.now()
    ) {
      return false;
    }
    const [usage] = await tx
      .select({ total: count() })
      .from(interviewEvent)
      .where(
        and(
          eq(interviewEvent.sessionId, sessionId),
          eq(interviewEvent.kind, "prompt")
        )
      );
    if ((usage?.total ?? 0) >= 50) {
      return false;
    }
    const [event] = await tx
      .insert(interviewEvent)
      .values({
        id: `${sessionId}:${runId}`,
        sessionId,
        kind: "prompt",
        detail,
      })
      .onConflictDoNothing()
      .returning({ id: interviewEvent.id });
    return Boolean(event);
  });

export const startSession = (
  db: Database,
  id: string,
  prepare: (
    session: SessionRecord | undefined
  ) => Promise<{ candidateId: string; containerId: string } | undefined>
) =>
  db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(interviewSession)
      .where(eq(interviewSession.id, id))
      .for("update");
    const start = await prepare(session);
    if (!start) {
      return;
    }

    await tx
      .update(interviewSession)
      .set({ ...start, startedAt: new Date() })
      .where(eq(interviewSession.id, id));
  });

export const submitSession = async (
  db: Database,
  id: string,
  candidateId: string,
  response: string
) => {
  const [session] = await db
    .update(interviewSession)
    .set({ response, submittedAt: new Date() })
    .where(
      and(
        eq(interviewSession.id, id),
        eq(interviewSession.candidateId, candidateId),
        isNotNull(interviewSession.startedAt),
        isNull(interviewSession.submittedAt),
        gt(interviewSession.endsAt, new Date())
      )
    )
    .returning({ containerId: interviewSession.containerId });
  return session;
};
