import { confirmedGrant, isActiveLicense } from "./chain";
import { ApiError, appOrigin } from "./http";
import { and, eq, isNull } from "drizzle-orm";
import { keccak256, stringToHex } from "viem";
import { database } from "~~/db/client";
import { licenseTerms } from "~~/db/schema";
import type { Address } from "~~/utils/copyrightDetails";
import { CURRENT_TERMS } from "~~/utils/licenseTerms";

type Grant = Awaited<ReturnType<typeof confirmedGrant>>;
type Snapshot = typeof licenseTerms.$inferSelect;

function identity(grant: Grant) {
  return and(
    eq(licenseTerms.chainId, grant.chainId),
    eq(licenseTerms.contract, grant.contract),
    eq(licenseTerms.grantHash, grant.grantHash),
    eq(licenseTerms.blockHash, grant.blockHash),
    eq(licenseTerms.licenseId, grant.licenseId),
  );
}

function acceptanceMessage(terms: Snapshot) {
  return [
    "Ban Quyen So — Chap thuan dieu khoan giay phep",
    "Ứng dụng: " + appOrigin().origin,
    "Mạng: " + terms.chainId,
    "Contract: " + terms.contract,
    "Giao dịch cấp: " + terms.grantHash,
    "Block: " + terms.blockHash,
    "Giấy phép: " + terms.licenseId,
    "Tác phẩm: " + terms.fileHash,
    "Ví cấp: " + terms.licensor,
    "Ví nhận: " + terms.licensee,
    "Hạn (Unix giây): " + terms.expiresAt,
    "Phiên bản: " + terms.version,
    "Hash Keccak-256: " + terms.termsHash,
    "",
    terms.content,
  ].join("\n");
}

export async function findSnapshot(grant: Grant) {
  const [snapshot] = await database().select().from(licenseTerms).where(identity(grant));
  return snapshot;
}

export async function publishSnapshot(grant: Grant, wallet: string, version: number) {
  if (wallet !== grant.licensor) throw new ApiError(403, "Chỉ ví cấp được gắn điều khoản.");
  const existing = await findSnapshot(grant);
  if (existing) return existing;
  if (version !== CURRENT_TERMS.version) throw new ApiError(409, "Mẫu điều khoản đã thay đổi. Hãy đọc lại.");
  const content = CURRENT_TERMS.content.normalize("NFC");
  await database()
    .insert(licenseTerms)
    .values({
      ...grant,
      version,
      content,
      termsHash: keccak256(stringToHex(content)),
    })
    .onConflictDoNothing();
  return findSnapshot(grant);
}

export function publicSnapshot(snapshot?: Snapshot) {
  if (!snapshot) return null;
  return {
    version: snapshot.version,
    content: snapshot.content,
    termsHash: snapshot.termsHash,
    acceptedAt: snapshot.acceptedAt,
    message: acceptanceMessage(snapshot),
  };
}

export async function acceptSnapshot(
  grant: Grant,
  wallet: string,
  signature: Address,
  verify: (address: Address, message: string, signature: Address) => Promise<boolean>,
) {
  if (wallet !== grant.licensee) throw new ApiError(403, "Chỉ ví nhận được chấp thuận điều khoản.");
  const snapshot = await findSnapshot(grant);
  if (!snapshot) throw new ApiError(404, "Chưa có bản điều khoản cho giấy phép.");
  if (snapshot.acceptedAt) return snapshot;
  const signedMessage = acceptanceMessage(snapshot);
  if (!(await verify(grant.licensee as Address, signedMessage, signature))) {
    throw new ApiError(401, "Chữ ký điều khoản không hợp lệ.");
  }
  if (!(await isActiveLicense(grant.licenseId))) throw new ApiError(409, "Giấy phép không còn hiệu lực.");
  await database()
    .update(licenseTerms)
    .set({ acceptedAt: new Date(), signature, signedMessage })
    .where(and(identity(grant), isNull(licenseTerms.acceptedAt)));
  return findSnapshot(grant);
}
