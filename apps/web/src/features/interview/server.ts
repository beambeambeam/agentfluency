import {
  beginAttempt,
  candidateInvites,
  createInvite,
  latestInvite,
  submitAttempt,
  submittedAttempts,
} from "@agentfluency/db/assessment-invites";
import {
  listDemoSubmissions,
  readDemoSubmission,
  writeAssessmentDraft,
} from "@agentfluency/db/demo-assessment";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerEnv } from "@/env.server";
import { authMiddleware } from "@/middleware/auth";
import { createServices } from "@/services";

import {
  getAssignedState,
  loadDraft,
  requireAssignedAssessment,
} from "./assessment.server";
import { assessmentSchema, submissionSchema } from "./config";

export const getInterview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = context.session?.user;
    if (!profile) {
      throw new Error("Sign in to open the interview.");
    }
    const { db } = createServices();
    if (profile.role === "interviewer") {
      const [config, invite, submissions, legacySubmissions] =
        await Promise.all([
          loadDraft(profile.id),
          latestInvite(db, profile.id),
          submittedAttempts(db, profile.id),
          listDemoSubmissions(db),
        ]);
      return {
        role: "interviewer" as const,
        config,
        invite,
        submissions: [
          ...submissions.flatMap((row) =>
            row.response && row.submittedAt
              ? [
                  {
                    ...row,
                    response: row.response,
                    submittedAt: row.submittedAt,
                  },
                ]
              : []
          ),
          ...legacySubmissions.map((row) => ({
            ...row,
            inviteId: "legacy",
            title: "Legacy shared demo",
          })),
        ],
      };
    }
    const submission = await readDemoSubmission(db, profile.id);
    return {
      role: "candidate" as const,
      invites: await candidateInvites(db, profile.id),
      legacySubmission: submission?.response,
    };
  });

export const updateInterview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(assessmentSchema)
  .handler(async ({ context, data }) => {
    if (context.session?.user.role !== "interviewer") {
      throw new Error("Only interviewers can change the assessment.");
    }
    const { db } = createServices();
    await writeAssessmentDraft(db, context.session.user.id, data);
  });

export const generateInvitation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(assessmentSchema)
  .handler(({ context, data }) => {
    if (context.session?.user.role !== "interviewer") {
      throw new Error("Only interviewers can generate invitations.");
    }
    return createInvite(createServices().db, context.session.user.id, data);
  });

const inviteInput = z.object({ inviteId: z.uuid() });

export const getInvitation = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(inviteInput)
  .handler(async ({ context, data }) => {
    if (context.session?.user.role !== "candidate") {
      return { stage: "candidate-only" as const };
    }
    const state = await getAssignedState(
      data.inviteId,
      context.session.user.id
    );
    if (state.stage !== "assessment") {
      return state;
    }
    const fallbackMode = import.meta.env.DEV ? "demo" : "offline";
    return {
      ...state,
      assistantMode: getServerEnv().OPENAI_API_KEY ? "live" : fallbackMode,
    };
  });

export const startWarmup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(inviteInput)
  .handler(async ({ context, data }) => {
    if (context.session?.user.role !== "candidate") {
      throw new Error("Use a candidate account to start the warmup.");
    }
    await beginAttempt(
      createServices().db,
      data.inviteId,
      context.session.user.id
    );
  });

export const submitInterview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(inviteInput.extend({ response: submissionSchema }))
  .handler(async ({ context, data }) => {
    const profile = context.session?.user;
    if (profile?.role !== "candidate") {
      throw new Error("Only candidates can submit an interview response.");
    }
    const { db } = createServices();
    await requireAssignedAssessment(data.inviteId, profile.id);
    await submitAttempt(db, data.inviteId, profile.id, data.response);
  });

export type InterviewData = Awaited<ReturnType<typeof getInterview>>;
export type InvitationData = Awaited<ReturnType<typeof getInvitation>>;
