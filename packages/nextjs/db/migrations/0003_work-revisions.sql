CREATE TABLE "work_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"contract" text NOT NULL,
	"file_hash" text NOT NULL,
	"block_hash" text NOT NULL,
	"editor" text NOT NULL,
	"changed_at" timestamp with time zone,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "work_revisions_lookup" ON "work_revisions" USING btree ("chain_id","contract","file_hash","block_hash","id");
--> statement-breakpoint
CREATE FUNCTION "bqs_work_revision_payload"(record "work_details") RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object(
    'category', record.category, 'language', record.language,
    'creationDate', record.creation_date, 'publicationDate', record.publication_date,
    'parties', record.parties, 'basis', record.basis,
    'certificate', record.certificate, 'experienceUrl', record.experience_url
  );
$$;
--> statement-breakpoint
CREATE FUNCTION "bqs_record_work_revision"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  next_details jsonb := bqs_work_revision_payload(NEW);
  previous_details jsonb;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.block_hash = NEW.block_hash AND OLD.registrant = NEW.registrant THEN
    previous_details := bqs_work_revision_payload(OLD);
    IF next_details = previous_details THEN
      RETURN NEW;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM work_revisions
      WHERE chain_id = OLD.chain_id AND contract = OLD.contract AND file_hash = OLD.file_hash
        AND block_hash = OLD.block_hash AND editor = OLD.registrant
    ) THEN
      INSERT INTO work_revisions (chain_id, contract, file_hash, block_hash, editor, details)
      VALUES (OLD.chain_id, OLD.contract, OLD.file_hash, OLD.block_hash, OLD.registrant, previous_details);
    END IF;
  END IF;
  INSERT INTO work_revisions (chain_id, contract, file_hash, block_hash, editor, changed_at, details)
  VALUES (NEW.chain_id, NEW.contract, NEW.file_hash, NEW.block_hash, NEW.registrant, clock_timestamp(), next_details);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "bqs_capture_work_revision" AFTER INSERT OR UPDATE ON "work_details"
FOR EACH ROW EXECUTE FUNCTION "bqs_record_work_revision"();
