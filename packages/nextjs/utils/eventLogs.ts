// RPC providers commonly limit eth_getLogs ranges. Preserve order and propagate
// errors instead of returning a partial event history as if it were complete.
export async function readEventLogs<T>(
  fromBlock: bigint,
  toBlock: bigint,
  read: (from: bigint, to: bigint) => Promise<readonly T[]>,
): Promise<T[]> {
  if (fromBlock < 0n || toBlock < 0n) throw new Error("Invalid block range.");
  const events: T[] = [];
  for (let from = fromBlock; from <= toBlock; from += 500n) {
    const to = from + 499n < toBlock ? from + 499n : toBlock;
    events.push(...(await read(from, to)));
  }
  return events;
}
