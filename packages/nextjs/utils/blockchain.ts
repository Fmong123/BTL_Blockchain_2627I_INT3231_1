export function hasContractCode(code: string | undefined): boolean {
  return Boolean(code && code !== "0x");
}

export function createTransactionContext(account: string | undefined, chainId: number, action: string): string {
  return [account ? `Ví ${account}` : "", `Mạng ${chainId}`, action].filter(Boolean).join(" · ");
}

export function withTransactionContext(message: string, context?: string): string {
  return context ? `${message} — ${context}` : message;
}
