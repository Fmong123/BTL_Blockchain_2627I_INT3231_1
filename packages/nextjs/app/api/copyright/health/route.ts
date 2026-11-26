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
    await database().execute(sql`select 1 from siwe_challenges limit 1`);
    return "ready";
  } catch {
    return "unavailable";
  }
}

export async function GET() {
  const [blockchain, profiles] = await Promise.all([checkBlockchain(), checkDatabase()]);
  return Response.json({ blockchain, profiles }, { headers: { "Cache-Control": "no-store" } });
}
