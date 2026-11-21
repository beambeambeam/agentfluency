import { createAuth } from "@agentfluency/auth";
import { createDb } from "@agentfluency/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
