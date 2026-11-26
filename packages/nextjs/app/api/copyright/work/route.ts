import { and, desc, eq } from "drizzle-orm";
import { database } from "~~/db/client";
import { workDetails, workRevisions } from "~~/db/schema";
import { requireWallet } from "~~/services/copyright/auth";
import { chainId, registration, registryAddress } from "~~/services/copyright/chain";
import { ApiError, endpoint, jsonBody } from "~~/services/copyright/http";
import { hashSchema, workDetailsSchema } from "~~/utils/copyrightDetails";
import { editableWorkDetails } from "~~/utils/workDetails";

function key(request: Request) {
  const fileHash = hashSchema.parse(new URL(request.url).searchParams.get("hash"));
  return { chainId, contract: registryAddress(), fileHash };
}

export const GET = endpoint(async request => {
  const { fileHash, contract } = key(request);
  if (new URL(request.url).searchParams.get("history") === "1") {
    const wallet = await requireWallet(request);
    const { blockHash, registrant } = await registration(fileHash);
    if (wallet !== registrant) throw new ApiError(403, "Chỉ ví đăng ký được xem lịch sử hồ sơ.");
    const { id, changedAt, editor, details } = workRevisions;
    const history = await database()
      .select({ id, changedAt, editor, details })
      .from(workRevisions)
      .where(
        and(
          eq(workRevisions.chainId, chainId),
          eq(workRevisions.contract, contract),
          eq(workRevisions.fileHash, fileHash),
          eq(workRevisions.blockHash, blockHash),
          eq(workRevisions.editor, wallet),
        ),
      )
      .orderBy(desc(id))
      .limit(51);
    return { history: history.slice(0, 50), hasEarlier: history.length > 50 };
  }
  const [record] = await database()
    .select()
    .from(workDetails)
    .where(
      and(eq(workDetails.chainId, chainId), eq(workDetails.contract, contract), eq(workDetails.fileHash, fileHash)),
    );
  if (!record) return { details: null };
  const current = await registration(fileHash);
  if (record.blockHash !== current.blockHash || record.registrant !== current.registrant) return { details: null };
  return { details: editableWorkDetails(record) };
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
  return { details: editableWorkDetails(details) };
});
