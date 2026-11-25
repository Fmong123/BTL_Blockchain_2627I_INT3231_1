import { readFileSync } from "node:fs";

// Only print public deployment coordinates. Never read the deployer's .env/key.
try {
  const directory = new URL("../packages/hardhat/deployments/sepolia/", import.meta.url);
  const chain = JSON.parse(readFileSync(new URL(".chain", directory), "utf8"));
  if (Number(chain.chainId) !== 11155111) throw new Error("Deployment is not on Sepolia.");
  const deployment = JSON.parse(readFileSync(new URL("WorkRegistry.json", directory), "utf8"));
  const block = Number(deployment.receipt?.blockNumber);
  const tx = deployment.receipt?.transactionHash ?? deployment.transaction?.hash ?? deployment.transactionHash;
  if (!/^0x[0-9a-fA-F]{40}$/.test(deployment.address) || !Number.isSafeInteger(block) || block < 1 || !/^0x[0-9a-fA-F]{64}$/.test(tx ?? "")) {
    throw new Error("Deployment receipt is incomplete. Wait for a confirmed Sepolia deployment.");
  }
  console.log("NEXT_PUBLIC_COPYRIGHT_NETWORK=sepolia");
  console.log("NEXT_PUBLIC_WORK_REGISTRY_ADDRESS=" + deployment.address);
  console.log("NEXT_PUBLIC_WORK_REGISTRY_DEPLOYMENT_BLOCK=" + block);
  console.log("WORK_REGISTRY_DEPLOYMENT_TX=" + tx);
} catch (error) {
  console.error("Cannot export Sepolia deployment:", error.code === "ENOENT" ? "Run yarn deploy --network sepolia first." : error.message);
  process.exitCode = 1;
}
