"use client";

import { useState } from "react";
import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import { useAccount } from "wagmi";
import {
  ArrowPathIcon,
  ArrowUpRightIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Notice } from "~~/components/copyright/Notice";
import { WORK_CATEGORIES, WorkArt } from "~~/components/works/WorkArt";
import { useLicenseHistory } from "~~/hooks/licenses/useLicenseHistory";
import { useRegistryClock } from "~~/hooks/licenses/useRegistryClock";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useRegisteredWorks } from "~~/hooks/works/useRegisteredWorks";
import { formatVietnamTimestamp, getLicenseStatus } from "~~/utils/licenses";
import { getParsedError } from "~~/utils/scaffold-eth";
import { WORK_TYPE_LABELS } from "~~/utils/workFiles";
import { getWorkPage } from "~~/utils/works";

export function WorkCatalog({ mine = false }: { mine?: boolean }) {
  const { address } = useAccount();
  return <Catalog key={`${address ?? "public"}:${mine}`} mine={mine} />;
}

function Catalog({ mine }: { mine: boolean }) {
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { works, isLoading, error, refresh } = useRegisteredWorks();
  const licenses = useLicenseHistory({});
  const clock = useRegistryClock();
  const [query, setQuery] = useState("");
  const [workType, setWorkType] = useState("");
  const [onlyMine, setOnlyMine] = useState(mine);
  const [page, setPage] = useState(1);
  const result = getWorkPage(
    works,
    {
      query,
      workType: workType === "" ? undefined : Number(workType),
      registrant: onlyMine ? address : undefined,
    },
    page,
  );
  const licenseCountsReady = !licenses.isLoading && !licenses.error && !clock.error && clock.data !== undefined;

  return (
    <section aria-label="Danh sách tác phẩm">
      <div className="bqs-toolbar">
        <label className="input bqs-search">
          <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-base-content/50" aria-hidden="true" />
          <span className="sr-only">Tìm tác phẩm</span>
          <input
            type="search"
            placeholder="Tìm tên, ví hoặc hash…"
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Loại tác phẩm</span>
          <select
            className="select bqs-filter"
            value={workType}
            onChange={event => {
              setWorkType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả loại tác phẩm</option>
            {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="bqs-catalog-options">
        {!mine ? (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-xs checkbox-primary"
              checked={onlyMine}
              onChange={event => {
                setOnlyMine(event.target.checked);
                setPage(1);
              }}
            />
            Chỉ tác phẩm của tôi
          </label>
        ) : (
          <span>Tác phẩm ví của bạn đã ghi nhận</span>
        )}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => void Promise.all([refresh(), licenses.refresh(), clock.refetch()]).catch(() => {})}
        >
          <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden="true" /> Làm mới danh sách
        </button>
      </div>
      {onlyMine && !address ? (
        <Notice role="status" title="Cần kết nối ví">
          Kết nối ví ở đầu trang để xem tác phẩm của bạn.
        </Notice>
      ) : error ? (
        <Notice tone="error" role="alert" title="Không tải được tác phẩm">
          <span>Không tải được danh sách: {getParsedError(error)}</span>
          <button className="btn btn-outline btn-sm" onClick={() => void refresh()}>
            Thử lại
          </button>
        </Notice>
      ) : isLoading ? (
        <p role="status">
          <span className="loading loading-spinner loading-sm mr-2" />
          Đang đọc tác phẩm trên blockchain…
        </p>
      ) : (
        <>
          <div className="bqs-caption">
            <span role="status">{result.total} tác phẩm</span>
            <span>Mới nhất trước</span>
          </div>
          {result.total === 0 ? (
            <div className="card border border-base-300 bg-base-100">
              <div className="card-body">
                <h2 className="card-title">Chưa có tác phẩm phù hợp</h2>
                <p className="m-0">Thử đổi từ khóa hoặc bộ lọc, hoặc đăng ký tác phẩm đầu tiên.</p>
              </div>
            </div>
          ) : (
            <ul className="bqs-work-grid">
              {result.items.map(work => (
                <li key={work.fileHash} className="card bqs-work-card border border-base-300 bg-base-100">
                  <Link
                    href={`/works/verify?hash=${work.fileHash}`}
                    aria-label={`Xem chi tiết ${work.title}`}
                    tabIndex={-1}
                  >
                    <WorkArt workType={work.workType} title={work.title} />
                  </Link>
                  <div className="card-body">
                    <span className="bqs-work-category">{WORK_CATEGORIES[work.workType]}</span>
                    <h2 className="break-words" title={work.title}>
                      {work.title}
                    </h2>
                    <div className="bqs-work-meta">
                      <Address address={work.registrant} chain={targetNetwork} size="base" onlyEnsOrAddress />
                    </div>
                    <div className="bqs-work-bottom">
                      <span className="badge badge-ghost">
                        {licenseCountsReady
                          ? `${licenses.licenses.filter(license => license.fileHash === work.fileHash && getLicenseStatus(license, clock.data?.timestamp) === "valid").length} giấy phép hiệu lực`
                          : licenses.error || clock.error
                            ? "Chưa đọc được quyền"
                            : "Đang đọc quyền…"}
                      </span>
                      <Link href={`/works/verify?hash=${work.fileHash}`} className="bqs-detail-link">
                        Xem chi tiết <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                    <time className="mt-2 text-sm text-base-content/55">
                      {formatVietnamTimestamp(work.registeredAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {result.totalPages > 1 && (
            <nav
              aria-label="Phân trang tác phẩm"
              className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs"
            >
              <button
                className="btn btn-outline btn-sm"
                disabled={result.page === 1}
                onClick={() => setPage(result.page - 1)}
              >
                Trang trước
              </button>
              <span>
                Trang {result.page} / {result.totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={result.page === result.totalPages}
                onClick={() => setPage(result.page + 1)}
              >
                Trang sau
              </button>
            </nav>
          )}
        </>
      )}
      <p className="bqs-note">
        <InformationCircleIcon aria-hidden="true" />
        Blockchain lưu hash và thời điểm đăng ký. Hình minh họa theo loại file; bạn tự giữ file gốc.
      </p>
    </section>
  );
}
