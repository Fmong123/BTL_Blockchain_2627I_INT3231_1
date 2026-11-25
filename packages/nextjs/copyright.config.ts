import deployedContracts from "./contracts/deployedContracts";
import { parseCopyrightNetwork, parseTestnetDeployment, selectRegistryDeclarations } from "./utils/copyrightNetwork";
import { hardhat, sepolia } from "viem/chains";

const network = parseCopyrightNetwork(process.env.NEXT_PUBLIC_COPYRIGHT_NETWORK);
export const copyrightChain = network === "sepolia" ? sepolia : hardhat;
export const testnetDeployment = parseTestnetDeployment(
  process.env.NEXT_PUBLIC_WORK_REGISTRY_ADDRESS,
  process.env.NEXT_PUBLIC_WORK_REGISTRY_DEPLOYMENT_BLOCK,
);
const declarations = selectRegistryDeclarations(deployedContracts);
export const localDeployment = declarations.local;
export const copyrightAbi = declarations.template.abi;
export const copyrightDeployment =
  network === "hardhat" ? localDeployment : testnetDeployment ? { ...testnetDeployment, abi: copyrightAbi } : undefined;

export function transactionUrl(hash: string) {
  return copyrightChain.id === hardhat.id
    ? "/blockexplorer/transaction/" + hash
    : copyrightChain.blockExplorers.default.url + "/tx/" + hash;
}
