import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const assessment = pgTable("assessment", {
  id: text("id").primaryKey(),
  config: jsonb("config").notNull(),
});

export const assessmentSubmission = pgTable("assessment_submission", {
  candidateId: text("candidate_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  response: text("response").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
