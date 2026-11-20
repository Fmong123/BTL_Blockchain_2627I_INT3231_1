import { parseExplorerSearch } from "./explorer.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("Explorer distinguishes a wallet address from a transaction hash before querying RPC", () => {
  const address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  assert.deepEqual(parseExplorerSearch(`  ${address}  `), { kind: "address", value: address });
  const hash = `0x${"ab".repeat(32)}`;
  assert.deepEqual(parseExplorerSearch(hash), { kind: "transaction", value: hash });
});

test("Explorer rejects empty, malformed and incorrect-length values with user feedback", () => {
  for (const value of ["", "hello", "0x1234", `0x${"z".repeat(64)}`, `0x${"ab".repeat(31)}`]) {
    assert.throws(() => parseExplorerSearch(value), /địa chỉ ví|hash giao dịch/);
  }
});
