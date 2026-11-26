import { useEffect, useRef, useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

// The caller mounts this hook inside a component keyed by account, chain and work.
export function useLicenseActions(refresh: () => Promise<void>, attachTerms?: (tx: string) => Promise<void>) {
  const active = useRef(true);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}`>();
  const [refreshWarning, setRefreshWarning] = useState("");
  const { writeContractAsync, isPending } = useScaffoldWriteContract({ contractName: "WorkRegistry" });
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function send(
    action: { fileHash: `0x${string}`; licensee: string; expiresAt: bigint } | { licenseId: bigint },
  ) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    setTxHash(undefined);
    setRefreshWarning("");
    try {
      // Scaffold's transactor resolves only after a successful receipt.
      const hash =
        "licenseId" in action
          ? await writeContractAsync(
              { functionName: "revokeLicense", args: [action.licenseId] },
              { notificationContext: `Thu hồi giấy phép #${action.licenseId}` },
            )
          : await writeContractAsync(
              {
                functionName: "grantLicense",
                args: [action.fileHash, action.licensee, action.expiresAt],
              },
              { notificationContext: `Cấp giấy phép cho tác phẩm ${action.fileHash}` },
            );
      if (!hash) throw new Error("Chưa gửi được giao dịch. Hãy kiểm tra ví và mạng đang kết nối.");
      if (active.current) setTxHash(hash);
      if (!("licenseId" in action) && attachTerms) {
        try {
          await attachTerms(hash);
        } catch {
          const warning = "Đã cấp giấy phép. Chưa lưu được điều khoản. Mở thẻ giấy phép để gắn lại.";
          if (active.current) setRefreshWarning(warning);
          notification.warning(warning);
        }
      }
      try {
        await refresh();
      } catch {
        if (active.current) {
          const warning = "Giao dịch đã thành công nhưng chưa tải được dữ liệu mới. Bấm Làm mới để thử lại.";
          setRefreshWarning(previous => (previous ? previous + " " + warning : warning));
          notification.warning(warning);
        }
      }
      return true;
    } catch (err) {
      if (active.current) setError(getParsedError(err));
      return false;
    } finally {
      locked.current = false;
      if (active.current) setBusy(false);
    }
  }
  return {
    send,
    busy,
    error,
    txHash,
    refreshWarning,
    pendingLabel: isPending ? "Chờ xác nhận trong ví…" : "Đang xác nhận giao dịch…",
  };
}
