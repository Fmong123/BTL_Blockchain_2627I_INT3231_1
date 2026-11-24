import { and, eq } from "drizzle-orm";
import { database } from "~~/db/client";
import { profiles } from "~~/db/schema";
import { requireWallet } from "~~/services/copyright/auth";
import { endpoint, jsonBody } from "~~/services/copyright/http";
import { addressSchema, profileSchema } from "~~/utils/copyrightDetails";

export const GET = endpoint(async request => {
  const publicWallet = new URL(request.url).searchParams.get("wallet");
  if (publicWallet !== null) {
    const wallet = addressSchema.parse(publicWallet);
    const [profile] = await database()
      .select({
        name: profiles.name,
        kind: profiles.kind,
        role: profiles.role,
        website: profiles.website,
      })
      .from(profiles)
      .where(and(eq(profiles.wallet, wallet), eq(profiles.isPublic, true)));
    return { profile: profile ?? null };
  }
  const wallet = await requireWallet(request);
  const [profile] = await database().select().from(profiles).where(eq(profiles.wallet, wallet));
  return { profile: profile ?? null };
});

export const PUT = endpoint(async request => {
  const wallet = await requireWallet(request);
  const profile = await jsonBody(request, profileSchema);
  if (profile.kind === "person") {
    profile.organizationCode = "";
    profile.authority = "";
  }
  await database()
    .insert(profiles)
    .values({ ...profile, wallet })
    .onConflictDoUpdate({ target: profiles.wallet, set: profile });
  return { profile };
});
