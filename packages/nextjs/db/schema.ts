import { boolean, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { Registration } from "~~/utils/copyrightDetails";

export const registrationDrafts = pgTable(
  "registration_drafts",
  {
    chainId: integer("chain_id").notNull(),
    contract: text().notNull(),
    wallet: text().notNull(),
    fileHash: text("file_hash").notNull(),
    preparationId: text("preparation_id").notNull().default("legacy"),
    payload: jsonb().$type<Registration>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    primaryKey({
      name: "registration_drafts_pkey",
      columns: [table.chainId, table.contract, table.wallet, table.fileHash, table.preparationId],
    }),
  ],
);

export const challenges = pgTable("siwe_challenges", {
  nonce: text().primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const profiles = pgTable("wallet_profiles", {
  wallet: text().primaryKey(),
  kind: text({ enum: ["person", "organization"] }).notNull(),
  name: text().notNull(),
  role: text().notNull(),
  organizationCode: text("organization_code").notNull(),
  website: text().notNull(),
  authority: text().notNull(),
  isPublic: boolean("is_public").notNull(),
});

export const workDetails = pgTable(
  "work_details",
  {
    chainId: integer("chain_id").notNull(),
    contract: text().notNull(),
    fileHash: text("file_hash").notNull(),
    blockHash: text("block_hash").notNull(),
    registrant: text().notNull(),
    category: text().notNull(),
    language: text().notNull(),
    creationDate: text("creation_date").notNull(),
    publicationDate: text("publication_date").notNull(),
    parties: jsonb().$type<{ name: string; role: string }[]>().notNull(),
    basis: text().notNull(),
    certificate: text().notNull(),
    experienceUrl: text("experience_url").notNull(),
  },
  table => [primaryKey({ columns: [table.chainId, table.contract, table.fileHash] })],
);

export const licenseTerms = pgTable(
  "license_terms",
  {
    chainId: integer("chain_id").notNull(),
    contract: text().notNull(),
    grantHash: text("grant_hash").notNull(),
    blockHash: text("block_hash").notNull(),
    licenseId: text("license_id").notNull(),
    fileHash: text("file_hash").notNull(),
    licensor: text().notNull(),
    licensee: text().notNull(),
    expiresAt: text("expires_at").notNull(),
    version: integer().notNull(),
    content: text().notNull(),
    termsHash: text("terms_hash").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    signature: text(),
    signedMessage: text("signed_message"),
  },
  table => [
    primaryKey({ columns: [table.chainId, table.contract, table.grantHash, table.blockHash, table.licenseId] }),
  ],
);
