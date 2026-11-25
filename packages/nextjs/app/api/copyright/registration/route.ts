import { and, eq, ne } from "drizzle-orm";
import { keccak256, parseEventLogs, stringToHex, zeroAddress } from "viem";
import { z } from "zod";
import { copyrightAbi } from "~~/copyright.config";
import { database } from "~~/db/client";
import { registrationDrafts, workDetails } from "~~/db/schema";
import { requireWallet } from "~~/services/copyright/auth";
import { chainId, client, registryAddress } from "~~/services/copyright/chain";
import { ApiError, endpoint, jsonBody } from "~~/services/copyright/http";
import { hashSchema, preparationIdSchema, registrationSchema } from "~~/utils/copyrightDetails";

export const PUT = endpoint(async request => {
  const wallet = await requireWallet(request);
  const payload = await jsonBody(request, registrationSchema);
  const contract = registryAddress();
  if ((await client.getChainId()) !== chainId) throw new ApiError(503, "RPC không khớp mạng đăng ký.");
  const work = await client.readContract({
    address: contract,
    abi: copyrightAbi,
    functionName: "works",
    args: [payload.fileHash],
  });
  if (work[0] !== zeroAddress) throw new ApiError(409, "Tệp đã được ghi nhận. Không gửi giao dịch đăng ký lần nữa.");
  const preparationId = keccak256(stringToHex(JSON.stringify(payload)));
  await database()
    .insert(registrationDrafts)
    .values({ chainId, contract, wallet, fileHash: payload.fileHash, preparationId, payload })
    .onConflictDoNothing();
  return { prepared: true, preparationId };
});

export const POST = endpoint(async request => {
  const wallet = await requireWallet(request);
  const {
    txHash,
    fileHash: expectedHash,
    preparationId,
  } = await jsonBody(
    request,
    z.strictObject({ txHash: hashSchema, fileHash: hashSchema, preparationId: preparationIdSchema.optional() }),
  );
  const contract = registryAddress();
  if ((await client.getChainId()) !== chainId) throw new ApiError(503, "RPC không khớp mạng đăng ký.");
  const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(error => {
    if (error.name === "TransactionReceiptNotFoundError")
      throw new ApiError(
        404,
        "Giao dịch chưa được xác nhận hoặc đã được thay thế. Kiểm tra mã giao dịch trong ví rồi thử lại.",
      );
    throw error;
  });
  const [event, extra] = parseEventLogs({
    abi: copyrightAbi,
    eventName: "WorkRegistered",
    strict: true,
    logs: receipt.logs.filter(log => log.address.toLowerCase() === contract),
  });
  if (
    receipt.status !== "success" ||
    !event ||
    extra ||
    event.args.registrant.toLowerCase() !== wallet ||
    event.args.fileHash.toLowerCase() !== expectedHash
  )
    throw new ApiError(403, "Giao dịch không phải đăng ký tác phẩm của ví đang đăng nhập.");
  const fileHash = event.args.fileHash.toLowerCase() as `0x${string}`;
  const draftKey = and(
    eq(registrationDrafts.chainId, chainId),
    eq(registrationDrafts.contract, contract),
    eq(registrationDrafts.wallet, wallet),
    eq(registrationDrafts.fileHash, fileHash),
  );
  const workKey = and(
    eq(workDetails.chainId, chainId),
    eq(workDetails.contract, contract),
    eq(workDetails.fileHash, fileHash),
  );
  const [saved] = await database().select().from(workDetails).where(workKey);
  if (saved?.blockHash === receipt.blockHash && saved.registrant === wallet) return { details: saved, fileHash };
  const drafts = await database()
    .select()
    .from(registrationDrafts)
    .where(preparationId ? and(draftKey, eq(registrationDrafts.preparationId, preparationId)) : draftKey)
    .limit(2);
  if (drafts.length > 1)
    throw new ApiError(409, "Có nhiều bản hồ sơ đã chuẩn bị. Nhập mã hồ sơ chuẩn bị để chọn đúng bản đã kiểm tra.");
  const [draft] = drafts;
  if (!draft) {
    // Another completion may have committed and removed the drafts since the first read.
    const [completed] = await database().select().from(workDetails).where(workKey);
    if (completed?.blockHash === receipt.blockHash && completed.registrant === wallet)
      return { details: completed, fileHash };
    throw new ApiError(
      404,
      "Không tìm thấy hồ sơ nháp tương ứng. Kiểm tra mã hồ sơ hoặc mở chi tiết tác phẩm để bổ sung.",
    );
  }
  const work = await client.readContract({
    address: contract,
    abi: copyrightAbi,
    functionName: "works",
    args: [fileHash],
    blockNumber: receipt.blockNumber,
  });
  const payload = registrationSchema.parse(draft.payload);
  if (
    work[0].toLowerCase() !== wallet ||
    work[2] !== payload.title ||
    work[3] !== payload.description ||
    work[4] !== payload.workType
  )
    throw new ApiError(409, "Thông tin giao dịch khác hồ sơ đã kiểm tra. Hãy đối chiếu tại trang tác phẩm.");
  const details = { ...payload.details, chainId, contract, fileHash, registrant: wallet, blockHash: receipt.blockHash };
  const completed = await database().transaction(async tx => {
    await tx
      .insert(workDetails)
      .values(details)
      .onConflictDoUpdate({
        target: [workDetails.chainId, workDetails.contract, workDetails.fileHash],
        set: details,
        // A concurrent retry must preserve the first completed dossier and any later edits.
        setWhere: ne(workDetails.blockHash, receipt.blockHash),
      });
    const [record] = await tx.select().from(workDetails).where(workKey);
    await tx.delete(registrationDrafts).where(draftKey);
    return record;
  });
  return { details: completed, fileHash };
});
