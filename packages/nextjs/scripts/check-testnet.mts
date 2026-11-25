import { parseTestnetDeployment } from "../utils/copyrightNetwork";
import nextEnv from "@next/env";
import { Pool } from "pg";
import { createPublicClient, http, isAddressEqual } from "viem";
import { sepolia } from "viem/chains";

nextEnv.loadEnvConfig(process.cwd(), true);

function hostedUrl(name: string, protocols: string[]) {
  const value = process.env[name];
  if (!value) throw new Error("Missing " + name);
  const url = new URL(value);
  if (!protocols.includes(url.protocol) || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error(name + " must point to the hosted testnet environment.");
  }
  return url;
}

async function main() {
  if (process.env.NEXT_PUBLIC_COPYRIGHT_NETWORK !== "sepolia")
    throw new Error("Set NEXT_PUBLIC_COPYRIGHT_NETWORK=sepolia.");
  const deployment = parseTestnetDeployment(
    process.env.NEXT_PUBLIC_WORK_REGISTRY_ADDRESS,
    process.env.NEXT_PUBLIC_WORK_REGISTRY_DEPLOYMENT_BLOCK,
  );
  if (!deployment) throw new Error("Missing confirmed Sepolia WorkRegistry address and deployment block.");
  const origin = hostedUrl("SIWE_ORIGIN", ["https:"]);
  if (origin.href !== origin.origin + "/" || origin.username || origin.password)
    throw new Error("SIWE_ORIGIN must be a canonical HTTPS origin without a path/query.");
  const rpc = hostedUrl("COPYRIGHT_RPC_URL", ["https:"]);
  const publicRpc = process.env.NEXT_PUBLIC_COPYRIGHT_RPC_URL
    ? hostedUrl("NEXT_PUBLIC_COPYRIGHT_RPC_URL", ["https:"])
    : new URL(sepolia.rpcUrls.default.http[0]);
  const dbUrl = hostedUrl("DATABASE_URL", ["postgres:", "postgresql:"]);
  if (!["require", "verify-full", "verify-ca"].includes(dbUrl.searchParams.get("sslmode") ?? ""))
    throw new Error("DATABASE_URL must require TLS (sslmode=require or verify-full).");
  if (!process.env.IRON_SESSION_SECRET || process.env.IRON_SESSION_SECRET.length < 32)
    throw new Error("IRON_SESSION_SECRET must contain at least 32 characters.");
  const tx = process.env.WORK_REGISTRY_DEPLOYMENT_TX;
  if (!tx || !/^0x[0-9a-fA-F]{64}$/.test(tx))
    throw new Error("Set WORK_REGISTRY_DEPLOYMENT_TX from the confirmed deployment receipt.");
  const client = createPublicClient({ chain: sepolia, transport: http(rpc.href, { timeout: 10000, retryCount: 0 }) });
  const browserClient = createPublicClient({
    chain: sepolia,
    transport: http(publicRpc.href, { timeout: 10000, retryCount: 0 }),
  });
  if ((await client.getChainId()) !== sepolia.id || (await browserClient.getChainId()) !== sepolia.id)
    throw new Error("Frontend/API RPC must both return Sepolia chain ID 11155111.");
  const code = await client.getCode({ address: deployment.address });
  if (!code || code === "0x") throw new Error("No contract code at the configured address.");
  const receipt = await client.getTransactionReceipt({ hash: tx as `0x${string}` });
  if (
    receipt.status !== "success" ||
    !receipt.contractAddress ||
    !isAddressEqual(receipt.contractAddress, deployment.address) ||
    receipt.blockNumber !== BigInt(deployment.deployedOnBlock)
  ) {
    throw new Error("Deployment receipt does not match the configured address/block.");
  }
  console.log("PASS: Sepolia RPC, contract code and deployment receipt agree.");
  const db = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, max: 1 });
  try {
    await db.query("SELECT nonce, expires_at FROM siwe_challenges LIMIT 0");
    await db.query("SELECT wallet, name FROM wallet_profiles LIMIT 0");
    await db.query("SELECT file_hash, block_hash FROM work_details LIMIT 0");
    await db.query("SELECT grant_hash, accepted_at FROM license_terms LIMIT 0");
    await db.query("SELECT file_hash, payload FROM registration_drafts LIMIT 0");
    console.log("PASS: Cloud PostgreSQL is reachable and copyright migrations are present.");
  } finally {
    await db.end();
  }
  console.log("PASS: HTTPS login origin and session secret are configured. Preflight made no writes.");
}

main().catch(error => {
  // Database/RPC exceptions can embed connection URLs. Never print their details.
  const expected =
    /^(Set |Missing |SIWE_ORIGIN |DATABASE_URL |IRON_SESSION_SECRET |Frontend\/API |No contract |Deployment receipt |NEXT_PUBLIC_)/.test(
      error.message,
    );
  console.error(
    "Testnet preflight failed:",
    expected ? error.message : "RPC/database check failed. Verify service connectivity and credentials locally.",
  );
  process.exitCode = 1;
});
