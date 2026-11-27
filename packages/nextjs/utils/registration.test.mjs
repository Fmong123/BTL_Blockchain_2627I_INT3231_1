import { registrationSchema } from "./copyrightDetails.ts";
import { submitRegistration } from "./registrationFlow.ts";
import {
  readRegistrationRecoveries,
  removeRegistrationRecovery,
  saveRegistrationRecovery,
} from "./registrationRecovery.ts";
import assert from "node:assert/strict";
import test from "node:test";

const payload = {
  fileHash: "0x" + "12".repeat(32),
  title: "Tác phẩm",
  description: "Tóm tắt nội dung",
  workType: 2,
  details: {
    category: "Tài liệu",
    language: "vi",
    creationDate: "2026-01-01",
    publicationDate: "",
    parties: [
      { name: "Nguyễn A", role: "Người sáng tác" },
      { name: "Nguyễn A", role: "Chủ sở hữu quyền" },
    ],
    basis: "Tự sáng tạo và sở hữu quyền",
    certificate: "",
    experienceUrl: "",
  },
  rightsConfirmed: true,
  publicConfirmed: true,
};

test("Registration requires author, owner, creation date, summary and explicit declarations", () => {
  assert.equal(registrationSchema.safeParse(payload).success, true);
  for (const candidate of [
    { ...payload, description: " " },
    { ...payload, rightsConfirmed: false },
    { ...payload, publicConfirmed: false },
    ...[
      { creationDate: "" },
      { creationDate: "2999-01-01" },
      { publicationDate: "2025-01-01" },
      { parties: [payload.details.parties[0]] },
      { parties: [payload.details.parties[1]] },
    ].map(details => ({ ...payload, details: { ...payload.details, ...details } })),
    { ...payload, title: "ấ".repeat(100) },
  ])
    assert.equal(registrationSchema.safeParse(candidate).success, false);
});

test("Database preparation must succeed before sending a registration", async () => {
  const events = [];
  await assert.rejects(
    submitRegistration({
      prepare: async () => {
        events.push("prepare");
        throw new Error("DB offline");
      },
      send: async () => {
        events.push("send");
        return "tx";
      },
      remember: () => events.push("remember"),
      finalize: async () => events.push("finalize"),
    }),
    /DB offline/,
  );
  assert.deepEqual(events, ["prepare"]);
});

test("A confirmed transaction is retained when profile finalization fails", async () => {
  const events = [];
  const result = await submitRegistration({
    prepare: async () => events.push("prepare"),
    send: async () => {
      events.push("send");
      return "tx";
    },
    remember: tx => events.push(tx),
    finalize: async () => {
      throw new Error("save failed");
    },
  });
  assert.deepEqual(events, ["prepare", "send", "tx"]);
  assert.equal(result.txHash, "tx");
  assert.equal(result.saved, false);
  assert.match(result.error, /save failed/);
});

test("Cancelled wallet transaction never finalizes a profile", async () => {
  let finalized = false;
  await assert.rejects(
    submitRegistration({
      prepare: async () => {},
      send: async () => undefined,
      remember: () => {},
      finalize: async () => {
        finalized = true;
      },
    }),
    /giao dịch/,
  );
  assert.equal(finalized, false);
});

test("Wallet speed-up finalizes and retains the confirmed replacement hash", async () => {
  const remembered = [];
  let finalized;
  const result = await submitRegistration({
    prepare: async () => {},
    send: async (broadcast, confirmed) => {
      broadcast("original");
      confirmed("replacement");
      return "original";
    },
    remember: hash => remembered.push(hash),
    finalize: async hash => {
      finalized = hash;
    },
  });
  assert.equal(finalized, "replacement");
  assert.equal(result.txHash, "replacement");
  assert.equal(remembered.at(-1), "replacement");
});

test("A receipt timeout after broadcast preserves a retryable transaction", async () => {
  const remembered = [];
  const result = await submitRegistration({
    prepare: async () => {},
    send: async broadcast => {
      broadcast("pending-tx");
      throw new Error("receipt timeout");
    },
    remember: hash => remembered.push(hash),
    finalize: async () => {
      assert.fail("not confirmed");
    },
  });
  assert.deepEqual(remembered, ["pending-tx"]);
  assert.equal(result.txHash, "pending-tx");
  assert.equal(result.saved, false);
});

function memoryStorage() {
  const entries = new Map();
  return {
    get length() {
      return entries.size;
    },
    key: index => [...entries.keys()][index] ?? null,
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: key => entries.delete(key),
  };
}

test("Finalizing one registration preserves another tab's pending registration and replacement hash", () => {
  const storage = memoryStorage();
  const scope = "wallet-and-contract";
  const older = { txHash: "0x" + "11".repeat(32), fileHash: payload.fileHash, title: "Tab A" };
  const newer = { txHash: "0x" + "22".repeat(32), fileHash: "0x" + "33".repeat(32), title: "Tab B" };
  const a = { ...older, operationId: older.txHash };
  const b = { ...newer, operationId: newer.txHash };
  saveRegistrationRecovery(scope, a, storage);
  saveRegistrationRecovery(scope, b, storage);
  const replacement = { ...b, txHash: "0x" + "44".repeat(32), confirmed: true };
  saveRegistrationRecovery(scope, replacement, storage);
  assert.equal(readRegistrationRecoveries(scope, storage).length, 2);
  removeRegistrationRecovery(scope, a, storage);
  removeRegistrationRecovery(scope, b, storage);
  assert.deepEqual(
    readRegistrationRecoveries(scope, storage).map(entry => entry.txHash),
    [replacement.txHash],
  );
});

test("Legacy pending entries are recoverable and a stale tab cannot clear a newer legacy transaction", () => {
  const storage = memoryStorage();
  const scope = "wallet-and-contract";
  const legacy = { txHash: "0x" + "55".repeat(32), fileHash: payload.fileHash, title: "Legacy" };
  storage.setItem(scope, JSON.stringify(legacy));
  storage.setItem(scope + ":tx:0x" + "66".repeat(32), "{broken");
  const [entry] = readRegistrationRecoveries(scope, storage);
  assert.equal(entry.txHash, legacy.txHash);
  assert.equal(entry.operationId, undefined);
  assert.deepEqual(readRegistrationRecoveries(scope + "-other", storage), []);
  const newer = { ...legacy, txHash: "0x" + "77".repeat(32) };
  storage.setItem(scope, JSON.stringify(newer));
  removeRegistrationRecovery(scope, entry, storage);
  assert.equal(readRegistrationRecoveries(scope, storage)[0].txHash, newer.txHash);
});
