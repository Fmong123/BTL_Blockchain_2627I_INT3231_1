import { setTimeout as delay } from "node:timers/promises";

const [address, mode = "http", timeout = "60000"] = process.argv.slice(2);
const timeoutMs = Number(timeout);
if (
  !address ||
  !["http", "hardhat"].includes(mode) ||
  !Number.isFinite(timeoutMs) ||
  timeoutMs <= 0
) {
  throw new Error(
    "Usage: node scripts/wait-for-service.mjs <url> [http|hardhat] [timeout-ms]",
  );
}
const url = new URL(address);
if (!["http:", "https:"].includes(url.protocol))
  throw new Error("An HTTP(S) service URL is required.");
const deadline = Date.now() + timeoutMs;
let ready = false;
while (Date.now() < deadline) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(
        Math.min(3000, Math.max(1, deadline - Date.now())),
      ),
      ...(mode === "hardhat"
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_chainId",
              params: [],
            }),
          }
        : {}),
    });
    ready =
      response.ok &&
      (mode !== "hardhat" || (await response.json()).result === "0x7a69");
    if (ready) break;
    await response.body?.cancel();
  } catch {
    // A refused connection or request timeout is expected while the service starts.
  }
  await delay(Math.min(1000, Math.max(0, deadline - Date.now())));
}
if (!ready) {
  console.error(
    `Service ${url.origin}${url.pathname} was not ready within ${timeoutMs} ms (${mode}).`,
  );
  process.exitCode = 1;
} else {
  console.log(`Service ready (${mode}).`);
}
