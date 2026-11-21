import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const interviewSession = pgTable(
  "interview_session",
  {
    id: text("id").primaryKey(),
    interviewerId: text("interviewer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id").references(() => user.id, {
      onDelete: "set null",
    }),
    candidateEmail: text("candidate_email").notNull(),
    config: jsonb("config").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    containerId: text("container_id").unique(),
    response: text("response"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("interview_session_owner_idx").on(
      table.interviewerId,
      table.scheduledAt
    ),
  ]
);

export const interviewEvent = pgTable(
  "interview_event",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => interviewSession.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    detail: text("detail"),
    amount: integer("amount"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("interview_event_session_idx").on(table.sessionId, table.createdAt),
  ]
);
