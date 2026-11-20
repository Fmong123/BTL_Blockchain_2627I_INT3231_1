CREATE TABLE "siwe_challenges" (
	"nonce" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_terms" (
	"chain_id" integer NOT NULL,
	"contract" text NOT NULL,
	"grant_hash" text NOT NULL,
	"block_hash" text NOT NULL,
	"license_id" text NOT NULL,
	"file_hash" text NOT NULL,
	"licensor" text NOT NULL,
	"licensee" text NOT NULL,
	"expires_at" text NOT NULL,
	"version" integer NOT NULL,
	"content" text NOT NULL,
	"terms_hash" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"signature" text,
	"signed_message" text,
	CONSTRAINT "license_terms_chain_id_contract_grant_hash_block_hash_license_id_pk" PRIMARY KEY("chain_id","contract","grant_hash","block_hash","license_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_profiles" (
	"wallet" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"organization_code" text NOT NULL,
	"website" text NOT NULL,
	"authority" text NOT NULL,
	"is_public" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_details" (
	"chain_id" integer NOT NULL,
	"contract" text NOT NULL,
	"file_hash" text NOT NULL,
	"block_hash" text NOT NULL,
	"registrant" text NOT NULL,
	"category" text NOT NULL,
	"language" text NOT NULL,
	"creation_date" text NOT NULL,
	"publication_date" text NOT NULL,
	"parties" jsonb NOT NULL,
	"basis" text NOT NULL,
	"certificate" text NOT NULL,
	"experience_url" text NOT NULL,
	CONSTRAINT "work_details_chain_id_contract_file_hash_pk" PRIMARY KEY("chain_id","contract","file_hash")
);
