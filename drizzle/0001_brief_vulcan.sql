CREATE TABLE IF NOT EXISTS "auth"."api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"key" varchar(64) NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
