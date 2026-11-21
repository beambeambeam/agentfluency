import { env } from "node:process";

import { z } from "zod";

import { ENV } from "./env";

const workerEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.string().min(1),
});

export const getServerEnv = () =>
  import.meta.env?.PROD ? workerEnvSchema.parse(env) : ENV;
