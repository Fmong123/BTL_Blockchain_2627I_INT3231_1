"use client";

import { useState } from "react";
import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import { isAddressEqual, zeroAddress } from "viem";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { WORK_TYPE_LABELS } from "~~/utils/workFiles";

const PAGE_SIZE = 10;

function WorkListItem({ fileHash }: { fileHash: `0x${string}` }) {
  const { data: work, error } = useScaffoldReadContract({
    contractName: "WorkRegistry",
    functionName: "works",
    args: [fileHash],
    chainId: hardhat.id,
    watch: false,
    query: { retry: false },
  });
  const registered = work && work[0] !== zeroAddress && !error;

  return (
    <li className="card border border-base-300 bg-base-100">
      <div className="card-body gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {registered ? (
            <>
              <span className="badge badge-outline">{WORK_TYPE_LABELS[work[4]]}</span>
              <h2 className="mt-2 font-semibold break-words">{work[2]}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Address address={work[0]} chain={hardhat} />
                <span className="text-base-content/70">
                  {new Date(Number(work[1]) * 1000).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                </span>
              </div>
            </>
          ) : (
            <p className="m-0 text-sm">
              {work || error ? "Không đọc được thông tin tác phẩm." : "Đang tải thông tin tác phẩm…"}
            </p>
          )}
          <code className="mt-2 block break-all text-xs text-base-content/70">{fileHash}</code>
        </div>
        <Link
          href={`/works/verify?hash=${fileHash}`}
          className="btn btn-outline btn-sm shrink-0 self-start sm:self-auto"
        >
          Xem bản ghi
        </Link>
      </div>
    </li>
  );
}

export default function WorksPage() {
  const { address } = useAccount();
  const [onlyMine, setOnlyMine] = useState(false);
  const [page, setPage] = useState(1);
  const { data: contract, isLoading: isContractLoading } = useDeployedContractInfo({
    contractName: "WorkRegistry",
    chainId: hardhat.id,
  });
  const {
    data: events,
    status,
    error,
    refetch,
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- This event query is only used on Hardhat local.
  } = useScaffoldEventHistory({
    contractName: "WorkRegistry",
    eventName: "WorkRegistered",
    chainId: hardhat.id,
  });

  const visibleEvents = events.filter(({ args }) => {
    if (!args.fileHash || !args.registrant) return false;
    return !onlyMine || (address && isAddressEqual(args.registrant, address));
  });
  const totalPages = Math.max(1, Math.ceil(visibleEvents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstItem = (currentPage - 1) * PAGE_SIZE;
  const pageEvents = visibleEvents.slice(firstItem, firstItem + PAGE_SIZE);
  const unavailable = !isContractLoading && !contract;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tác phẩm đã đăng ký</h1>
          <p className="mb-0 text-base-content/70">Xem các bản ghi mới nhất trên blockchain local.</p>
        </div>
        <Link href="/works/register" className="btn btn-primary">
          Đăng ký tác phẩm
        </Link>
      </div>

      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="join" role="group" aria-label="Lọc theo ví đăng ký">
          <button
            type="button"
            className={`btn btn-sm join-item ${onlyMine ? "btn-outline" : "btn-primary"}`}
            aria-pressed={!onlyMine}
            onClick={() => {
              setOnlyMine(false);
              setPage(1);
            }}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`btn btn-sm join-item ${onlyMine ? "btn-primary" : "btn-outline"}`}
            aria-pressed={onlyMine}
            onClick={() => {
              setOnlyMine(true);
              setPage(1);
            }}
          >
            Tác phẩm của tôi
          </button>
        </div>
        {contract && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refetch()}>
            Làm mới danh sách
          </button>
        )}
      </div>

      {unavailable || error ? (
        <div role="alert" className="alert alert-error flex flex-wrap">
          <span>Không tải được danh sách. Kiểm tra blockchain local và contract đã triển khai.</span>
          {unavailable && (
            <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>
              Thử lại
            </button>
          )}
        </div>
      ) : onlyMine && !address ? (
        <p role="status">Kết nối ví để xem tác phẩm bạn đã đăng ký.</p>
      ) : isContractLoading || status === "pending" ? (
        <p role="status">Đang tải danh sách tác phẩm…</p>
      ) : pageEvents.length === 0 ? (
        <p role="status">{onlyMine ? "Ví này chưa đăng ký tác phẩm nào." : "Chưa có tác phẩm nào được đăng ký."}</p>
      ) : (
        <>
          <ul className="grid gap-3">
            {pageEvents.map(
              ({ args }) => args.fileHash && <WorkListItem key={args.fileHash} fileHash={args.fileHash} />,
            )}
          </ul>
          {totalPages > 1 && (
            <nav aria-label="Phân trang tác phẩm" className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Trang trước
              </button>
              <span role="status" className="text-sm">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Trang sau
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
