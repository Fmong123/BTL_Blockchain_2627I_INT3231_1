import { matchesLicenseSnapshot } from "./licenseSnapshot.ts";
import assert from "node:assert/strict";
import test from "node:test";

const license = {
  id: 1n,
  fileHash: "0x" + "ab".repeat(32),
  licensor: "0x" + "12".repeat(20),
  licensee: "0x" + "34".repeat(20),
  grantedAt: 100n,
  expiresAt: 200n,
  revoked: false,
};
const grant = { ...license };
const block = "0x" + "cd".repeat(32);

test("License snapshots reject a block replaced during reads and grant fields from another chain history", () => {
  assert.equal(matchesLicenseSnapshot(license, grant, block, block), true);
  assert.equal(matchesLicenseSnapshot(license, grant, block, license.fileHash), false);
  assert.equal(matchesLicenseSnapshot(license, { ...grant, licensor: undefined }, block, block), false);
  for (const [field, value] of Object.entries({
    id: 2n,
    fileHash: block,
    licensor: license.licensee,
    licensee: license.licensor,
    grantedAt: 101n,
    expiresAt: 201n,
  })) {
    assert.equal(matchesLicenseSnapshot(license, { ...grant, [field]: value }, block, block), false, field);
  }
  assert.equal(matchesLicenseSnapshot({ ...license, revoked: true }, grant, block, block), true);
});

// Reload must obtain a new block and pin every dependent read to that snapshot.
test("Document reload reads a fresh block on every invocation", async () => {
  const { readLicenseDocumentSnapshot } = await import("./licenseSnapshot.ts");
  let blockNumber = 11n;
  const reads = [];
  const reader = {
    getLatestBlock: async () => ({ number: blockNumber, hash: block, timestamp: 150n }),
    readLicense: async (_id, at) => {
      reads.push(["license", at]);
      return { ...license, revoked: blockNumber === 12n };
    },
    readGrant: async (_id, at) => {
      reads.push(["grant", at]);
      return { args: { ...grant, licenseId: license.id }, transactionHash: block, blockHash: block };
    },
    readTitle: async (_hash, at) => {
      reads.push(["title", at]);
      return "Tác phẩm mẫu";
    },
    getBlockAt: async at => {
      reads.push(["confirm", at]);
      return { hash: block };
    },
  };
  const first = await readLicenseDocumentSnapshot(1n, reader);
  blockNumber = 12n;
  const second = await readLicenseDocumentSnapshot(1n, reader);
  assert.equal(first.license.revoked, false);
  assert.equal(second.license.revoked, true);
  assert.equal(first.observedBlock.number, 11n);
  assert.equal(second.observedBlock.number, 12n);
  assert.deepEqual(
    reads.map(([, at]) => at),
    [11n, 11n, 11n, 11n, 12n, 12n, 12n, 12n],
  );
});

test("Document snapshots reject a replaced block or an unrelated grant", async () => {
  const { readLicenseDocumentSnapshot } = await import("./licenseSnapshot.ts");
  const reader = {
    getLatestBlock: async () => ({ number: 11n, hash: block, timestamp: 150n }),
    readLicense: async () => license,
    readGrant: async () => ({ args: { ...grant, licenseId: license.id }, transactionHash: block, blockHash: block }),
    readTitle: async () => "Tác phẩm mẫu",
    getBlockAt: async () => ({ hash: license.fileHash }),
  };
  await assert.rejects(readLicenseDocumentSnapshot(1n, reader), /Blockchain đã thay đổi/);
  await assert.rejects(
    readLicenseDocumentSnapshot(1n, {
      ...reader,
      getBlockAt: async () => ({ hash: block }),
      readGrant: async () => undefined,
    }),
    /Không tìm thấy sự kiện/,
  );
  await assert.rejects(
    readLicenseDocumentSnapshot(1n, {
      ...reader,
      getBlockAt: async () => ({ hash: block }),
      readGrant: async () => ({ args: { ...grant, licenseId: 99n }, transactionHash: block, blockHash: block }),
    }),
    /Blockchain đã thay đổi/,
  );
});

test("Missing license stops before fetching dependent grant and title", async () => {
  const { readLicenseDocumentSnapshot } = await import("./licenseSnapshot.ts");
  const unexpected = async () => {
    assert.fail("Should not read missing license dependencies");
  };
  assert.equal(
    await readLicenseDocumentSnapshot(1n, {
      getLatestBlock: async () => ({ number: 11n, hash: block, timestamp: 150n }),
      readLicense: async () => null,
      readGrant: unexpected,
      readTitle: unexpected,
      getBlockAt: unexpected,
    }),
    null,
  );
});
