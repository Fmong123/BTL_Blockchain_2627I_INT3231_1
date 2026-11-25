export function parseCopyrightNetwork(value: string | undefined): "hardhat" | "sepolia" {
  if (value === undefined || value === "hardhat") return "hardhat";
  if (value === "sepolia") return "sepolia";
  throw new Error("NEXT_PUBLIC_COPYRIGHT_NETWORK must be hardhat or sepolia.");
}

export function selectRegistryDeclarations<T>(declarations: Record<string, { WorkRegistry?: T }>) {
  const template = Object.values(declarations).find(network => network.WorkRegistry)?.WorkRegistry;
  if (!template) throw new Error("Generate a WorkRegistry deployment ABI before building the app.");
  return { local: declarations["31337"]?.WorkRegistry, template };
}

export function parseTestnetDeployment(address?: string, block?: string) {
  if (!address && !block) return undefined;
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address) || /^0x0{40}$/i.test(address)) {
    throw new Error("Set NEXT_PUBLIC_WORK_REGISTRY_ADDRESS to the confirmed Sepolia contract address.");
  }
  if (!block || !/^[1-9]\d*$/.test(block) || !Number.isSafeInteger(Number(block))) {
    throw new Error("Set NEXT_PUBLIC_WORK_REGISTRY_DEPLOYMENT_BLOCK to its positive deployment block number.");
  }
  return { address: address as `0x${string}`, deployedOnBlock: Number(block) };
}
