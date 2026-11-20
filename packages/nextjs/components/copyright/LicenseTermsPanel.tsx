"use client";

import { useState } from "react";
import { WalletSession, copyrightApi, useWalletSession } from "./WalletSession";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import { CURRENT_TERMS } from "~~/utils/licenseTerms";
import { formatVietnamTimestamp } from "~~/utils/licenses";
import type { License } from "~~/utils/licenses";

type Terms = { version: number; content: string; termsHash: string; message: string; acceptedAt: string | null };

export function LicenseTermsPanel({ license, tx, active }: { license: License; tx: string; active: boolean }) {
  const path = "terms?tx=" + tx + "&id=" + license.id;
  const { address } = useAccount();
  const issuer = address?.toLowerCase() === license.licensor.toLowerCase();
  const recipient = address?.toLowerCase() === license.licensee.toLowerCase();
  const { signedIn, wallet } = useWalletSession(issuer || recipient);
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["copyright", "terms", tx, license.id.toString()],
    queryFn: () => copyrightApi<{ terms: Terms | null }>(path),
    retry: false,
  });
  const terms = query.data?.terms;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (terms) {
        const signature = await signMessageAsync({ message: terms.message });
        await copyrightApi(path, "POST", { signature }, wallet);
      } else {
        await copyrightApi(path, "PUT", { version: CURRENT_TERMS.version }, wallet);
      }
      await query.refetch({ throwOnError: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được điều khoản.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-box border border-base-300 p-3">
      <summary className="cursor-pointer font-semibold">
        Điều khoản {terms ? "v" + terms.version + (terms.acceptedAt ? " · Đã chấp thuận" : " · Chờ chấp thuận") : ""}
      </summary>
      <div className="mt-3 space-y-3">
        {query.isPending && <p role="status">Đang tải điều khoản…</p>}
        {query.error && (
          <>
            <p role="status">{query.error.message}</p>
            <button className="btn btn-ghost btn-sm" onClick={() => void query.refetch()}>
              Tải lại điều khoản
            </button>
          </>
        )}
        {query.data && !terms && <p>Giấy phép chưa có bản điều khoản được lưu.</p>}
        {terms && (
          <>
            <p className="whitespace-pre-line">{terms.content}</p>
            <p className="break-all text-xs">Hash Keccak-256 {terms.termsHash} · Lưu ngoài blockchain</p>
            {terms.acceptedAt && (
              <p>Chấp thuận lúc {formatVietnamTimestamp(BigInt(Math.floor(Date.parse(terms.acceptedAt) / 1000)))}</p>
            )}
          </>
        )}
        {((issuer && query.data && !terms) || (recipient && terms && !terms.acceptedAt && active)) && (
          <>
            {!terms && <p className="whitespace-pre-line">{CURRENT_TERMS.content}</p>}
            {signedIn ? (
              <button className="btn btn-outline btn-sm" disabled={busy} onClick={submit}>
                {terms ? "Ký chấp thuận điều khoản" : "Gắn điều khoản v" + CURRENT_TERMS.version}
              </button>
            ) : (
              <WalletSession />
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
