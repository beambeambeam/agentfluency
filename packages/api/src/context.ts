import type { Session } from "@agentfluency/auth";
import type { Database } from "@agentfluency/db";

export type Context = {
  session: Session | null;
  db: Database;
};
