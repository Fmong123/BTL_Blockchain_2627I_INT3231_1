import { cookies } from "next/headers";
import { chainId, client } from "./chain";
import { ApiError, appOrigin } from "./http";
import { and, eq, gt, lte } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { getAddress } from "viem";
import type { Hex } from "viem";
import { createSiweMessage, generateSiweNonce, parseSiweMessage } from "viem/siwe";
import { z } from "zod";
import { database } from "~~/db/client";
import { challenges } from "~~/db/schema";
import { addressSchema } from "~~/utils/copyrightDetails";

export const signatureSchema = z
  .string()
  .max(8192)
  .regex(/^0x(?:[0-9a-fA-F]{2})+$/)
  .transform(value => value as Hex);
const challengeLifetime = 5 * 60;
const sessionLifetime = 8 * 60 * 60;
type Login = { wallet?: string; expiresAt?: number };
type Challenge = { message?: string; expiresAt?: number };

async function cookie<T extends object>(name: string, ttl: number) {
  const password = process.env.IRON_SESSION_SECRET;
  if (!password || password.length < 32) throw new ApiError(503, "Chưa cấu hình khóa đăng nhập ví.");
  return getIronSession<T>(await cookies(), {
    cookieName: name,
    password,
    ttl,
    cookieOptions: { httpOnly: true, sameSite: "strict", secure: appOrigin().protocol === "https:", path: "/" },
  });
}
export const loginSession = () => cookie<Login>("bqs-session", sessionLifetime);
const challengeCookie = () => cookie<Challenge>("bqs-challenge", challengeLifetime);

export async function requireWallet(request: Request) {
  const session = await loginSession();
  if (!session.wallet || !session.expiresAt || session.expiresAt <= Date.now()) {
    throw new ApiError(401, "Hãy đăng nhập bằng ví.");
  }
  const requested = addressSchema.safeParse(request.headers.get("x-wallet"));
  if (!requested.success || requested.data !== session.wallet) {
    throw new ApiError(403, "Ví đang kết nối khác ví đã đăng nhập. Hãy đăng nhập lại.");
  }
  return session.wallet;
}

export async function createChallenge(wallet: string) {
  const now = new Date();
  const expiry = new Date(now.getTime() + challengeLifetime * 1000);
  const nonce = generateSiweNonce();
  const origin = appOrigin();
  const message = createSiweMessage({
    address: getAddress(wallet),
    chainId,
    domain: origin.host,
    scheme: origin.protocol.slice(0, -1),
    uri: origin.origin,
    nonce,
    version: "1",
    issuedAt: now,
    expirationTime: expiry,
    statement: "Sign in to Ban Quyen So.",
  });
  const challenge = await challengeCookie();
  const previous = challenge.message && parseSiweMessage(challenge.message).nonce;
  if (previous) await database().delete(challenges).where(eq(challenges.nonce, previous));
  await database().delete(challenges).where(lte(challenges.expiresAt, now));
  await database().insert(challenges).values({ nonce, expiresAt: expiry });
  challenge.message = message;
  challenge.expiresAt = expiry.getTime();
  await challenge.save();
  return { message };
}

export async function verifyChallenge(message: string, signature: Hex) {
  const challenge = await challengeCookie();
  if (challenge.message !== message || !challenge.expiresAt || challenge.expiresAt <= Date.now()) {
    throw new ApiError(401, "Yêu cầu đăng nhập không hợp lệ hoặc đã hết hạn.");
  }
  const parsed = parseSiweMessage(message);
  const origin = appOrigin();
  if (
    !parsed.nonce ||
    !parsed.address ||
    parsed.chainId !== chainId ||
    parsed.uri !== origin.origin ||
    parsed.domain !== origin.host ||
    !(await client.verifySiweMessage({ message, signature, nonce: parsed.nonce, domain: origin.host }))
  ) {
    throw new ApiError(401, "Chữ ký đăng nhập không hợp lệ.");
  }
  const [used] = await database()
    .delete(challenges)
    .where(and(eq(challenges.nonce, parsed.nonce), gt(challenges.expiresAt, new Date())))
    .returning();
  if (!used) throw new ApiError(401, "Yêu cầu đăng nhập đã dùng hoặc hết hạn.");
  const session = await loginSession();
  session.wallet = parsed.address.toLowerCase();
  session.expiresAt = Date.now() + sessionLifetime * 1000;
  await session.save();
  challenge.destroy();
  return { wallet: session.wallet };
}
