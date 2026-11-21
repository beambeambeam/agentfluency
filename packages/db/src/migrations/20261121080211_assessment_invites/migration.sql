CREATE TABLE "assessment_attempt" (
	"invite_id" uuid,
	"candidate_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"response" text,
	"submitted_at" timestamp with time zone,
	CONSTRAINT "assessment_attempt_pkey" PRIMARY KEY("invite_id","candidate_id")
);
--> statement-breakpoint
CREATE TABLE "assessment_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"interviewer_id" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_invite_id_assessment_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "assessment_invite"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_candidate_id_user_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assessment_invite" ADD CONSTRAINT "assessment_invite_interviewer_id_user_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "user"("id") ON DELETE CASCADE;