// PostgreSQL and Ethereum cannot share a transaction. Keep the confirmed hash
// even when the second database write fails so retry never sends a second tx.
export async function submitRegistration<T extends string>(actions: {
  prepare: () => Promise<unknown>;
  send: (broadcast: (hash: T) => void, confirmed: (hash: T) => void) => Promise<T | undefined>;
  remember: (hash: T, confirmed: boolean) => void;
  finalize: (hash: T) => Promise<unknown>;
}) {
  await actions.prepare();
  let broadcastHash: T | undefined;
  let confirmedHash: T | undefined;
  let submittedHash: T | undefined;
  try {
    submittedHash = await actions.send(
      hash => {
        broadcastHash = hash;
        actions.remember(hash, false);
      },
      hash => {
        confirmedHash = hash;
        actions.remember(hash, true);
      },
    );
  } catch (error) {
    if (!broadcastHash) throw error;
    return {
      txHash: confirmedHash ?? broadcastHash,
      saved: false as const,
      error: error instanceof Error ? error.message : "Chưa đối chiếu được giao dịch.",
    };
  }
  const txHash = confirmedHash ?? submittedHash;
  if (!txHash) throw new Error("Chưa gửi được giao dịch. Hãy kiểm tra ví.");
  try {
    actions.remember(txHash, true);
    await actions.finalize(txHash);
    return { txHash, saved: true as const };
  } catch (error) {
    return { txHash, saved: false as const, error: error instanceof Error ? error.message : "Chưa lưu được hồ sơ." };
  }
}
