import {
  licensePath,
  matchesLicenseIdentity,
  parseLicenseId,
  parseLicenseIdentity,
  publicUrl,
  verificationPath,
} from "./shareLinks.ts";
import assert from "node:assert/strict";
import test from "node:test";

const hash = "0x" + "ab".repeat(32);

test("Verification sharing preserves the exact hash and strips page/account query parameters", () => {
  const path = verificationPath(hash);
  const url = new URL(publicUrl("http://localhost:3000/my?wallet=secret#fragment", path));
  assert.equal(url.origin, "http://localhost:3000");
  assert.equal(url.pathname, "/works/verify");
  assert.deepEqual([...url.searchParams.entries()], [["hash", hash]]);
  assert.equal(url.hash, "");
  assert.throws(() => verificationPath("bad"));
  assert.throws(() => publicUrl("https://example.org", "//other.example/path"));
  assert.throws(() => publicUrl("javascript:alert(1)", path));
});

test("Public license IDs remain exact above Number.MAX_SAFE_INTEGER and accept only positive uint256 values", () => {
  for (const id of [1n, 9007199254740993n, 2n ** 256n - 1n]) {
    assert.equal(parseLicenseId(id.toString()), id);
    assert.equal(licensePath(id), "/licenses/" + id);
  }
  for (const value of ["", "0", "-1", "1.5", "1e2", "0x10", "01", " 1", (2n ** 256n).toString()]) {
    assert.equal(parseLicenseId(value), undefined);
  }
  assert.throws(() => licensePath(0n));
});

test("Printed links pin the granting transaction, block and contract across local chain resets", () => {
  const identity = { tx: hash, block: "0x" + "cd".repeat(32), contract: "0x" + "12".repeat(20) };
  const url = new URL(publicUrl("http://localhost:3000", licensePath(1n, identity)));
  const parsed = parseLicenseIdentity(Object.fromEntries(url.searchParams));
  assert.deepEqual(parsed, identity);
  assert.equal(matchesLicenseIdentity(parsed, identity), true);
  assert.equal(matchesLicenseIdentity(parsed, { ...identity, block: hash }), false);
  assert.equal(matchesLicenseIdentity(parsed, { ...identity, contract: "0x" + "34".repeat(20) }), false);
  assert.equal(parseLicenseIdentity({}), undefined);
  assert.equal(parseLicenseIdentity({ tx: hash }), null);
  assert.equal(parseLicenseIdentity({ ...identity, block: [identity.block] }), null);
});
