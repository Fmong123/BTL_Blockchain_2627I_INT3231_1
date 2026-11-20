import { and, eq } from "drizzle-orm";
import { database } from "~~/db/client";
import { workDetails } from "~~/db/schema";
import { requireWallet } from "~~/services/copyright/auth";
import { chainId, registration, registry } from "~~/services/copyright/chain";
import { ApiError, endpoint, jsonBody } from "~~/services/copyright/http";
import { hashSchema, workDetailsSchema } from "~~/utils/copyrightDetails";

function key(request: Request) {
  const fileHash = hashSchema.parse(new URL(request.url).searchParams.get("hash"));
  return { chainId, contract: registry, fileHash };
}

export const GET = endpoint(async request => {
  const { fileHash } = key(request);
  const [record] = await database()
    .select()
    .from(workDetails)
    .where(
      and(eq(workDetails.chainId, chainId), eq(workDetails.contract, registry), eq(workDetails.fileHash, fileHash)),
    );
  if (!record) return { details: null };
  const current = await registration(fileHash);
  if (record.blockHash !== current.blockHash || record.registrant !== current.registrant) return { details: null };
  return { details: record };
});

export const PUT = endpoint(async request => {
  const wallet = await requireWallet(request);
  const ids = key(request);
  const fields = await jsonBody(request, workDetailsSchema);
  const { registrant, blockHash } = await registration(ids.fileHash);
  if (wallet !== registrant) throw new ApiError(403, "Chỉ ví đăng ký tác phẩm được sửa hồ sơ.");
  const details = { ...fields, registrant, blockHash };
  await database()
    .insert(workDetails)
    .values({ ...ids, ...details })
    .onConflictDoUpdate({
      target: [workDetails.chainId, workDetails.contract, workDetails.fileHash],
      set: details,
    });
  return { details };
});
