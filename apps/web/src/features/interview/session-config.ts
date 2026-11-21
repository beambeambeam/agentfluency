import { z } from "zod";

import { assessmentSchema, openAiModelSchema } from "./config";

export const metricLabels = {
  steps: "Steps visited",
  files: "Files opened or attached",
  prompts: "Prompt count",
  transcript: "Prompt and response transcript",
} as const;

export const selectedMetric = z.enum([
  "steps",
  "files",
  "prompts",
  "transcript",
]);

export const sessionConfigSchema = z
  .object({
    assessment: assessmentSchema,
    metrics: z.array(selectedMetric).max(4),
    useCodeInterpreter: z.boolean(),
  })
  .refine(
    ({ assessment }) =>
      assessment.harness === "workspace" &&
      !assessment.allowHarnessSelection &&
      !assessment.allowModelSelection &&
      openAiModelSchema.safeParse(assessment.model).success,
    {
      path: ["assessment", "model"],
      message: "Choose a supported OpenAI model for the Codex workspace.",
    }
  )
  .superRefine(({ assessment }, ctx) => {
    for (const [index, { path }] of assessment.files.entries()) {
      if (path.length > 155 || (path.split("/").at(-1)?.length ?? 0) > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["assessment", "files", index, "path"],
          message:
            "Use up to 155 characters for the path and 100 for the filename.",
        });
      }
    }
  });

export const createSessionSchema = sessionConfigSchema.safeExtend({
  candidateEmail: z.email().trim().toLowerCase(),
  scheduledAt: z.iso.datetime(),
  duration: z.union([z.literal(30), z.literal(60)]),
});

export const sessionIdSchema = z.uuid();
export const inviteSchema = z.string().regex(/^[\da-f-]{36}\.[\da-f]{64}$/u);
export type SessionConfig = z.infer<typeof sessionConfigSchema>;
export type SessionMetric = z.infer<typeof selectedMetric>;
