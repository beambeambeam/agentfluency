import type { Session } from "@agentfluency/auth";
import type { Database } from "@agentfluency/db";

export interface Context {
  session: Session | null;
  db: Database;
}
