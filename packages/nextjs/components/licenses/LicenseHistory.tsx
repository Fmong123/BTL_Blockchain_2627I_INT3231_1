import Link from "next/link";
import { formatVietnamTimestamp } from "~~/utils/licenses";

export type LicenseHistoryEvent = {
  kind: "grant" | "revoke";
  id: bigint;
  timestamp: bigint;
  transactionHash: `0x${string}` | null;
  blockNumber: bigint | null;
  logIndex: number | null;
};

export function LicenseHistory({ events }: { events: LicenseHistoryEvent[] }) {
  const sorted = [...events].sort(
    (a, b) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)) || (b.logIndex ?? 0) - (a.logIndex ?? 0),
  );
  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4 p-5">
        <h3 className="card-title">Lịch sử cấp & thu hồi</h3>
        {sorted.length === 0 ? (
          <p className="m-0 text-sm text-base-content/70">Chưa có giao dịch cấp phép.</p>
        ) : (
          <ol className="list-none divide-y divide-base-300 p-0 m-0">
            {sorted.map(event => (
              <li key={`${event.transactionHash}:${event.logIndex}`} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-sm">
                    {event.kind === "grant" ? "Cấp" : "Thu hồi"} giấy phép #{event.id.toString()}
                  </span>
                  <time className="text-xs text-base-content/70">{formatVietnamTimestamp(event.timestamp)} (VN)</time>
                </div>
                {event.transactionHash && (
                  <Link
                    className="link mt-2 block break-all text-xs font-mono"
                    href={`/blockexplorer/transaction/${event.transactionHash}`}
                  >
                    {event.transactionHash}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
