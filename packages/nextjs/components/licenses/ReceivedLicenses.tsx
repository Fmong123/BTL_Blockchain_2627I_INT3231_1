"use client";

import { useAccount } from "wagmi";
import { Notice } from "~~/components/copyright/Notice";
import { LicenseCard } from "~~/components/licenses/LicenseCard";
import { useLicenseHistory } from "~~/hooks/licenses/useLicenseHistory";
import { useRegistryClock } from "~~/hooks/licenses/useRegistryClock";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
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
  const { targetNetwork } = useTargetNetwork();
  const history = useLicenseHistory({ licensee: address });
  const clock = useRegistryClock();
  function refresh() {
    void Promise.all([history.refresh(), clock.refetch()]).catch(() => {});
  }
  return (
    <section className="mt-6 space-y-5" aria-label="Giấy phép đã nhận">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-semibold">Giấy phép đã nhận</h2>
        <button className="btn btn-outline btn-sm" onClick={refresh}>
          Làm mới
        </button>
      </div>
      {(history.error || clock.error) && (
        <Notice tone="error" role="alert" title="Không tải được giấy phép">
          <span>Không đọc được dữ liệu blockchain: {getParsedError(history.error || clock.error)}</span>
          <button className="btn btn-outline btn-sm" onClick={refresh}>
            Thử lại
          </button>
        </Notice>
      )}
      {!history.error &&
        (history.isLoading ? (
          <p role="status">Đang đọc giấy phép đã nhận…</p>
        ) : history.licenses.length === 0 ? (
          <div role="status" className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <h2 className="card-title">Chưa có giấy phép</h2>
              <p className="m-0">Ví này chưa nhận giấy phép sử dụng nào trên mạng {targetNetwork.name}.</p>
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
                grantBlockHash={history.grantEvents.find(event => event.args.licenseId === license.id)?.blockHash}
                revokeHash={history.revokeEvents.find(event => event.args.licenseId === license.id)?.transactionHash}
              />
            ))}
          </div>
        ))}
    </section>
  );
}
