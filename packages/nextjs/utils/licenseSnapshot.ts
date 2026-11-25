import type { License } from "./licenses";

export function matchesLicenseSnapshot(
  license: License,
  grant: Partial<Omit<License, "revoked">>,
  observedBlockHash: string,
  confirmedBlockHash: string,
): boolean {
  return (
    observedBlockHash.toLowerCase() === confirmedBlockHash.toLowerCase() &&
    license.id === grant.id &&
    license.fileHash.toLowerCase() === grant.fileHash?.toLowerCase() &&
    license.licensor.toLowerCase() === grant.licensor?.toLowerCase() &&
    license.licensee.toLowerCase() === grant.licensee?.toLowerCase() &&
    license.grantedAt === grant.grantedAt &&
    license.expiresAt === grant.expiresAt
  );
}

type DocumentBlock = { number: bigint; hash: string; timestamp: bigint };
type DocumentGrant = {
  args: Partial<Omit<License, "id" | "revoked">> & { licenseId?: bigint };
  transactionHash: string;
  blockHash: string;
};

type DocumentReader<Grant extends DocumentGrant> = {
  getLatestBlock: () => Promise<DocumentBlock>;
  readLicense: (id: bigint, at: bigint) => Promise<License | null>;
  readGrant: (id: bigint, at: bigint) => Promise<Grant | undefined>;
  readTitle: (fileHash: License["fileHash"], at: bigint) => Promise<string>;
  getBlockAt: (at: bigint) => Promise<{ hash: string }>;
};

export async function readLicenseDocumentSnapshot<Grant extends DocumentGrant>(
  id: bigint,
  reader: DocumentReader<Grant>,
) {
  const observedBlock = await reader.getLatestBlock();
  const license = await reader.readLicense(id, observedBlock.number);
  if (!license) return null;
  const [grant, title] = await Promise.all([
    reader.readGrant(id, observedBlock.number),
    reader.readTitle(license.fileHash, observedBlock.number),
  ]);
  if (!grant) throw new Error("Không tìm thấy sự kiện cấp giấy phép tương ứng.");
  const confirmedBlock = await reader.getBlockAt(observedBlock.number);
  if (
    !matchesLicenseSnapshot(
      license,
      { ...grant.args, id: grant.args.licenseId },
      observedBlock.hash,
      confirmedBlock.hash,
    )
  ) {
    throw new Error("Blockchain đã thay đổi trong lúc đối chiếu. Hãy tải lại dữ liệu.");
  }
  return { license, grant, title, observedBlock };
}
