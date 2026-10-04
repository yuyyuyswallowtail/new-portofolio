CREATE TYPE "public"."comment_status" AS ENUM('pending', 'approved', 'rejected', 'spam');--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "status" "comment_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "flag_reason" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "moderated_at" timestamp;