import assert from "node:assert/strict";
import test from "node:test";

test("Event batches cover inclusive deployment-to-head range without gaps or oversized RPC calls", async () => {
  const { readEventLogs } = await import("./eventLogs.ts");
  const ranges = [];
  const events = await readEventLogs(10n, 1010n, async (from, to) => {
    ranges.push([from, to]);
    return [from];
  });
  assert.deepEqual(ranges, [
    [10n, 509n],
    [510n, 1009n],
    [1010n, 1010n],
  ]);
  assert.deepEqual(events, [10n, 510n, 1010n]);
  assert.deepEqual(await readEventLogs(3n, 2n, async () => assert.fail()), []);
  await assert.rejects(
    readEventLogs(1n, 2n, async () => {
      throw new Error("RPC unavailable");
    }),
    /RPC unavailable/,
  );
  await assert.rejects(
    readEventLogs(-1n, 2n, async () => []),
    /range/,
  );
});
