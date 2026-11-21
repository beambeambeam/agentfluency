ALTER TABLE "interview_event" ADD COLUMN "item_id" text;--> statement-breakpoint
ALTER TABLE "interview_session" ADD COLUMN "evaluation" jsonb;