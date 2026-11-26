import { z } from "zod";
import { requireWallet, signatureSchema } from "~~/services/copyright/auth";
import { client, confirmedGrant } from "~~/services/copyright/chain";
import { endpoint, jsonBody } from "~~/services/copyright/http";
import { acceptSnapshot, findSnapshot, publicSnapshot, publishSnapshot } from "~~/services/copyright/terms";
import { hashSchema } from "~~/utils/copyrightDetails";

function grant(request: Request, singleEvent = false) {
  const params = new URL(request.url).searchParams;
  const hash = hashSchema.parse(params.get("tx"));
  const value = params.get("id");
  const id =
    singleEvent && value === null
      ? undefined
      : z
          .string()
          .regex(/^[1-9]\d{0,77}$/)
          .parse(value);
  return confirmedGrant(hash, id);
}

export const GET = endpoint(async request => ({ terms: publicSnapshot(await findSnapshot(await grant(request))) }));
export const PUT = endpoint(async request => {
  const wallet = await requireWallet(request);
  const { version } = await jsonBody(request, z.strictObject({ version: z.number().int().positive() }));
  return { terms: publicSnapshot(await publishSnapshot(await grant(request, true), wallet, version)) };
});
export const POST = endpoint(async request => {
  const wallet = await requireWallet(request);
  const { signature } = await jsonBody(request, z.strictObject({ signature: signatureSchema }));
  const snapshot = await acceptSnapshot(await grant(request), wallet, signature, (address, message, value) =>
    client.verifyMessage({ address, message, signature: value }),
  );
  return { terms: publicSnapshot(snapshot) };
});
