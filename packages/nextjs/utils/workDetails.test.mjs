import { workDetailsSchema } from "./copyrightDetails.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const fields = {
  category: "Tài liệu",
  language: "vi",
  creationDate: "2026-01-01",
  publicationDate: "",
  parties: [{ name: "Nguyễn A", role: "Người sáng tác" }],
  basis: "Tự sáng tạo",
  certificate: "",
  experienceUrl: "",
};
const identity = {
  chainId: 31337,
  contract: "0x" + "12".repeat(20),
  fileHash: "0x" + "ab".repeat(32),
  blockHash: "0x" + "cd".repeat(32),
  registrant: "0x" + "34".repeat(20),
};

// Execute the real route, replacing only the external database and chain/session reads.
function route(t, overrides = {}) {
  const state = { record: { ...fields, ...identity }, wallet: identity.registrant, current: identity, ...overrides };
  const env = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgres://test-only";
  t.after(() => {
    if (env === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = env;
  });
  const stubs = {
    "~~/db/client": {
      database: () => ({
        select: () => ({ from: () => ({ where: async () => (state.record ? [state.record] : []) }) }),
        insert: () => ({
          values: next => ({
            onConflictDoUpdate: async () => {
              state.record = next;
            },
          }),
        }),
      }),
    },
    "~~/services/copyright/auth": { requireWallet: async () => state.wallet },
    "~~/services/copyright/chain": {
      chainId: identity.chainId,
      registryAddress: () => identity.contract,
      registration: async () => state.current,
    },
  };
  const cache = new Map();
  const base = new URL("../", import.meta.url);
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const require = createRequire(filename);
    const source = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function("require", "module", "exports", source)(
      specifier => {
        if (specifier in stubs) return stubs[specifier];
        if (specifier.startsWith("~~/")) return load(fileURLToPath(new URL(specifier.slice(3) + ".ts", base)));
        return require(specifier);
      },
      loadedModule,
      loadedModule.exports,
    );
    return loadedModule.exports;
  }
  const handlers = load(fileURLToPath(new URL("app/api/copyright/work/route.ts", base)));
  const request = (method, body) =>
    new Request("http://localhost:3000/api/copyright/work?hash=" + identity.fileHash, {
      method,
      headers: { origin: "http://localhost:3000", "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  return {
    state,
    get: () => handlers.GET(request("GET")),
    put: body => handlers.PUT(request("PUT", body)),
  };
}

test("A stored work dossier can be edited, saved and edited again with the strict request schema", async t => {
  const api = route(t);
  const loaded = await (await api.get()).json();
  assert.deepEqual(loaded.details, fields);
  const edited = workDetailsSchema.parse({ ...loaded.details, language: "en" });
  const response = await api.put(edited);
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.deepEqual(saved.details, { ...fields, language: "en" });
  const editedAgain = workDetailsSchema.parse({ ...saved.details, certificate: "Chứng nhận" });
  assert.equal((await api.put(editedAgain)).status, 200);
  assert.equal(api.state.record.blockHash, identity.blockHash);
  assert.equal(api.state.record.registrant, identity.registrant);
  assert.deepEqual((await (await api.get()).json()).details, editedAgain);
});

test("Work dossier PUT responses contain only editable fields", async t => {
  const api = route(t);
  const response = await api.put(fields);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).details, fields);
});

test("Work dossier edits still reject metadata injection and other wallets; stale chain records stay hidden", async t => {
  const api = route(t);
  const original = api.state.record;
  assert.equal((await api.put({ ...fields, registrant: identity.registrant })).status, 400);
  assert.equal(api.state.record, original);
  api.state.wallet = "0x" + "56".repeat(20);
  assert.equal((await api.put(fields)).status, 403);
  assert.equal(api.state.record, original);
  api.state.current = { ...identity, blockHash: identity.fileHash };
  assert.deepEqual(await (await api.get()).json(), { details: null });
  api.state.current = { ...identity, registrant: api.state.wallet };
  assert.deepEqual(await (await api.get()).json(), { details: null });
});
