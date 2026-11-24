import nextEnv from "@next/env";
import { sealData } from "iron-session";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { Pool } from "pg";
import { createPublicClient, createWalletClient, http, keccak256, stringToHex } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";
import { parseSiweMessage } from "viem/siwe";

const { default: deployedContracts } = createRequire(import.meta.url)(
  "../contracts/deployedContracts.ts",
) as typeof import("../contracts/deployedContracts");

nextEnv.loadEnvConfig(process.cwd(), true);
const origin = new URL(process.env.SIWE_ORIGIN || "http://localhost:3000");
const rpc = new URL(process.env.COPYRIGHT_RPC_URL || "http://127.0.0.1:8545");
const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.IRON_SESSION_SECRET;
if (
  !databaseUrl ||
  !secret ||
  [origin, rpc, new URL(databaseUrl)].some(url => !["127.0.0.1", "localhost"].includes(url.hostname))
) {
  throw new Error("Integration tests require an isolated local app, PostgreSQL, Hardhat and session secret.");
}

const mnemonic = "test test test test test test test test test test test junk";
const issuer = mnemonicToAccount(mnemonic, { addressIndex: 0 });
const recipient = mnemonicToAccount(mnemonic, { addressIndex: 1 });
const issuerAddress = issuer.address.toLowerCase();
const publicClient = createPublicClient({ chain: hardhat, transport: http(rpc.href) });
const walletClient = createWalletClient({ account: issuer, chain: hardhat, transport: http(rpc.href) });
const { address, abi } = deployedContracts[hardhat.id].WorkRegistry;
const db = new Pool({ connectionString: databaseUrl });

