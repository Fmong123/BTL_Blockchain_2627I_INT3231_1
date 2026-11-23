export const LICENSE_TERMS_VERSION = 1;
export const LICENSE_TERMS = "Sử dụng phi thương mại, phải ghi nguồn, không được cấp lại hoặc chuyển nhượng.";
export const DEFAULT_LICENSE_DAYS = 30;

export type License = {
  id: bigint;
  fileHash: `0x${string}`;
  licensor: string;
  licensee: string;
  grantedAt: bigint;
  expiresAt: bigint;
  revoked: boolean;
};

export type LicenseStatus = "valid" | "expired" | "revoked";

export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  valid: "Còn hiệu lực",
  expired: "Hết hạn",
  revoked: "Đã thu hồi",
};

export function getLicenseStatus(
  license: Pick<License, "revoked" | "expiresAt"> | undefined,
  chainTimestamp: bigint | undefined,
): LicenseStatus | undefined {
  if (!license || chainTimestamp === undefined) return undefined;
  if (license.revoked) return "revoked";
  return chainTimestamp < license.expiresAt ? "valid" : "expired";
}

export function toVietnamDateTimeInput(timestamp: bigint): string {
  return new Date(Number(timestamp + 7n * 3600n) * 1000).toISOString().slice(0, 16);
}

export function parseVietnamDateTime(value: string): bigint {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Ngày giờ không hợp lệ. Hãy chọn lại thời gian.");
  const milliseconds = Date.parse(`${value}:00+07:00`);
  if (!Number.isFinite(milliseconds)) throw new Error("Ngày giờ không hợp lệ. Hãy chọn lại thời gian.");
  const timestamp = BigInt(milliseconds / 1000);
  if (toVietnamDateTimeInput(timestamp) !== value) throw new Error("Ngày giờ không hợp lệ. Hãy chọn lại thời gian.");
  return timestamp;
}

export function formatVietnamTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}
