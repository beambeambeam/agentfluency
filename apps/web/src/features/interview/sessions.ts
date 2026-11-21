import { readDemoAssessment } from "@agentfluency/db/demo-assessment";
import {
  addEvent,
  insertSession,
  listEvents,
  listOwnedSessions,
  readSession,
  startSession,
  submitSession,
} from "@agentfluency/db/interview-sessions";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { getServerEnv } from "@/env.server";
import { authMiddleware } from "@/middleware/auth";
import { createServices } from "@/services";

import { assessmentSchema, submissionSchema } from "./config";
import { createInvite, verifyInvite } from "./invite.server";
import { provisionSandbox, releaseSandbox } from "./sandbox.server";
import {
  activeCandidateSession,
  canJoinSession,
  sessionStatus,
} from "./session-access.server";
import {
  createSessionSchema,
  inviteSchema,
  sessionConfigSchema,
  sessionIdSchema,
} from "./session-config";

const privateResponse = () => {
  setResponseHeader("Cache-Control", "private, no-store");
  setResponseHeader("Referrer-Policy", "no-referrer");
};

export const createInterviewSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(createSessionSchema)
  .handler(async ({ context, data }) => {
    const profile = context.session?.user;
    if (profile?.role !== "interviewer") {
      throw new Error("Interviewer access is required.");
    }
    const { candidateEmail, duration, scheduledAt, ...config } = data;
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + duration * 60_000);
    if (end.getTime() <= Date.now()) {
      throw new Error("Choose an interview that has not ended.");
    }

    const { db } = createServices();
    const id = crypto.randomUUID();
    await insertSession(
      db,
      {
        id,
        interviewerId: profile.id,
        candidateEmail,
        config,
        scheduledAt: start,
        endsAt: end,
      },
      config.assessment
    );
    return { id, invite: await createInvite(id) };
  });

export const getInterviewerDraft = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    privateResponse();
    const profile = context.session?.user;
    if (profile?.role !== "interviewer") {
      throw new Error("Interviewer access is required.");
    }
    const { db } = createServices();
    return (
      assessmentSchema.safeParse(
        await readDemoAssessment(db, `draft:${profile.id}`)
      ).data ?? null
    );
  });

export const getInterviewerSessions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    privateResponse();
    const profile = context.session?.user;
    if (profile?.role !== "interviewer") {
      throw new Error("Interviewer access is required.");
    }
    const { db } = createServices();
    const records = await listOwnedSessions(db, profile.id);
    return Promise.all(
      records.map(async (session) => ({
        id: session.id,
        invite: await createInvite(session.id),
        title: sessionConfigSchema.parse(session.config).assessment.title,
        candidateEmail: session.candidateEmail,
        scheduledAt: session.scheduledAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        status: sessionStatus(session),
      }))
    );
  });

export const getSessionReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(sessionIdSchema)
  .handler(async ({ context, data }) => {
    privateResponse();
    const profile = context.session?.user;
    if (profile?.role !== "interviewer") {
      return null;
    }
    const { db } = createServices();
    const record = await readSession(db, data);
    if (record?.interviewerId !== profile.id) {
      return null;
    }
    const status = sessionStatus(record);
    const config = sessionConfigSchema.parse(record.config);
    const finished = status === "submitted" || status === "expired";
    const events = finished ? await listEvents(db, data) : [];
    const showPromptCount =
      config.metrics.includes("prompts") ||
      config.metrics.includes("transcript");
    return {
      status,
      title: config.assessment.title,
      email: record.candidateEmail,
      scheduledAt: record.scheduledAt.toISOString(),
      startedAt: record.startedAt?.toISOString(),
      endedAt: (record.submittedAt ?? record.endsAt).toISOString(),
      response: finished ? record.response : null,
      metrics: config.metrics,
      events: events
        .filter(({ kind }) => kind !== "prompt" || showPromptCount)
        .map(({ id, kind, detail, createdAt }) => ({
          id,
          kind,
          detail,
          time: createdAt.toISOString(),
        })),
    };
  });

export const getCandidateInvite = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(inviteSchema)
  .handler(async ({ context, data }) => {
    privateResponse();
    const profile = context.session?.user;
    const id = await verifyInvite(data);
    if (!profile || !id) {
      return null;
    }
    const { db } = createServices();
    const session = await readSession(db, id);
    if (!session || !canJoinSession(session, profile)) {
      return null;
    }
    const config = sessionConfigSchema.parse(session.config);
    const status = sessionStatus(session);
    return {
      id,
      status,
      title: config.assessment.title,
      scheduledAt: session.scheduledAt.toISOString(),
      endsAt: session.endsAt.toISOString(),
      metrics: config.metrics,
      assessment: status === "active" ? config.assessment : undefined,
    };
  });

export const beginInterviewSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(inviteSchema)
  .handler(async ({ context, data }) => {
    const profile = context.session?.user;
    const id = await verifyInvite(data);
    if (!profile || !id) {
      throw new Error("This invitation is unavailable.");
    }

    const { db } = createServices();
    const apiKey = getServerEnv().OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "The interviewer needs to configure the live OpenAI workspace."
      );
    }
    let allocated: string | undefined;
    try {
      await startSession(db, id, async (session) => {
        if (!session || !canJoinSession(session, profile)) {
          throw new Error("This invitation is unavailable.");
        }
        const status = sessionStatus(session);
        if (status === "active") {
          return;
        }
        if (status !== "ready") {
          throw new Error("This interview is outside its scheduled window.");
        }
        const config = sessionConfigSchema.parse(session.config);
        allocated = await provisionSandbox(
          apiKey,
          id,
          config.assessment.files,
          Math.ceil((session.endsAt.getTime() - Date.now()) / 60_000)
        );
        if (sessionStatus(session) !== "ready") {
          throw new Error("The interview window has ended.");
        }
        return { candidateId: profile.id, containerId: allocated };
      });
    } catch (error) {
      if (allocated) {
        await releaseSandbox(apiKey, allocated).catch(() => null);
      }
      throw error;
    }
  });

export const submitInterviewSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: sessionIdSchema, response: submissionSchema }))
  .handler(async ({ context, data }) => {
    const candidate = context.session?.user;
    if (candidate?.role !== "candidate") {
      throw new Error("Candidate access is required.");
    }
    const { db } = createServices();
    const submitted = await submitSession(
      db,
      data.id,
      candidate.id,
      data.response
    );
    if (!submitted) {
      throw new Error("The interview is no longer open for submission.");
    }
    const apiKey = getServerEnv().OPENAI_API_KEY;
    if (apiKey && submitted.containerId) {
      await releaseSandbox(apiKey, submitted.containerId).catch(() => null);
    }
  });

export const recordInterviewActivity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: sessionIdSchema,
      kind: z.enum(["step", "file", "attachment"]),
      itemId: z.string().max(60),
    })
  )
  .handler(async ({ context, data }) => {
    const candidate = context.session?.user;
    if (candidate?.role !== "candidate") {
      return;
    }
    const active = await activeCandidateSession(data.id, candidate.id);
    if (!active) {
      return;
    }
    const { assessment, metrics } = active.config;
    const detail =
      data.kind === "step"
        ? metrics.includes("steps") &&
          assessment.steps.find((step) => step.id === data.itemId)?.title
        : metrics.includes("files") &&
          assessment.files.find((file) => file.id === data.itemId)?.path;
    if (detail) {
      await addEvent(active.db, data.id, { kind: data.kind, detail });
    }
  });
