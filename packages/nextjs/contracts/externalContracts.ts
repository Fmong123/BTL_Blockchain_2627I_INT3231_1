import { zeroAddress } from "viem";
import { copyrightAbi, localDeployment, testnetDeployment } from "~~/copyright.config";
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * @example
 * const externalContracts = {
 *   1: {
 *     DAI: {
 *       address: "0x...",
 *       abi: [...],
 *     },
 *   },
 * } as const;
 */
const externalContracts = {
  31337: {
    WorkRegistry: {
      address: localDeployment?.address ?? zeroAddress,
      deployedOnBlock: localDeployment?.deployedOnBlock ?? 0,
      abi: copyrightAbi,
    },
  },
  11155111: {
    WorkRegistry: {
      address: testnetDeployment?.address ?? zeroAddress,
      deployedOnBlock: testnetDeployment?.deployedOnBlock ?? 0,
      abi: copyrightAbi,
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
