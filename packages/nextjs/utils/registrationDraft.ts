import { z } from "zod";
import { categories, hashSchema, partyRoles } from "~~/utils/copyrightDetails";

const draftSchema = z.object({
  fileHash: hashSchema,
  fileName: z.string().max(255),
  title: z.string().max(256),
  description: z.string().max(2048),
  details: z.object({
    category: z.enum(categories),
    language: z.string().max(40),
    creationDate: z.string().max(10),
    publicationDate: z.string().max(10),
    parties: z.array(z.object({ name: z.string().max(120), role: z.enum(partyRoles) })).max(12),
    basis: z.string().max(2048),
    certificate: z.string().max(2048),
    experienceUrl: z.string().max(500),
  }),
});

export type DraftEntry = z.infer<typeof draftSchema>;

export function readDraft(key: string) {
  try {
    const result = draftSchema.safeParse(JSON.parse(sessionStorage.getItem(key) ?? "null"));
    if (result.success) return result.data;
  } catch {
    // The form remains usable when browser storage is unavailable.
  }
}

export function saveDraft(key: string, entry?: DraftEntry) {
  try {
    if (entry) sessionStorage.setItem(key, JSON.stringify(entry));
    else sessionStorage.removeItem(key);
  } catch {
    // Transaction recovery uses its own storage and server-side preparation.
  }
}
