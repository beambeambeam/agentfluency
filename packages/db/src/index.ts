import { drizzle } from "drizzle-orm/node-postgres";

import type { DatabaseConfig } from "./config";
import { relations } from "./relations";

export const createDb = (env: DatabaseConfig) =>
  drizzle({
    // Workers cannot reuse a TCP socket across requests.
    connection: { connectionString: env.DATABASE_URL, maxUses: 1 },
    relations,
  });

export type Database = ReturnType<typeof createDb>;
