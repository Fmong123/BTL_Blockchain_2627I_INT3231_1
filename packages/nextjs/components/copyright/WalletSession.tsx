"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hardhat } from "viem/chains";
import { useAccount, useSignMessage } from "wagmi";

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
    signedIn: Boolean(wallet && session.data?.wallet === wallet && chainId === hardhat.id),
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
  if (!wallet) return <p>Kết nối ví để đăng nhập.</p>;
  if (chainId !== hardhat.id) return <p>Chuyển ví sang mạng Hardhat local để đăng nhập.</p>;
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
    <div className="space-y-2">
      {signedIn && <p className="break-all text-sm">Đã đăng nhập bằng {wallet}</p>}
      <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={changeSession}>
        {signedIn ? "Đăng xuất" : "Đăng nhập bằng ví"}
      </button>
      {(error || session.error) && (
        <p role="alert" className="text-error">
          {error || session.error?.message}
        </p>
      )}
    </div>
  );
}
