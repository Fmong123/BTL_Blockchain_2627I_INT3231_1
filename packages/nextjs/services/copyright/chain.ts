import { ApiError } from "./http";
import { createPublicClient, http, parseAbiItem, parseEventLogs } from "viem";
import { hardhat } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";
import type { Address } from "~~/utils/copyrightDetails";

export const chainId = hardhat.id;
export const registry = deployedContracts[chainId].WorkRegistry.address.toLowerCase() as Address;
export const client = createPublicClient({
  chain: hardhat,
  transport: http(process.env.COPYRIGHT_RPC_URL, { timeout: 3000, retryCount: 0 }),
});

export async function registration(fileHash: Address) {
  const [event] = await client.getLogs({
    address: registry,
    event: parseAbiItem(
      "event WorkRegistered(bytes32 indexed fileHash, address indexed registrant, uint256 registeredAt)",
    ),
    args: { fileHash },
    fromBlock: 0n,
    strict: true,
  });
  if (!event) throw new ApiError(404, "Chưa có giao dịch đăng ký tác phẩm.");
  return { registrant: event.args.registrant.toLowerCase(), blockHash: event.blockHash };
}

export async function confirmedGrant(grantHash: Address, licenseId?: string) {
  const receipt = await client.getTransactionReceipt({ hash: grantHash }).catch(error => {
    if (error.name === "TransactionReceiptNotFoundError")
      throw new ApiError(404, "Chưa tìm thấy giao dịch cấp giấy phép đã xác nhận.");
    throw error;
  });
  if (receipt.status !== "success") throw new ApiError(404, "Giao dịch cấp giấy phép không thành công.");
  const events = parseEventLogs({
    abi: deployedContracts[chainId].WorkRegistry.abi,
    eventName: "LicenseGranted",
    logs: receipt.logs.filter(log => log.address.toLowerCase() === registry),
    strict: true,
  });
  const event = licenseId
    ? events.find(log => log.args.licenseId.toString() === licenseId)
    : events.length === 1
      ? events[0]
      : undefined;
  if (!event) throw new ApiError(404, "Giao dịch không chứa giấy phép này.");
  return {
    chainId,
    contract: registry,
    grantHash,
    blockHash: receipt.blockHash,
    licenseId: event.args.licenseId.toString(),
    fileHash: event.args.fileHash,
    licensor: event.args.licensor.toLowerCase(),
    licensee: event.args.licensee.toLowerCase(),
    expiresAt: event.args.expiresAt.toString(),
  };
}

export async function isActiveLicense(licenseId: string) {
  return client.readContract({
    address: registry,
    abi: deployedContracts[chainId].WorkRegistry.abi,
    functionName: "isLicenseValid",
    args: [BigInt(licenseId)],
  });
}
