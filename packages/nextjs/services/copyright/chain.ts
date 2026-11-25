import { ApiError } from "./http";
import { createPublicClient, http, parseAbiItem, parseEventLogs } from "viem";
import { copyrightAbi, copyrightChain, copyrightDeployment } from "~~/copyright.config";
import type { Address } from "~~/utils/copyrightDetails";
import { readEventLogs } from "~~/utils/eventLogs";

export const chainId = copyrightChain.id;
export function registryAddress() {
  if (!copyrightDeployment) throw new ApiError(503, "Chưa cấu hình WorkRegistry trên " + copyrightChain.name + ".");
  return copyrightDeployment.address.toLowerCase() as Address;
}
export const client = createPublicClient({
  chain: copyrightChain,
  transport: http(process.env.COPYRIGHT_RPC_URL, { timeout: 3000, retryCount: 0 }),
});

async function checkedDeployment() {
  if (!copyrightDeployment) throw new ApiError(503, "Chưa cấu hình WorkRegistry trên " + copyrightChain.name + ".");
  if ((await client.getChainId()) !== chainId) throw new ApiError(503, "RPC của API không khớp mạng ứng dụng.");
  return {
    registry: registryAddress(),
    fromBlock: BigInt(copyrightDeployment.deployedOnBlock ?? 0),
  };
}

export async function registration(fileHash: Address) {
  const { registry, fromBlock } = await checkedDeployment();
  const head = await client.getBlockNumber({ cacheTime: 0 });
  const [event] = await readEventLogs(fromBlock, head, (fromBlock, toBlock) =>
    client.getLogs({
      address: registry,
      event: parseAbiItem(
        "event WorkRegistered(bytes32 indexed fileHash, address indexed registrant, uint256 registeredAt)",
      ),
      args: { fileHash },
      fromBlock,
      toBlock,
      strict: true,
    }),
  );
  if (!event) throw new ApiError(404, "Chưa có giao dịch đăng ký tác phẩm.");
  return { registrant: event.args.registrant.toLowerCase(), blockHash: event.blockHash };
}

export async function confirmedGrant(grantHash: Address, licenseId?: string) {
  const { registry } = await checkedDeployment();
  const receipt = await client.getTransactionReceipt({ hash: grantHash }).catch(error => {
    if (error.name === "TransactionReceiptNotFoundError")
      throw new ApiError(404, "Chưa tìm thấy giao dịch cấp giấy phép đã xác nhận.");
    throw error;
  });
  if (receipt.status !== "success") throw new ApiError(404, "Giao dịch cấp giấy phép không thành công.");
  const events = parseEventLogs({
    abi: copyrightAbi,
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
  const { registry } = await checkedDeployment();
  return client.readContract({
    address: registry,
    abi: copyrightAbi,
    functionName: "isLicenseValid",
    args: [BigInt(licenseId)],
  });
}
