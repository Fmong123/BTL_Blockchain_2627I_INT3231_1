import { isAddress } from "viem";

export function parseExplorerSearch(input: string): { kind: "address" | "transaction"; value: `0x${string}` } {
  const value = input.trim();
  if (isAddress(value)) return { kind: "address", value: value as `0x${string}` };
  if (/^0x[0-9a-fA-F]{64}$/.test(value)) return { kind: "transaction", value: value as `0x${string}` };
  throw new Error("Nhập địa chỉ ví hợp lệ hoặc hash giao dịch gồm 64 ký tự hex.");
}
