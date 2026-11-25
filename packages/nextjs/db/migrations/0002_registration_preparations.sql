ALTER TABLE "registration_drafts" DROP CONSTRAINT "registration_drafts_chain_id_contract_wallet_file_hash_pk";--> statement-breakpoint
ALTER TABLE "registration_drafts" ADD COLUMN "preparation_id" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "registration_drafts" ADD CONSTRAINT "registration_drafts_pkey" PRIMARY KEY("chain_id","contract","wallet","file_hash","preparation_id");
