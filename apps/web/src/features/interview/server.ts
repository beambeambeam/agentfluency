import {
  listDemoSubmissions,
  readDemoSubmission,
  saveDemoSubmission,
  writeDemoAssessment,
} from "@agentfluency/db/demo-assessment";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerEnv } from "@/env.server";
import { authMiddleware } from "@/middleware/auth";
import { createServices } from "@/services";

import { loadAssessment } from "./assessment.server";
import { assessmentSchema, submissionSchema } from "./config";

export const getInterview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = context.session?.user;
    if (!profile) {
      throw new Error("Sign in to open the interview.");
    }
    const { db } = createServices();
    const config = await loadAssessment();
    if (profile.role === "interviewer") {
      return {
        role: "interviewer" as const,
        config,
        submissions: await listDemoSubmissions(db),
      };
    }
    const submission = await readDemoSubmission(db, profile.id);
    const fallbackMode = import.meta.env.DEV ? "demo" : "offline";
    const assistantMode = getServerEnv().OPENAI_API_KEY ? "live" : fallbackMode;
    return {
      role: "candidate" as const,
      config,
      assistantMode,
      submission: submission?.response ?? "",
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
    await writeDemoAssessment(db, data);
  });

export const submitInterview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ response: submissionSchema }))
  .handler(async ({ context, data }) => {
    const profile = context.session?.user;
    if (profile?.role !== "candidate") {
      throw new Error("Only candidates can submit an interview response.");
    }
    const { db } = createServices();
    await saveDemoSubmission(db, profile.id, data.response);
  });

export type InterviewData = Awaited<ReturnType<typeof getInterview>>;
