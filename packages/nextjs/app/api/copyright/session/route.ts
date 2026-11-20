import { z } from "zod";
import { createChallenge, loginSession, signatureSchema, verifyChallenge } from "~~/services/copyright/auth";
import { endpoint, jsonBody } from "~~/services/copyright/http";
import { addressSchema } from "~~/utils/copyrightDetails";

export const GET = endpoint(async () => {
  const session = await loginSession();
  return { wallet: session.expiresAt && session.expiresAt > Date.now() ? (session.wallet ?? null) : null };
});

export const POST = endpoint(async request => {
  const input = await jsonBody(
    request,
    z.union([
      z.strictObject({ wallet: addressSchema }),
      z.strictObject({ message: z.string().max(1000), signature: signatureSchema }),
    ]),
  );
  return "wallet" in input ? createChallenge(input.wallet) : verifyChallenge(input.message, input.signature);
});

export const DELETE = endpoint(async () => {
  (await loginSession()).destroy();
  return { wallet: null };
});
