"use client";

import { useAccount } from "wagmi";
import { LicenseCard } from "~~/components/licenses/LicenseCard";
import { useLicenseHistory } from "~~/hooks/licenses/useLicenseHistory";
import { useRegistryClock } from "~~/hooks/licenses/useRegistryClock";
import { LICENSE_TERMS } from "~~/utils/licenses";
import { getParsedError } from "~~/utils/scaffold-eth";

export function ReceivedLicenses() {
  const { address } = useAccount();
  return address ? (
    <ReceivedLicensesForAccount key={address} address={address} />
  ) : (
    <p role="status">Kết nối ví ở đầu trang để xem giấy phép đã nhận.</p>
  );
}

function ReceivedLicensesForAccount({ address }: { address: string }) {
  const history = useLicenseHistory({ licensee: address });
  const clock = useRegistryClock();
  function refresh() {
    void Promise.all([history.refresh(), clock.refetch()]).catch(() => {});
  }
  return (
    <section className="mt-6 space-y-5" aria-label="Giấy phép đã nhận">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-base-content/70">Điều khoản v1: {LICENSE_TERMS}</p>
        <button className="btn btn-ghost btn-sm" onClick={refresh}>
          Làm mới
        </button>
      </div>
      {(history.error || clock.error) && (
        <div role="alert" className="alert alert-error flex flex-wrap">
          <span>Không đọc được dữ liệu blockchain: {getParsedError(history.error || clock.error)}</span>
          <button className="btn btn-sm" onClick={refresh}>
            Thử lại
          </button>
        </div>
      )}
      {!history.error &&
        (history.isLoading ? (
          <p role="status">Đang đọc giấy phép đã nhận…</p>
        ) : history.licenses.length === 0 ? (
          <div role="status" className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h2 className="card-title">Chưa có giấy phép</h2>
              <p className="m-0">Ví này chưa nhận giấy phép sử dụng nào trong mạng local hiện tại.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.licenses.map(license => (
              <LicenseCard
                key={license.id.toString()}
                license={license}
                chainTimestamp={clock.error ? undefined : clock.data?.timestamp}
                grantHash={history.grantEvents.find(event => event.args.licenseId === license.id)?.transactionHash}
                revokeHash={history.revokeEvents.find(event => event.args.licenseId === license.id)?.transactionHash}
              />
            ))}
          </div>
        ))}
    </section>
  );
}
