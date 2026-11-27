type Hash = `0x${string}`;

export type PendingRegistration = {
  operationId?: Hash;
  txHash: Hash;
  fileHash: Hash;
  title: string;
  confirmed?: boolean;
  preparationId?: string;
};

function isHash(value: unknown): value is Hash {
  return typeof value === "string" && /^0x[0-9a-f]{64}$/i.test(value);
}

function readEntry(raw: string | null): PendingRegistration | undefined {
  try {
    const value = JSON.parse(raw ?? "null");
    if (!value || !isHash(value.txHash) || !isHash(value.fileHash) || typeof value.title !== "string") return;
    if (value.preparationId !== undefined && value.preparationId !== "legacy" && !isHash(value.preparationId)) return;
    return {
      txHash: value.txHash,
      fileHash: value.fileHash,
      title: value.title,
      confirmed: value.confirmed === true,
      preparationId: value.preparationId,
    };
  } catch {
    // A malformed entry does not prevent recovery of other registrations.
  }
}

export function readRegistrationRecoveries(scope: string, storage?: Storage) {
  const pending: PendingRegistration[] = [];
  try {
    storage ??= globalThis.localStorage;
    const prefix = scope + ":tx:";
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (!key) continue;
      const suffix = key.startsWith(prefix) ? key.slice(prefix.length) : undefined;
      const operationId = isHash(suffix) ? suffix : undefined;
      if (key !== scope && !operationId) continue;
      const entry = readEntry(storage.getItem(key));
      if (entry) pending.push({ ...entry, operationId });
    }
  } catch {
    // Transaction recovery is still possible using the server-side draft.
  }
  return pending;
}

export function saveRegistrationRecovery(
  scope: string,
  pending: PendingRegistration & { operationId: Hash },
  storage?: Storage,
) {
  try {
    storage ??= globalThis.localStorage;
    storage.setItem(scope + ":tx:" + pending.operationId, JSON.stringify(pending));
  } catch {
    // Continue finalization even if browser storage is unavailable.
  }
}

export function removeRegistrationRecovery(scope: string, pending: PendingRegistration, storage?: Storage) {
  try {
    storage ??= globalThis.localStorage;
    const key = pending.operationId ? scope + ":tx:" + pending.operationId : scope;
    if (readEntry(storage.getItem(key))?.txHash === pending.txHash) storage.removeItem(key);
  } catch {
    // Finalization is idempotent if browser storage could not be cleared.
  }
}
