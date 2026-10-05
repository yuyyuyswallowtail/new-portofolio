CREATE TABLE "auto_generate_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"interval_minutes" integer DEFAULT 480 NOT NULL,
	"auto_publish" boolean DEFAULT false NOT NULL,
	"test_runs_left" integer DEFAULT 0 NOT NULL,
	"next_run_at" timestamp,
	"last_run_at" timestamp,
	"last_status" text,
	"last_message" text,
	"locked_until" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auto_generate_settings" ENABLE ROW LEVEL SECURITY;