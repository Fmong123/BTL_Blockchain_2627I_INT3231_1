export function parseLicenseId(value: string): bigint | undefined {
  if (!/^[1-9]\d{0,77}$/.test(value)) return undefined;
  const id = BigInt(value);
  return id < 2n ** 256n ? id : undefined;
}

export type LicenseIdentity = { tx: string; block: string; contract: string };

export function parseLicenseIdentity(params: Record<string, unknown>): LicenseIdentity | undefined | null {
  const { tx, block, contract } = params;
  if (tx === undefined && block === undefined && contract === undefined) return undefined;
  if (
    typeof tx !== "string" ||
    typeof block !== "string" ||
    typeof contract !== "string" ||
    !/^0x[0-9a-fA-F]{64}$/.test(tx) ||
    !/^0x[0-9a-fA-F]{64}$/.test(block) ||
    !/^0x[0-9a-fA-F]{40}$/.test(contract)
  )
    return null;
  return { tx: tx.toLowerCase(), block: block.toLowerCase(), contract: contract.toLowerCase() };
}

export function matchesLicenseIdentity(expected: LicenseIdentity | undefined, actual: LicenseIdentity): boolean {
  return (
    !expected ||
    (expected.tx.toLowerCase() === actual.tx.toLowerCase() &&
      expected.block.toLowerCase() === actual.block.toLowerCase() &&
      expected.contract.toLowerCase() === actual.contract.toLowerCase())
  );
}

export function licensePath(id: bigint, identity?: LicenseIdentity): string {
  if (parseLicenseId(id.toString()) === undefined) throw new Error("Mã giấy phép không hợp lệ.");
  if (identity && !parseLicenseIdentity(identity)) throw new Error("Danh tính giấy phép không hợp lệ.");
  return `/licenses/${id}` + (identity ? "?" + new URLSearchParams(identity).toString() : "");
}

export function verificationPath(fileHash: string): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(fileHash)) throw new Error("Hash tác phẩm không hợp lệ.");
  return `/works/verify?hash=${fileHash.toLowerCase()}`;
}

export function publicUrl(currentUrl: string, path: string): string {
  const base = new URL(currentUrl);
  if (!["https:", "http:"].includes(base.protocol) || !path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Liên kết chia sẻ không hợp lệ.");
  }
  const url = new URL(path, base.origin);
  if (url.origin !== base.origin) throw new Error("Liên kết phải thuộc ứng dụng hiện tại.");
  return url.href;
}
