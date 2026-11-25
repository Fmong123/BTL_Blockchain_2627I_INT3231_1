CREATE TABLE "registration_drafts" (
	"chain_id" integer NOT NULL,
	"contract" text NOT NULL,
	"wallet" text NOT NULL,
	"file_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registration_drafts_chain_id_contract_wallet_file_hash_pk" PRIMARY KEY("chain_id","contract","wallet","file_hash")
);
