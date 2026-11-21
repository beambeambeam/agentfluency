import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const assessment = pgTable("assessment", {
  id: text("id").primaryKey(),
  config: jsonb("config").notNull(),
});

export const assessmentInvite = pgTable("assessment_invite", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewerId: text("interviewer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const assessmentAttempt = pgTable(
  "assessment_attempt",
  {
    inviteId: uuid("invite_id")
      .notNull()
      .references(() => assessmentInvite.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    response: text("response"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
  },
  (table) => [primaryKey({ columns: [table.inviteId, table.candidateId] })]
);

export const assessmentSubmission = pgTable("assessment_submission", {
  candidateId: text("candidate_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  response: text("response").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
