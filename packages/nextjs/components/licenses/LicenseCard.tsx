"use client";

import { useState } from "react";
import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { LICENSE_STATUS_LABELS, License, formatVietnamTimestamp, getLicenseStatus } from "~~/utils/licenses";

export function LicenseCard({
  license,
  chainTimestamp,
  grantHash,
  revokeHash,
  canRevoke = false,
  busy = false,
  onRevoke,
}: {
  license: License;
  chainTimestamp?: bigint;
  grantHash?: `0x${string}` | null;
  revokeHash?: `0x${string}` | null;
  canRevoke?: boolean;
  busy?: boolean;
  onRevoke?: () => Promise<boolean>;
}) {
  const { targetNetwork } = useTargetNetwork();
  const [confirm, setConfirm] = useState(false);
  const status = getLicenseStatus(license, chainTimestamp);
  return (
    <article className="bqs-license-card card border border-base-300 bg-base-100">
      <div className="card-body gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="card-title">Giấy phép #{license.id.toString()}</h3>
          <span
            className={`badge ${status === "valid" ? "badge-success" : status === "revoked" ? "badge-error" : status === "expired" ? "badge-warning" : "badge-outline"}`}
          >
            {status ? LICENSE_STATUS_LABELS[status] : "Chờ thời gian blockchain"}
          </span>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="mb-1 font-semibold">Ví cấp</dt>
            <dd className="m-0">
              <Address address={license.licensor} chain={targetNetwork} size="base" onlyEnsOrAddress />
            </dd>
          </div>
          <div>
            <dt className="mb-1 font-semibold">Ví nhận</dt>
            <dd className="m-0">
              <Address address={license.licensee} chain={targetNetwork} size="base" onlyEnsOrAddress />
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Được cấp (giờ Việt Nam)</dt>
            <dd className="m-0">{formatVietnamTimestamp(license.grantedAt)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Hết hạn (giờ Việt Nam)</dt>
            <dd className="m-0">{formatVietnamTimestamp(license.expiresAt)}</dd>
          </div>
        </dl>
        <Link href={`/works/verify?hash=${license.fileHash}`} className="link break-all text-xs font-mono">
          Tác phẩm: {license.fileHash}
        </Link>
        <div className="space-y-2 text-xs">
          {grantHash && (
            <Link className="link block break-all" href={`/blockexplorer/transaction/${grantHash}`}>
              Giao dịch cấp: {grantHash}
            </Link>
          )}
          {revokeHash && (
            <Link className="link block break-all" href={`/blockexplorer/transaction/${revokeHash}`}>
              Giao dịch thu hồi: {revokeHash}
            </Link>
          )}
        </div>
        {canRevoke &&
          !license.revoked &&
          (confirm ? (
            <div
              role="group"
              aria-label={`Xác nhận thu hồi giấy phép ${license.id}`}
              className="rounded-box border border-warning p-4"
            >
              <p className="mt-0 text-sm">
                Thu hồi giấy phép #{license.id.toString()}? Thao tác được ghi công khai và không thể hoàn tác. Bạn có
                thể cấp giấy phép mới sau đó.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-error btn-sm"
                  disabled={busy}
                  onClick={async () => {
                    if (await onRevoke?.()) setConfirm(false);
                  }}
                >
                  {busy ? "Đang xác nhận…" : "Xác nhận thu hồi"}
                </button>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setConfirm(false)}>
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-outline btn-error btn-sm self-start"
              disabled={busy}
              onClick={() => setConfirm(true)}
            >
              Thu hồi giấy phép
            </button>
          ))}
      </div>
    </article>
  );
}
