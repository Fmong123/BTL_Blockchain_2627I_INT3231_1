import { sql } from "drizzle-orm";
import { copyrightDeployment } from "~~/copyright.config";
import { database } from "~~/db/client";
import { chainId, client } from "~~/services/copyright/chain";

async function checkBlockchain() {
  if (!copyrightDeployment) return "missing-contract";
  try {
    if ((await client.getChainId()) !== chainId) return "wrong-chain";
    const code = await client.getCode({ address: copyrightDeployment.address });
    return code && code !== "0x" ? "ready" : "missing-contract";
  } catch {
    return "rpc-unavailable";
  }
}

async function checkDatabase() {
  if (!process.env.DATABASE_URL) return "unconfigured";
  try {
    await database().execute(sql`
      select challenges.nonce, profiles.wallet, drafts.preparation_id,
             works.block_hash, terms.signed_message, revisions.details
      from siwe_challenges as challenges
      cross join wallet_profiles as profiles
      cross join registration_drafts as drafts
      cross join work_details as works
      cross join license_terms as terms
      cross join work_revisions as revisions
      limit 0
    `);
    return "ready";
  } catch (error) {
    const cause = error instanceof Error ? (error.cause ?? error) : undefined;
    if (cause && typeof cause === "object" && "code" in cause && (cause.code === "42P01" || cause.code === "42703"))
      return "migration-required";
    return "unavailable";
  }
}

export async function GET() {
  const [blockchain, profiles] = await Promise.all([checkBlockchain(), checkDatabase()]);
  return Response.json({ blockchain, profiles }, { headers: { "Cache-Control": "no-store" } });
}