async function api(
  path: string,
  status: number,
  options: {
    method?: string;
    body?: unknown;
    wallet?: string;
    cookie?: string;
    from?: string;
  } = {},
) {
  const response = await fetch(new URL("/api/copyright/" + path, origin), {
    method: options.method,
    headers: {
      Origin: options.from ?? origin.origin,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.wallet ? { "x-wallet": options.wallet } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json();
  assert.equal(response.status, status, JSON.stringify({ path, data }));
  return { data, cookies: response.headers.getSetCookie() };
}

function cookie(cookies: string[], name: string) {
  const value = cookies.find(header => header.startsWith(name + "="));
  assert.ok(value);
  return value.split(";")[0];
}

async function challenge(account: typeof issuer, previous?: string) {
  const result = await api("session", 200, { method: "POST", body: { wallet: account.address }, cookie: previous });
  const message: string = result.data.message;
  return {
    body: { message, signature: await account.signMessage({ message }) },
    cookie: cookie(result.cookies, "bqs-challenge"),
  };
}

async function login(account: typeof issuer, checkReplay = false) {
  const proof = await challenge(account);
  const result = await api("session", 200, { method: "POST", ...proof });
  assert.equal(result.data.wallet, account.address.toLowerCase());
  if (checkReplay) await api("session", 401, { method: "POST", ...proof });
  const session = result.cookies.find(header => header.startsWith("bqs-session="));
  assert.match(session ?? "", /HttpOnly/i);
  assert.match(session ?? "", /SameSite=Strict/i);
  return { wallet: account.address, cookie: cookie(result.cookies, "bqs-session") };
}

try {
  const a = await login(issuer, true);
  const b = await login(recipient);
  const expired = await challenge(issuer);
  await db.query("UPDATE siwe_challenges SET expires_at = now() - interval '1 second' WHERE nonce = $1", [
    parseSiweMessage(expired.body.message).nonce,
  ]);
  await api("session", 401, { method: "POST", ...expired });
  const wrongMessage = await challenge(issuer);
  await api("session", 401, {
    method: "POST",
    ...wrongMessage,
    body: {
      ...wrongMessage.body,
      message: wrongMessage.body.message.replace(origin.host, "example.invalid"),
    },
  });
  const badSignature = await challenge(issuer);
  await api("session", 401, {
    method: "POST",
    ...badSignature,
    body: {
      ...badSignature.body,
      signature: await recipient.signMessage({ message: badSignature.body.message }),
    },
  });
  const oldCookie =
    "bqs-session=" +
    encodeURIComponent(
      await sealData({ wallet: issuerAddress, expiresAt: Date.now() - 1000 }, { password: secret, ttl: 8 * 3600 }),
    );
  await api("profile", 401, { ...a, cookie: oldCookie });
  await api("profile", 401);
  await api("profile", 403, { ...a, wallet: b.wallet });
  console.log("PASS: SIWE login, replay, origin/domain, expiry, wrong signer and wallet switch");

  const profile = {
    kind: "organization",
    name: "Tổ chức mẫu",
    role: "Đại diện",
    isPublic: true,
    organizationCode: "MÃ-RIÊNG",
    authority: "THÔNG-TIN-RIÊNG",
    website: "https://example.org",
  };
  await api("profile", 403, { ...a, method: "PUT", body: profile, from: "https://example.invalid" });
  await api("profile", 400, { ...b, method: "PUT", body: { ...profile, wallet: issuer.address } });
  await api("profile", 200, { ...a, method: "PUT", body: profile });
  const owned = await api("profile", 200, a);
  assert.equal(owned.data.profile.authority, profile.authority);
  const publicPath = "profile?wallet=" + a.wallet;
  const shared = (await api(publicPath, 200)).data.profile;
  assert.deepEqual(Object.keys(shared).sort(), ["kind", "name", "role", "website"]);
  assert.equal(shared.name, profile.name);
  await api("profile", 200, { ...a, method: "PUT", body: { ...profile, isPublic: false } });
  assert.equal((await api(publicPath, 200)).data.profile, null);
  console.log("PASS: profile persistence, wallet binding and public field allowlist");

  const fileHash = ("0x" + randomBytes(32).toString("hex")) as `0x${string}`;
  const workPath = "work?hash=" + fileHash;
  const grantWork = await walletClient.writeContract({
    address,
    abi,
    functionName: "registerWork",
    args: [fileHash, "Tác phẩm thử nghiệm", "", 0],
  });
  await publicClient.waitForTransactionReceipt({ hash: grantWork });
  const details = {
    category: "Logo / thiết kế",
    language: "Tiếng Việt",
    creationDate: "2026-11-19",
    publicationDate: "",
    parties: [
      { name: "Tác giả A", role: "Người sáng tác" },
      { name: "Đại diện B", role: "Đại diện / quản lý" },
    ],
    basis: "Tự sáng tạo",
    certificate: "",
    experienceUrl: "https://youtu.be/dQw4w9WgXcQ?t=30",
  };
  await api(workPath, 403, { ...b, method: "PUT", body: details });
  await api(workPath, 400, {
    ...a,
    method: "PUT",
    body: { ...details, experienceUrl: "https://youtube.com.example.invalid/watch?v=dQw4w9WgXcQ" },
  });
  await api(workPath, 200, { ...a, method: "PUT", body: details });
  assert.equal((await api(workPath, 200)).data.details.experienceUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  console.log("PASS: work registration event check, authorization and normalized experience URL");

  const expiresAt = (await publicClient.getBlock()).timestamp + 3600n;
  async function grant() {
    const tx = await walletClient.writeContract({
      address,
      abi,
      functionName: "grantLicense",
      args: [fileHash, recipient.address, expiresAt],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    const id = await publicClient.readContract({
      address,
      abi,
      functionName: "latestLicenseId",
      args: [fileHash, recipient.address],
    });
    return { tx, id, path: "terms?tx=" + tx + "&id=" + id };
  }
  const first = await grant();
  assert.equal((await api(first.path, 200)).data.terms, null);
  const version = { version: 2 };
  await api(first.path, 403, { ...b, method: "PUT", body: version });
  await api("terms?tx=" + grantWork + "&id=" + first.id, 404);
  await api("terms?tx=" + first.tx, 200, { ...a, method: "PUT", body: version });
  const terms = (await api(first.path, 200)).data.terms;
  assert.equal(terms.termsHash, keccak256(stringToHex(terms.content)));
  const signature = await recipient.signMessage({ message: terms.message });
  await api(first.path, 403, { ...a, method: "POST", body: { signature } });
  const accepted = (await api(first.path, 200, { ...b, method: "POST", body: { signature } })).data.terms;
  assert.ok(accepted.acceptedAt);
  assert.equal(
    (await api(first.path, 200, { ...b, method: "POST", body: { signature } })).data.terms.acceptedAt,
    accepted.acceptedAt,
  );
  await api(workPath, 200, { ...a, method: "PUT", body: { ...details, basis: "Cập nhật hồ sơ sau khi ký" } });
  assert.deepEqual((await api(first.path, 200)).data.terms, accepted);

  const revoked = await walletClient.writeContract({ address, abi, functionName: "revokeLicense", args: [first.id] });
  await publicClient.waitForTransactionReceipt({ hash: revoked });
  const replacement = await grant();
  assert.notEqual(replacement.id, first.id);
  await api(replacement.path, 200, { ...a, method: "PUT", body: version });
  await api(replacement.path, 401, { ...b, method: "POST", body: { signature } });
  const nextTerms = (await api(replacement.path, 200)).data.terms;
  const nextSignature = await recipient.signMessage({ message: nextTerms.message });
  const revokedAgain = await walletClient.writeContract({
    address,
    abi,
    functionName: "revokeLicense",
    args: [replacement.id],
  });
  await publicClient.waitForTransactionReceipt({ hash: revokedAgain });
  await api(replacement.path, 409, { ...b, method: "POST", body: { signature: nextSignature } });
  assert.deepEqual((await api(first.path, 200)).data.terms, accepted);
  console.log(
    "PASS: mined grants, immutable snapshots, recipient signatures, revoke/reissue and cross-grant replay rejection",
  );
} finally {
  await db.end();
}
