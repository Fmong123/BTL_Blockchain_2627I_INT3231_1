"use client";

import { useState } from "react";
import { WalletSession, copyrightApi, useWalletSession } from "./WalletSession";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { CURRENT_TERMS } from "~~/utils/licenseTerms";
import { LICENSE_TERMS, formatVietnamTimestamp } from "~~/utils/licenses";
import type { License } from "~~/utils/licenses";

export type LicenseTerms = {
  version: number;
  content: string;
  termsHash: string;
  message: string;
  acceptedAt: string | null;
};

export function TermsContent({ content }: { content: string }) {
  return (
    <ol className="bqs-terms-list">
      {content
        .split(/\n+/)
        .filter(line => line.trim())
        .map((line, index) => (
          <li key={index}>
            <span className="bqs-terms-number" aria-hidden="true">
              {index + 1}
            </span>
            <p>{line}</p>
          </li>
        ))}
    </ol>
  );
}

export function LicenseTermsPanel({
  license,
  tx,
  active,
  readOnly = false,
  expanded = false,
  grantBlockHash,
}: {
  license: License;
  tx: string;
  active: boolean;
  readOnly?: boolean;
  expanded?: boolean;
  grantBlockHash?: string;
}) {
  const path = "terms?tx=" + tx + "&id=" + license.id;
  const { address } = useAccount();
  const issuer = address?.toLowerCase() === license.licensor.toLowerCase();
  const recipient = address?.toLowerCase() === license.licensee.toLowerCase();
  const { signedIn, wallet } = useWalletSession(!readOnly && (issuer || recipient));
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readHash, setReadHash] = useState("");
  const query = useQuery({
    queryKey: ["copyright", "terms", tx, license.id.toString(), grantBlockHash],
    queryFn: () => copyrightApi<{ terms: LicenseTerms | null }>(path),
    retry: false,
    refetchInterval: 5000,
  });
  const terms = query.data?.terms;
  const status = query.isPending
    ? "Đang tải…"
    : query.error
      ? "Không tải được"
      : terms?.acceptedAt
        ? "Đã chấp thuận"
        : terms
          ? "Chưa chấp thuận"
          : "Chưa lưu điều khoản";
  async function submit() {
    if (terms && readHash !== terms.termsHash) return;
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
    <details className="bqs-terms-panel border border-base-300 rounded-box" open={expanded || undefined}>
      <summary>
        <span className="bqs-terms-heading">
          <DocumentTextIcon aria-hidden="true" />
          <span>Điều khoản sử dụng và chấp thuận</span>
        </span>
        <span className="bqs-terms-summary-state">
          <span
            className={
              "badge badge-outline " + (query.error ? "badge-error" : terms?.acceptedAt ? "badge-success" : "")
            }
          >
            {status}
          </span>
          <ChevronDownIcon className="bqs-terms-chevron" aria-hidden="true" />
        </span>
      </summary>
      <div className="bqs-terms-body">
        <div className="bqs-terms-notice">
          <InformationCircleIcon aria-hidden="true" />
          <p>
            <strong>Hiệu lực giấy phép và việc chấp thuận là hai trạng thái riêng.</strong> Hiệu lực được xác định trên
            blockchain. Nội dung điều khoản và chữ ký chấp thuận được lưu ngoài blockchain.
          </p>
        </div>
        {query.isPending && (
          <p role="status" className="bqs-terms-loading">
            <span className="loading loading-spinner loading-xs" />
            Đang tải nội dung điều khoản…
          </p>
        )}
        {query.error && (
          <div role="alert" className="bqs-terms-error">
            <p>Chưa thể tải nội dung điều khoản hoặc trạng thái chấp thuận. Vui lòng thử lại.</p>
            <p className="bqs-terms-error-detail">{query.error.message}</p>
            <button
              type="button"
              className="bqs-no-print btn btn-outline btn-sm"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <ArrowPathIcon className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
              {query.isFetching ? "Đang tải…" : "Tải lại điều khoản"}
            </button>
          </div>
        )}
        {!query.error && query.data && !terms && (
          <div className="bqs-terms-content">
            <p className="bqs-terms-empty">
              Giấy phép này chưa có bản điều khoản được lưu, nên chưa có ghi nhận chấp thuận.
            </p>
            <h4>Điều kiện tham chiếu · Phiên bản 1</h4>
            <TermsContent content={LICENSE_TERMS.split(", ").join("\n")} />
            <p className="bqs-terms-caption">
              Đây là nội dung tham chiếu của V1, không phải bản điều khoản đã được ký.
            </p>
          </div>
        )}
        {!query.error && terms && (
          <div className="bqs-terms-content">
            <h4>Nội dung điều khoản · Phiên bản {terms.version}</h4>
            <TermsContent content={terms.content} />
            <div className="bqs-terms-metadata">
              <div>
                <span>Trạng thái chấp thuận</span>
                <strong>{terms.acceptedAt ? "Đã chấp thuận bằng chữ ký ví" : "Chưa ghi nhận chữ ký chấp thuận"}</strong>
              </div>
              {terms.acceptedAt && (
                <div>
                  <span>Chấp thuận lúc · giờ Việt Nam</span>
                  <strong>{formatVietnamTimestamp(BigInt(Math.floor(Date.parse(terms.acceptedAt) / 1000)))}</strong>
                </div>
              )}
              <div className="bqs-terms-hash">
                <span>Mã đối chiếu điều khoản · Keccak-256</span>
                <code>{terms.termsHash}</code>
              </div>
            </div>
          </div>
        )}
        {!readOnly &&
          !query.error &&
          ((issuer && query.data && !terms) || (recipient && terms && !terms.acceptedAt && active)) && (
            <div className="bqs-terms-signing bqs-no-print">
              {!terms && (
                <>
                  <h4>Bản điều khoản sẽ được gắn · Phiên bản {CURRENT_TERMS.version}</h4>
                  <TermsContent content={CURRENT_TERMS.content} />
                </>
              )}
              {terms && (
                <label className="bqs-check-label">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={readHash === terms.termsHash}
                    disabled={busy}
                    onChange={event => setReadHash(event.target.checked ? terms.termsHash : "")}
                  />
                  <span>
                    Tôi đã đọc và đồng ý với phiên bản điều khoản của giấy phép này. Chữ ký sẽ gắn với đúng giấy phép và
                    nội dung đang hiển thị.
                  </span>
                </label>
              )}
              {signedIn ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={busy || Boolean(terms && readHash !== terms.termsHash)}
                  onClick={submit}
                >
                  {terms ? (
                    <CheckBadgeIcon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {busy
                    ? "Đang xử lý…"
                    : terms
                      ? "Ký chấp thuận điều khoản"
                      : "Gắn điều khoản v" + CURRENT_TERMS.version}
                </button>
              ) : (
                <WalletSession />
              )}
            </div>
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
