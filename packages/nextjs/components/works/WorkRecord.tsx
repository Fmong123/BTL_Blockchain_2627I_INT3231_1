"use client";

import { Address } from "@scaffold-ui/components";
import { zeroAddress } from "viem";
import { hardhat } from "viem/chains";
import { WorkLicenses } from "~~/components/licenses/WorkLicenses";
import { WORK_CATEGORIES, WorkArt } from "~~/components/works/WorkArt";
import { WorkHash } from "~~/components/works/WorkHash";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function WorkRecord({ fileHash, headingLevel = 2 }: { fileHash: `0x${string}`; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
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
        <Heading className="sr-only">Không đọc được tác phẩm</Heading>
        <span>Không đọc được blockchain. Kiểm tra mạng local và triển khai contract theo README.</span>
        <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    );
  if (!work)
    return (
      <>
        <Heading className="sr-only">Chi tiết tác phẩm</Heading>
        <p role="status">Đang tra cứu bản ghi trên blockchain…</p>
      </>
    );
  if (work[0] === zeroAddress)
    return (
      <div role="status" className="alert alert-info text-base-content">
        <Heading className="sr-only">Chưa tìm thấy tác phẩm</Heading>
        <div>
          <p className="m-0 font-semibold">Chưa tìm thấy bản ghi đăng ký</p>
          <p className="mb-0 text-sm">
            Hash này chưa có trong hệ thống hiện tại. File đã chỉnh sửa hoặc đổi định dạng có thể có hash khác.
          </p>
        </div>
      </div>
    );
  const workType = work[4];
  if (workType !== 0 && workType !== 1 && workType !== 2)
    return (
      <div role="alert" className="alert alert-error">
        <Heading>Loại tác phẩm không được hỗ trợ</Heading>
      </div>
    );
  return (
    <>
      <section className="bqs-work-detail" aria-label="Kết quả xác minh">
        <WorkArt workType={workType} title={work[2]} />
        <div className="min-w-0">
          <div className="bqs-work-category">{WORK_CATEGORIES[workType]}</div>
          <Heading className="break-words">{work[2]}</Heading>
          {work[3] && <p className="bqs-work-description">{work[3]}</p>}
          <dl className="bqs-work-data">
            <dt>Ví đăng ký</dt>
            <dd>
              <Address address={work[0]} chain={hardhat} size="base" onlyEnsOrAddress />
            </dd>
            <dt>Ngày ghi nhận</dt>
            <dd>{new Date(Number(work[1]) * 1000).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</dd>
            <dt>Hash SHA-256</dt>
            <dd>
              <WorkHash fileHash={fileHash} />
            </dd>
          </dl>
          <span role="status" className="badge badge-success mt-4">
            Đã có bản ghi đăng ký
          </span>
        </div>
      </section>
      <WorkLicenses fileHash={fileHash} registrant={work[0]} />
    </>
  );
}
