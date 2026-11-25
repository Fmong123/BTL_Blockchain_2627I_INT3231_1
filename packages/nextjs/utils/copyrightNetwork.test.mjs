import assert from "node:assert/strict";
import test from "node:test";

test("A fresh Sepolia-only deployment still supplies an ABI template without inventing a local deployment", async () => {
  const { selectRegistryDeclarations } = await import("./copyrightNetwork.ts");
  const contract = { address: "0x" + "ab".repeat(20), abi: [{ type: "event", name: "WorkRegistered" }] };
  assert.deepEqual(selectRegistryDeclarations({ 11155111: { WorkRegistry: contract } }), {
    local: undefined,
    template: contract,
  });
  assert.deepEqual(selectRegistryDeclarations({ 31337: { WorkRegistry: contract } }), {
    local: contract,
    template: contract,
  });
  assert.throws(() => selectRegistryDeclarations({}), /WorkRegistry/);
});

test("Network selection defaults to local and rejects unsupported targets instead of falling back", async () => {
  const { parseCopyrightNetwork } = await import("./copyrightNetwork.ts");
  assert.equal(parseCopyrightNetwork(undefined), "hardhat");
  assert.equal(parseCopyrightNetwork("hardhat"), "hardhat");
  assert.equal(parseCopyrightNetwork("sepolia"), "sepolia");
  for (const value of ["mainnet", "Sepolia", "", "1"]) assert.throws(() => parseCopyrightNetwork(value));
});

test("Testnet deployment requires a nonzero address and exact positive safe block number together", async () => {
  const { parseTestnetDeployment } = await import("./copyrightNetwork.ts");
  const address = "0x" + "ab".repeat(20);
  assert.equal(parseTestnetDeployment(), undefined);
  assert.deepEqual(parseTestnetDeployment(address, "123"), { address, deployedOnBlock: 123 });
  for (const [a, b] of [
    [address, undefined],
    [undefined, "123"],
    ["0x" + "00".repeat(20), "123"],
    ["bad", "123"],
    [address, "0"],
    [address, "01"],
    [address, "1e3"],
    [address, "-1"],
    [address, "9007199254740992"],
  ]) {
    assert.throws(() => parseTestnetDeployment(a, b));
  }
});
