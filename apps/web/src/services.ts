import { createAuth } from "@agentfluency/auth";
import { createDb } from "@agentfluency/db";

import { getServerEnv } from "./env.server";

export const createServices = () => {
  const env = getServerEnv();
  const db = createDb(env);

  return { db, auth: createAuth(env, db) };
};
