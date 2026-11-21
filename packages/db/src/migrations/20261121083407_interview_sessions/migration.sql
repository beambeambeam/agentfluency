CREATE TABLE "interview_event" (
	"id" text PRIMARY KEY,
	"session_id" text NOT NULL,
	"kind" text NOT NULL,
	"detail" text,
	"amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_session" (
	"id" text PRIMARY KEY,
	"interviewer_id" text NOT NULL,
	"candidate_id" text,
	"candidate_email" text NOT NULL,
	"config" jsonb NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"container_id" text UNIQUE,
	"response" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "interview_event_session_idx" ON "interview_event" ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "interview_session_owner_idx" ON "interview_session" ("interviewer_id","scheduled_at");--> statement-breakpoint
ALTER TABLE "interview_event" ADD CONSTRAINT "interview_event_session_id_interview_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_session"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "interview_session" ADD CONSTRAINT "interview_session_interviewer_id_user_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "interview_session" ADD CONSTRAINT "interview_session_candidate_id_user_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "user"("id") ON DELETE SET NULL;