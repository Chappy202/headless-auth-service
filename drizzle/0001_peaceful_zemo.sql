DROP TABLE "auth"."blacklisted_tokens";--> statement-breakpoint
ALTER TABLE "auth"."users" ADD COLUMN "is_disabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resource_name_idx" ON "auth"."resources" USING btree ("name");