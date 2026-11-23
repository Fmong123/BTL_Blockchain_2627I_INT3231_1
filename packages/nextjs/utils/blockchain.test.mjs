import { createTransactionContext, hasContractCode, withTransactionContext } from "./blockchain.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("An undeployed address is rejected for both RPC empty code and Viem undefined", () => {
  assert.equal(hasContractCode(undefined), false);
  assert.equal(hasContractCode("0x"), false);
  assert.equal(hasContractCode("0x00"), true);
  assert.equal(hasContractCode("0x60806040"), true);
});

test("A delayed transaction result retains its initiating wallet, chain and work", async () => {
  const origin = { account: "0x" + "11".repeat(20), chainId: 31337, work: "0x" + "aa".repeat(32) };
  const context = createTransactionContext(origin.account, origin.chainId, `Cấp giấy phép ${origin.work}`);
  origin.account = "0x" + "22".repeat(20);
  origin.chainId = 1;
  origin.work = "0x" + "bb".repeat(32);
  const message = withTransactionContext(await Promise.resolve("Đã xác nhận"), context);
  assert.ok(message.includes("0x" + "11".repeat(20)));
  assert.ok(message.includes("31337"));
  assert.ok(message.includes("0x" + "aa".repeat(32)));
  assert.ok(!message.includes(origin.account));
  assert.ok(!message.includes(origin.work));
  assert.ok(withTransactionContext("Lỗi giao dịch", context).includes(context));
});

test("Existing notification callers remain usable without custom context", () => {
  assert.equal(withTransactionContext("Đã xác nhận"), "Đã xác nhận");
  assert.ok(createTransactionContext(undefined, 31337, "Giao dịch").includes("31337"));
});
