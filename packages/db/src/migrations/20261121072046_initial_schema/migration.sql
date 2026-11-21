-- The original Better Auth schema may already exist from a manual schema push.
CREATE TABLE IF NOT EXISTS public."user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"role" text DEFAULT 'candidate' NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'candidate' NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."assessment" (
	"id" text PRIMARY KEY,
	"config" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."assessment_submission" (
	"candidate_id" text PRIMARY KEY,
	"response" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_submission_candidate_id_user_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES public."user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES public."user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES public."user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON public."account" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON public."session" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON public."verification" ("identifier");
