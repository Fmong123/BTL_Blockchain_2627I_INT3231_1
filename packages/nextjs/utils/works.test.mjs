import { getWorkPage } from "./works.ts";
import assert from "node:assert/strict";
import test from "node:test";

const firstWallet = "0x" + "ab".repeat(20);
const secondWallet = "0x" + "cd".repeat(20);
const works = Array.from({ length: 23 }, (_, i) => ({
  fileHash: "0x" + i.toString(16).padStart(64, "0"),
  registrant: i === 22 ? secondWallet : firstWallet,
  registeredAt: BigInt(i),
  title: i === 22 ? "Logo Mộc" : "Tác phẩm " + i,
  description: "",
  workType: i === 22 ? 1 : 0,
}));

test("Search and type filters cover records beyond the current ten-item page", () => {
  const result = getWorkPage(works, { query: " LOGO MỘC ", workType: 1 }, 1);
  assert.equal(result.total, 1);
  assert.equal(result.items[0].title, "Logo Mộc");
  assert.equal(result.totalPages, 1);
});

test("Wallet and hash search are case insensitive and combine with the connected-wallet filter", () => {
  assert.equal(getWorkPage(works, { query: secondWallet.toUpperCase() }, 1).total, 1);
  assert.equal(getWorkPage(works, { query: works[22].fileHash }, 1).total, 1);
  assert.equal(getWorkPage(works, { query: "Logo", registrant: firstWallet }, 1).total, 0);
  assert.equal(getWorkPage(works, { registrant: secondWallet.toUpperCase() }, 1).total, 1);
});

test("Pagination clamps after filtering and retains source ordering", () => {
  const result = getWorkPage(works, {}, 3);
  assert.equal(result.items.length, 3);
  assert.equal(result.items[0].registeredAt, 20n);
  assert.equal(result.totalPages, 3);
  const filtered = getWorkPage(works, { query: "Logo" }, 3);
  assert.equal(filtered.page, 1);
  assert.equal(filtered.items.length, 1);
  assert.equal(getWorkPage([], {}, 8).items.length, 0);
  assert.equal(getWorkPage([], {}, 8).page, 1);
});
