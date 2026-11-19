"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import { zeroAddress } from "viem";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { WorkFilePicker } from "~~/components/works/WorkFilePicker";
import { WorkRecord } from "~~/components/works/WorkRecord";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";
import { SelectedWorkFile, getWorkMetadataError } from "~~/utils/workFiles";

export default function RegisterWorkPage() {
  const { isConnected, chainId } = useAccount();
  const [selection, setSelection] = useState<SelectedWorkFile>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}`>();
  const { data: contract, isLoading: isContractLoading } = useDeployedContractInfo({
    contractName: "WorkRegistry",
    chainId: hardhat.id,
  });
  const contractUnavailable = !isContractLoading && !contract;

  const {
    data: work,
    isFetching,
    error: readError,
    refetch,
  } = useScaffoldReadContract({
    contractName: "WorkRegistry",
    functionName: "works",
    args: [selection?.fileHash],
    chainId: hardhat.id,
    query: { retry: false },
  });
  const { data: paused, error: pauseError } = useScaffoldReadContract({
    contractName: "WorkRegistry",
    functionName: "paused",
    chainId: hardhat.id,
    query: { retry: false },
  });
  const { writeContractAsync, isPending, isMining } = useScaffoldWriteContract({
    contractName: "WorkRegistry",
    chainId: hardhat.id,
  });
  const isRegistered = Boolean(work && work[0] !== zeroAddress);
  const metadataError = getWorkMetadataError(title, description);
  const busy = isHashing || isSubmitting;

  function handleSelection(value: SelectedWorkFile | undefined) {
    setSelection(value);
    setError("");
    setTxHash(undefined);
    if (value) setTitle(value.file.name.replace(/\.[^.]+$/, ""));
  }

  async function handleRegister(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!selection || busy) return;
    if (!isConnected || chainId !== hardhat.id) {
      setError("Hãy kết nối ví với mạng Hardhat local trước khi đăng ký.");
      return;
    }
    if (metadataError) {
      setError(metadataError);
      return;
    }
    setIsSubmitting(true);
    try {
      const current = await refetch();
      if (current.error || !current.data)
        throw new Error("Không đọc được blockchain. Kiểm tra mạng local và triển khai contract.");
      if (current.data[0] !== zeroAddress) {
        setError("File này đã được đăng ký. Bạn có thể tra cứu bằng chức năng Xác minh.");
        return;
      }
      const hash = await writeContractAsync({
        functionName: "registerWork",
        args: [selection.fileHash, title.trim(), description.trim(), selection.workType],
      });
      if (!hash) {
        setError("Chưa gửi được giao dịch. Hãy kiểm tra thông báo của ví.");
        return;
      }
      const updated = await refetch();
      setTxHash(hash);
      if (updated.error) notification.warning("Giao dịch đã thành công. Hãy tải lại trang để đọc bản ghi.");
    } catch (err) {
      setError(getParsedError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <span className="badge badge-outline mb-4">Bước 1 · Ghi nhận tác phẩm</span>
      <h1 className="text-3xl font-bold tracking-tight">Đăng ký tác phẩm số</h1>
      <p className="text-base-content/70">
        Chọn file, bổ sung thông tin và xác nhận bằng ví. Hệ thống lưu dấu vân tay số; bạn tự giữ file gốc.
      </p>
      <form onSubmit={handleRegister} className="card border border-base-300 bg-base-100 mt-6 shadow-sm">
        <div className="card-body gap-6 p-5 sm:p-8">
          <WorkFilePicker
            value={selection}
            onChange={handleSelection}
            onBusyChange={setIsHashing}
            disabled={isSubmitting}
          />
          <fieldset disabled={busy || Boolean(txHash)} className="space-y-4">
            <div>
              <label htmlFor="work-title" className="label font-semibold text-base-content">
                Tên tác phẩm <span className="text-error">*</span>
              </label>
              <input
                id="work-title"
                className="input input-bordered w-full"
                value={title}
                onChange={event => {
                  setTitle(event.target.value);
                  setError("");
                }}
                required
                placeholder="Ví dụ: Một buổi sáng ở UET"
              />
            </div>
            <div>
              <label htmlFor="work-description" className="label font-semibold text-base-content">
                Mô tả <span className="font-normal text-base-content/60">(không bắt buộc)</span>
              </label>
              <textarea
                id="work-description"
                className="textarea textarea-bordered w-full min-h-28"
                value={description}
                onChange={event => {
                  setDescription(event.target.value);
                  setError("");
                }}
                placeholder="Giới thiệu ngắn về tác phẩm…"
              />
            </div>
          </fieldset>
          {title && metadataError && (
            <p role="alert" className="text-error text-sm">
              {metadataError}
            </p>
          )}
          {selection && isFetching && (
            <p role="status" className="text-sm">
              Đang kiểm tra bản ghi…
            </p>
          )}
          {(readError || pauseError || contractUnavailable) && (
            <div role="alert" className="alert alert-error">
              Không kết nối được contract. Kiểm tra blockchain local và hướng dẫn chạy trong README.
            </div>
          )}
          {paused && (
            <div role="alert" className="alert alert-warning">
              Hệ thống đang tạm dừng đăng ký. Bạn vẫn có thể xác minh tác phẩm.
            </div>
          )}
          {selection && isRegistered && !txHash && (
            <div role="status" className="alert alert-info text-base-content block">
              <p className="mt-0 font-semibold">File này đã được đăng ký: {work?.[2]}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span>Ví đăng ký:</span>
                <Address address={work?.[0]} chain={hardhat} />
              </div>
              <Link href={`/works/verify?hash=${selection.fileHash}`} className="link mt-2 inline-block">
                Đến trang xác minh
              </Link>
            </div>
          )}
          {!isConnected && (
            <p className="m-0 text-sm text-base-content/70">
              Kết nối ví ở đầu trang để đăng ký. Với ví thử nghiệm, dùng nút faucet ở đầu trang để nhận ETH local.
            </p>
          )}
          {isConnected && chainId !== hardhat.id && (
            <p role="alert" className="text-warning">
              Chuyển ví sang mạng Hardhat local (Chain ID 31337).
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={
              !selection ||
              !isConnected ||
              chainId !== hardhat.id ||
              busy ||
              isFetching ||
              !work ||
              Boolean(readError || pauseError || metadataError) ||
              paused !== false ||
              isRegistered
            }
          >
            {isPending
              ? "Chờ xác nhận trong ví…"
              : isMining || isSubmitting
                ? "Đang xác nhận giao dịch…"
                : "Ký và đăng ký tác phẩm"}
          </button>
          {error && (
            <p role="alert" className="text-error break-words">
              {error}
            </p>
          )}
          {txHash && selection && (
            <div role="status" className="alert alert-success block space-y-3">
              <p className="m-0 font-semibold">Đăng ký tác phẩm thành công!</p>
              <p className="m-0 text-sm">Mã giao dịch:</p>
              <Link href={`/blockexplorer/transaction/${txHash}`} className="link block break-all font-mono text-xs">
                {txHash}
              </Link>
              <div className="flex flex-wrap gap-2">
                <Link href={`/works/verify?hash=${selection.fileHash}`} className="btn btn-sm">
                  Xác minh lại tác phẩm
                </Link>
                <Link href="/works" className="btn btn-sm">
                  Xem danh sách tác phẩm
                </Link>
              </div>
            </div>
          )}
          <p className="m-0 text-xs text-base-content/60">
            Tên, mô tả, hash và ví đăng ký có thể được người khác tra cứu. Chữ ký xác thực ví thực hiện giao dịch; không
            tự xác nhận quyền tác giả.
          </p>
        </div>
      </form>
      {txHash && selection && (
        <div className="mt-6">
          <WorkRecord fileHash={selection.fileHash} />
        </div>
      )}
    </div>
  );
}
