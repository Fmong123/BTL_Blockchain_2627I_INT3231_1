"use client";

import { useEffect, useRef, useState } from "react";
import { Notice } from "./Notice";
import { Address } from "@scaffold-ui/components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import { copyrightChain } from "~~/copyright.config";

export async function copyrightApi<T>(path: string, method = "GET", body?: unknown, wallet?: string): Promise<T> {
  const response = await fetch("/api/copyright/" + path, {
    method,
    cache: "no-store",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(wallet ? { "x-wallet": wallet } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!data) throw new Error("Không đọc được phản hồi hồ sơ. Hãy kiểm tra kết nối và thử lại.");
  if (!response.ok) throw new Error(data.error || "Không thể tải dữ liệu. Hãy thử lại.");
  return data;
}

const sessionKey = ["copyright", "session"] as const;

export function useWalletSession(enabled = true) {
  const { address, chainId } = useAccount();
  const wallet = address?.toLowerCase();
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: () => copyrightApi<{ wallet: string | null }>("session"),
    enabled: enabled && Boolean(wallet),
    retry: false,
  });
  return {
    wallet,
    signedIn: Boolean(wallet && session.data?.wallet === wallet && chainId === copyrightChain.id),
    session,
    chainId,
  };
}

export function WalletSession() {
  const { wallet, signedIn, session, chainId } = useWalletSession();
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const current = useRef(wallet);
  useEffect(() => {
    current.current = wallet;
  }, [wallet]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!wallet) return <Notice title="Cần kết nối ví">Kết nối ví ở đầu trang để đăng nhập.</Notice>;
  if (chainId !== copyrightChain.id)
    return (
      <Notice tone="warning" title="Kiểm tra mạng của ví">
        Chuyển ví sang mạng {copyrightChain.name} để đăng nhập.
      </Notice>
    );
  if (session.isPending) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;

  async function changeSession() {
    setBusy(true);
    setError("");
    try {
      if (signedIn) await copyrightApi("session", "DELETE");
      else {
        const { message } = await copyrightApi<{ message: string }>("session", "POST", { wallet });
        const signature = await signMessageAsync({ message });
        if (current.current !== wallet) throw new Error("Ví đã thay đổi. Hãy đăng nhập lại.");
        await copyrightApi("session", "POST", { message, signature });
      }
      await queryClient.invalidateQueries({ queryKey: sessionKey });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đổi phiên đăng nhập.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="bqs-session-row">
        <div className="min-w-0">
          <strong className="block">{signedIn ? "Đã đăng nhập bằng ví" : "Xác nhận đăng nhập"}</strong>
          <p className="bqs-help">
            {signedIn ? (
              <Address address={wallet} chain={copyrightChain} size="base" onlyEnsOrAddress />
            ) : (
              "Ký thông điệp trong ví để mở quyền chỉnh sửa hồ sơ."
            )}
          </p>
        </div>
        <button
          type="button"
          className={`btn ${signedIn ? "btn-outline" : "btn-primary"} btn-sm`}
          disabled={busy}
          aria-busy={busy}
          onClick={changeSession}
        >
          {busy ? "Đang xử lý…" : signedIn ? "Đăng xuất" : "Đăng nhập bằng ví"}
        </button>
      </div>
      {(error || session.error) && (
        <Notice tone="error" role="alert" title="Không thể cập nhật phiên đăng nhập">
          {error || session.error?.message}
        </Notice>
      )}
    </div>
  );
}
