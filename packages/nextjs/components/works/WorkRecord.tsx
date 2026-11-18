"use client";

import { Address } from "@scaffold-ui/components";
import { zeroAddress } from "viem";
import { hardhat } from "viem/chains";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { WORK_TYPE_LABELS } from "~~/utils/workFiles";

export function WorkRecord({ fileHash }: { fileHash: `0x${string}` }) {
  const { data: contract, isLoading: isContractLoading } = useDeployedContractInfo({
    contractName: "WorkRegistry",
    chainId: hardhat.id,
  });
  const { data: work, error } = useScaffoldReadContract({
    contractName: "WorkRegistry",
    functionName: "works",
    args: [fileHash],
    chainId: hardhat.id,
    query: { retry: false },
  });
  if (error || (!isContractLoading && !contract))
    return (
      <div role="alert" className="alert alert-error flex flex-wrap">
        <span>Không đọc được blockchain. Kiểm tra mạng local và triển khai contract theo README.</span>
        <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    );
  if (!work) return <p role="status">Đang tra cứu bản ghi trên blockchain…</p>;
  if (work[0] === zeroAddress)
    return (
      <div role="status" className="alert alert-info text-base-content">
        <div>
          <p className="m-0 font-semibold">Chưa tìm thấy bản ghi đăng ký</p>
          <p className="mb-0 text-sm">
            Hash này chưa có trong hệ thống hiện tại. File đã chỉnh sửa hoặc đổi định dạng có thể có hash khác.
          </p>
        </div>
      </div>
    );
  return (
    <section className="card border border-success/30 bg-base-100" aria-label="Kết quả xác minh">
      <div className="card-body gap-5">
        <div role="status" className="flex flex-wrap items-center gap-2">
          <span className="badge badge-success">Đã có bản ghi đăng ký</span>
          <span className="badge badge-outline">{WORK_TYPE_LABELS[work[4]]}</span>
        </div>
        <h2 className="card-title break-words">{work[2]}</h2>
        {work[3] && <p className="m-0 whitespace-pre-wrap break-words">{work[3]}</p>}
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="mb-1 font-semibold">Ví đăng ký</dt>
            <dd className="m-0">
              <Address address={work[0]} chain={hardhat} />
            </dd>
          </div>
          <div>
            <dt className="mb-1 font-semibold">Thời điểm ghi nhận (giờ Việt Nam)</dt>
            <dd className="m-0">
              {new Date(Number(work[1]) * 1000).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
            </dd>
          </div>
          <div>
            <dt className="mb-1 font-semibold">Hash SHA-256</dt>
            <dd className="m-0 break-all font-mono text-xs">{fileHash}</dd>
          </div>
        </dl>
        <p className="m-0 text-xs text-base-content/60">
          Bản ghi xác nhận ví đã đăng ký hash tại thời điểm trên; không xác minh danh tính thật hay người sáng tạo tác
          phẩm.
        </p>
      </div>
    </section>
  );
}
