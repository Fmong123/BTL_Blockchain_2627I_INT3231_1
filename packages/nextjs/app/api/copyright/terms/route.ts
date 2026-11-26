import { z } from "zod";
import { requireWallet, signatureSchema } from "~~/services/copyright/auth";
import { client, confirmedGrant } from "~~/services/copyright/chain";
import { ApiError, endpoint, jsonBody } from "~~/services/copyright/http";
import { acceptSnapshot, findSnapshot, publicSnapshot, publishSnapshot } from "~~/services/copyright/terms";
import { hashSchema } from "~~/utils/copyrightDetails";

async function grant(request: Request, singleEvent = false) {
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
  const blockHash = params.get("block");
  const expectedBlock = blockHash === null ? undefined : hashSchema.parse(blockHash);
  const current = await confirmedGrant(hash, id);
  if (expectedBlock && expectedBlock !== current.blockHash)
    throw new ApiError(409, "Block không khớp lần cấp giấy phép.");
  return current;
}

export const GET = endpoint(async request => {
  const current = await grant(request);
  if (new URL(request.url).searchParams.get("evidence") !== "1")
    return { terms: publicSnapshot(await findSnapshot(current)) };
  const wallet = await requireWallet(request);
  if (wallet !== current.licensor && wallet !== current.licensee)
    throw new ApiError(403, "Chỉ ví cấp hoặc ví nhận được xuất bằng chứng chữ ký.");
  const snapshot = await findSnapshot(current);
  if (!snapshot) throw new ApiError(404, "Chưa lưu điều khoản của giấy phép.");
  return {
    format: "bqs-license-evidence-v1",
    grant: current,
    terms: {
      version: snapshot.version,
      content: snapshot.content,
      termsHash: snapshot.termsHash,
      acceptedAt: snapshot.acceptedAt,
      signedMessage: snapshot.signedMessage,
      signature: snapshot.signature,
    },
  };
});
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
