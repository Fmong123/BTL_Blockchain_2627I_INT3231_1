"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { isAddressEqual } from "viem";
import { useAccount } from "wagmi";
import { copyrightApi, useWalletSession } from "~~/components/copyright/WalletSession";
import { GrantLicenseForm } from "~~/components/licenses/GrantLicenseForm";
import { LicenseCard } from "~~/components/licenses/LicenseCard";
import { LicenseHistory } from "~~/components/licenses/LicenseHistory";
import { useLicenseActions } from "~~/hooks/licenses/useLicenseActions";
import { useLicenseHistory } from "~~/hooks/licenses/useLicenseHistory";
import { useRegistryClock } from "~~/hooks/licenses/useRegistryClock";
import { useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { CURRENT_TERMS } from "~~/utils/licenseTerms";
import { getParsedError } from "~~/utils/scaffold-eth";

export function WorkLicenses({ fileHash, registrant }: { fileHash: `0x${string}`; registrant: string }) {
  const { address, chainId } = useAccount();
  return (
    <WorkLicensesForAccount key={`${fileHash}:${address}:${chainId}`} fileHash={fileHash} registrant={registrant} />
  );
}

function WorkLicensesForAccount({ fileHash, registrant }: { fileHash: `0x${string}`; registrant: string }) {
  const { address, chainId } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const history = useLicenseHistory({ fileHash });
  const clock = useRegistryClock();
  const queryClient = useQueryClient();
  const pause = useScaffoldReadContract({
    contractName: "WorkRegistry",
    functionName: "paused",
    query: { retry: false },
  });
  async function refresh() {
    await Promise.all([
      history.refresh(),
      clock.refetch({ throwOnError: true }),
      pause.refetch({ throwOnError: true }),
      queryClient.invalidateQueries({ queryKey: ["copyright", "terms"] }),
    ]);
  }
  const { wallet, signedIn } = useWalletSession();
  const actions = useLicenseActions(
    refresh,
    signedIn
      ? async hash => {
          await copyrightApi("terms?tx=" + hash, "PUT", { version: CURRENT_TERMS.version }, wallet);
        }
      : undefined,
  );
  const isRegistrant = Boolean(address && isAddressEqual(address, registrant));
  const correctNetwork = chainId === targetNetwork.id;
  const canRevoke = isRegistrant && correctNetwork && !history.error;
  const chainTimestamp = clock.error ? undefined : clock.data?.timestamp;
  return (
    <section aria-label="Giấy phép sử dụng" className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-semibold">Giấy phép sử dụng</h2>
        <button className="btn btn-ghost btn-sm" disabled={actions.busy} onClick={() => void refresh().catch(() => {})}>
          Làm mới
        </button>
      </div>
      <div className="bqs-license-layout">
        <div className="min-w-0 space-y-4">
          {isRegistrant && chainTimestamp !== undefined ? (
            <GrantLicenseForm
              registrant={registrant}
              chainTimestamp={chainTimestamp}
              disabled={
                !correctNetwork || pause.data !== false || Boolean(pause.error || history.error) || history.isLoading
              }
              busy={actions.busy}
              pendingLabel={actions.pendingLabel}
              attachTerms={signedIn}
              grant={(licensee, expiresAt) => actions.send({ fileHash, licensee, expiresAt })}
            />
          ) : (
            <div className="bqs-license-panel">
              <h3>Quyền sử dụng</h3>
              <p className="bqs-sub">
                {!address
                  ? "Kết nối ví đăng ký để cấp hoặc thu hồi giấy phép."
                  : isRegistrant
                    ? "Đang đọc thời gian blockchain để chọn hạn cấp phép…"
                    : "Chỉ ví đăng ký tác phẩm được cấp và thu hồi giấy phép."}
              </p>
              <p className="mb-0 text-xs text-base-content/60">
                Giấy phép được tra cứu công khai và ghi nhận sự cho phép của ví đăng ký.
              </p>
            </div>
          )}
          {address && !correctNetwork && (
            <div role="alert" className="alert alert-warning">
              Chuyển ví sang {targetNetwork.name} (Chain ID {targetNetwork.id}) để thao tác.
            </div>
          )}
          {isRegistrant && pause.data === true && (
            <div role="status" className="alert alert-warning">
              Đang tạm dừng cấp mới. Bạn vẫn có thể thu hồi giấy phép đã cấp.
            </div>
          )}
          {(clock.error || pause.error) && (
            <div role="alert" className="alert alert-error flex flex-wrap">
              <span>
                Không đọc được {clock.error ? "thời gian blockchain" : "trạng thái tạm dừng"}.{" "}
                {getParsedError(clock.error || pause.error)}
              </span>
              <button className="btn btn-sm" onClick={() => void refresh().catch(() => {})}>
                Thử lại
              </button>
            </div>
          )}
          {actions.error && (
            <div role="alert" className="alert alert-error break-words">
              Giao dịch chưa thành công: {actions.error}
            </div>
          )}
          {actions.txHash && (
            <div role="status" className="alert alert-success block">
              <p className="mt-0 font-semibold">Giao dịch giấy phép đã được xác nhận.</p>
              <Link className="link break-all text-xs font-mono" href={`/blockexplorer/transaction/${actions.txHash}`}>
                {actions.txHash}
              </Link>
            </div>
          )}
          {actions.refreshWarning && (
            <div role="alert" className="alert alert-warning">
              {actions.refreshWarning}
            </div>
          )}
        </div>
        <div className="bqs-license-panel">
          <h3 className="flex items-center gap-2">
            Giấy phép đã cấp{" "}
            {!history.error && !history.isLoading && (
              <span className="badge badge-ghost">{history.licenses.length}</span>
            )}
          </h3>
          {history.error ? (
            <div role="alert" className="alert alert-error flex flex-wrap">
              <span>Không tải được giấy phép: {getParsedError(history.error)}</span>
              <button className="btn btn-sm" onClick={() => void refresh().catch(() => {})}>
                Thử lại
              </button>
            </div>
          ) : history.isLoading ? (
            <p role="status" className="bqs-sub">
              Đang đọc giấy phép trên blockchain…
            </p>
          ) : history.licenses.length === 0 ? (
            <p role="status" className="bqs-sub">
              Tác phẩm chưa được cấp giấy phép.
            </p>
          ) : (
            history.licenses.map(license => (
              <LicenseCard
                key={license.id.toString()}
                license={license}
                chainTimestamp={chainTimestamp}
                grantHash={history.grantEvents.find(event => event.args.licenseId === license.id)?.transactionHash}
                revokeHash={history.revokeEvents.find(event => event.args.licenseId === license.id)?.transactionHash}
                canRevoke={canRevoke}
                busy={actions.busy}
                onRevoke={() => actions.send({ licenseId: license.id })}
              />
            ))
          )}
        </div>
      </div>
      {!history.error && !history.isLoading && (
        <LicenseHistory
          events={[
            ...history.grantEvents.flatMap(event =>
              event.args.licenseId !== undefined && event.args.grantedAt !== undefined
                ? [
                    {
                      kind: "grant" as const,
                      id: event.args.licenseId,
                      timestamp: event.args.grantedAt,
                      transactionHash: event.transactionHash,
                      blockNumber: event.blockNumber,
                      logIndex: event.logIndex,
                    },
                  ]
                : [],
            ),
            ...history.revokeEvents.flatMap(event =>
              event.args.licenseId !== undefined && event.args.revokedAt !== undefined
                ? [
                    {
                      kind: "revoke" as const,
                      id: event.args.licenseId,
                      timestamp: event.args.revokedAt,
                      transactionHash: event.transactionHash,
                      blockNumber: event.blockNumber,
                      logIndex: event.logIndex,
                    },
                  ]
                : [],
            ),
          ]}
        />
      )}
    </section>
  );
}
