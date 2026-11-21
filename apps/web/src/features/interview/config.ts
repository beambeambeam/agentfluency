import { z } from "zod";

export const harnesses = {
  workspace: "Codex",
  guided: "Claude Code",
  chat: "Cursor Agent",
  grok: "Grok Build",
  gemini: "Gemini CLI",
} as const;

export const models = {
  "gpt-6.1-sol": "GPT-6.1 Sol",
  "gpt-6-luna": "GPT-6 Luna",
  "gpt-5.6-luna": "GPT-5.6 Luna",
  "claude-sonnet-5": "Claude Sonnet 5",
  "grok-4.7": "Grok 4.7",
  "composer-2.5": "Composer 2.5",
  "gemini-3.5-flash": "Gemini 3.5 Flash",
} as const;

export const sandboxes = {
  "read-only": "Read-only workspace",
  scratchpad: "Editable workspace with scratchpad",
} as const;

export const harnessSchema = z.enum([
  "workspace",
  "guided",
  "chat",
  "grok",
  "gemini",
]);
export const openAiModelSchema = z.enum([
  "gpt-6.1-sol",
  "gpt-6-luna",
  "gpt-5.6-luna",
]);
export const modelSchema = z.enum([
  ...openAiModelSchema.options,
  "claude-sonnet-5",
  "grok-4.7",
  "composer-2.5",
  "gemini-3.5-flash",
]);
export const submissionSchema = z.string().trim().min(1).max(12_000);

export const filePathSchema = z
  .string()
  .trim()
  .max(160)
  .regex(
    /^[\w-][\w. -]*(?:\/[\w-][\w. -]*)*$/u,
    "Use a relative path like data/sales.csv."
  );

export const workspaceFileSchema = z.object({
  id: z.string().min(1).max(60),
  path: filePathSchema,
  content: z.string().max(12_000),
});

export const assessmentSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    workspace: z.string().trim().min(1).max(60),
    brief: z.string().trim().min(1).max(2400),
    harness: harnessSchema,
    model: modelSchema,
    allowHarnessSelection: z.boolean(),
    allowModelSelection: z.boolean(),
    sandbox: z.enum(["read-only", "scratchpad"]),
    allowFileAttachments: z.boolean(),
    steps: z
      .array(
        z.object({
          id: z.string().min(1).max(60),
          title: z.string().trim().min(1).max(90),
          instructions: z.string().trim().min(1).max(1600),
        })
      )
      .min(1)
      .max(8),
    files: z.array(workspaceFileSchema).max(18),
  })
  .superRefine(({ files }, ctx) => {
    for (let index = 0; index < files.length; index += 1) {
      const path = files[index]?.path;
      const conflict = files
        .slice(0, index)
        .some(
          (file) =>
            file.path === path ||
            file.path.startsWith(`${path}/`) ||
            path?.startsWith(`${file.path}/`)
        );
      if (conflict) {
        ctx.addIssue({
          code: "custom",
          message: "File paths must be unique and cannot overlap a folder.",
          path: ["files", index, "path"],
        });
      }
    }
  });

export type AssessmentConfig = z.infer<typeof assessmentSchema>;
export type Harness = z.infer<typeof harnessSchema>;
export type Model = z.infer<typeof modelSchema>;
