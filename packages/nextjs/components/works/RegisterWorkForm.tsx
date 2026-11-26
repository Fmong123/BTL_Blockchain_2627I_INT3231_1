"use client";

import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import { useAccount } from "wagmi";
import {
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "~~/components/PageHeader";
import { InfoSection } from "~~/components/copyright/InfoSection";
import { LegalContext } from "~~/components/copyright/LegalContext";
import { Notice } from "~~/components/copyright/Notice";
import { WalletSession, copyrightApi, useWalletSession } from "~~/components/copyright/WalletSession";
import { WorkDetailsFields, WorkDetailsSummary, emptyWorkDetails } from "~~/components/copyright/WorkDetailsFields";
import { WorkFilePicker } from "~~/components/works/WorkFilePicker";
import { copyrightChain, copyrightDeployment, transactionUrl } from "~~/copyright.config";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { hashSchema, preparationIdSchema, registrationSchema, workDetailsSchema } from "~~/utils/copyrightDetails";
import { DraftEntry, readDraft, saveDraft } from "~~/utils/registrationDraft";
import { submitRegistration } from "~~/utils/registrationFlow";
import { getParsedError } from "~~/utils/scaffold-eth";
import { SelectedWorkFile, getWorkMetadataError } from "~~/utils/workFiles";

type RegistrationResult = {
  txHash: `0x${string}`;
  fileHash: `0x${string}`;
  title: string;
  saved: boolean;
  confirmed?: boolean;
  preparationId?: string;
};

export function RegisterWorkForm() {
  const { address, chainId } = useAccount();
  return <RegisterWorkForAccount key={`${address}:${chainId}`} />;
}

function RegisterWorkForAccount() {
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const { isConnected, chainId } = useAccount();
  const { signedIn, wallet } = useWalletSession();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const stepsRef = useRef<HTMLOListElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    stepsRef.current?.scrollIntoView({ block: "start" });
    stepsRef.current?.focus({ preventScroll: true });
  }, [step]);
  const [selection, setSelection] = useState<SelectedWorkFile>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState(emptyWorkDetails);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [publicConfirmed, setPublicConfirmed] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RegistrationResult>();
  const [resumeDraft, setResumeDraft] = useState<DraftEntry>();
  const storageKey = `bqs-registration:${copyrightChain.id}:${copyrightDeployment?.address.toLowerCase()}:${wallet}`;
  useEffect(() => {
    if (!wallet) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (
        hashSchema.safeParse(saved.txHash).success &&
        hashSchema.safeParse(saved.fileHash).success &&
        typeof saved.title === "string" &&
        (saved.preparationId === undefined || preparationIdSchema.safeParse(saved.preparationId).success)
      ) {
        setResult({
          txHash: saved.txHash,
          fileHash: saved.fileHash,
          title: saved.title,
          saved: false,
          confirmed: saved.confirmed === true,
          preparationId: saved.preparationId,
        });
        setStep(4);
      }
    } catch {
      /* Storage may be disabled; the server still retains the prepared draft. */
    }
  }, [storageKey, wallet]);
  const editKey = storageKey + ":editing";
  const canSaveDraft = Boolean(wallet && copyrightDeployment && chainId === copyrightChain.id);
  useEffect(() => {
    if (canSaveDraft) setResumeDraft(readDraft(editKey));
  }, [canSaveDraft, editKey]);
  useEffect(() => {
    if (canSaveDraft && selection && !result && step >= 2) {
      saveDraft(editKey, { fileHash: selection.fileHash, fileName: selection.file.name, title, description, details });
    }
  }, [canSaveDraft, description, details, editKey, result, selection, step, title]);
  const { data: contract, isLoading: isContractLoading } = useDeployedContractInfo({
    contractName: "WorkRegistry",
    chainId: copyrightChain.id,
  });
  const {
    data: work,
    isFetching,
    error: readError,
    refetch,
  } = useScaffoldReadContract({
    contractName: "WorkRegistry",
    functionName: "works",
    args: [selection?.fileHash],
    chainId: copyrightChain.id,
    query: { retry: false },
  });
  const pause = useScaffoldReadContract({
    contractName: "WorkRegistry",
    functionName: "paused",
    chainId: copyrightChain.id,
    query: { retry: false },
  });
  const { writeContractAsync, isPending, isMining } = useScaffoldWriteContract({
    contractName: "WorkRegistry",
    chainId: copyrightChain.id,
  });
  const isRegistered = Boolean(work && work[0] !== zeroAddress);
  const busy = isHashing || isSubmitting;
  const unavailable = !isContractLoading && !contract;

  function handleSelection(value: SelectedWorkFile | undefined) {
    if (value && resumeDraft && value.fileHash !== resumeDraft.fileHash) {
      setError("Tệp này khác hash của bản nháp. Chọn lại đúng tệp gốc hoặc bỏ bản nháp để bắt đầu với tệp khác.");
      return;
    }
    setSelection(value);
    setError("");
    setRightsConfirmed(false);
    setPublicConfirmed(false);
    if (value) {
      if (resumeDraft) {
        setTitle(resumeDraft.title);
        setDescription(resumeDraft.description);
        setDetails(resumeDraft.details);
        setResumeDraft(undefined);
        return;
      }
      setTitle(value.file.name.replace(/\.[^.]+$/, ""));
      setDescription("");
      setDetails({
        ...emptyWorkDetails(),
        category: value.workType === 0 ? "Logo / thiết kế" : value.workType === 1 ? "Bản ghi" : "Tài liệu",
      });
    }
  }
  function payload() {
    return {
      fileHash: selection?.fileHash,
      workType: selection?.workType,
      title,
      description,
      details,
      rightsConfirmed,
      publicConfirmed,
    };
  }
  function review(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const checked = registrationSchema.safeParse({ ...payload(), rightsConfirmed: true, publicConfirmed: true });
    if (!checked.success) {
      setError(checked.error.issues[0].message);
      return;
    }
    setStep(3);
  }
  async function finish(pending: RegistrationResult) {
    await copyrightApi(
      "registration",
      "POST",
      { txHash: pending.txHash, fileHash: pending.fileHash, preparationId: pending.preparationId },
      wallet,
    );
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Retry is idempotent. */
    }
    saveDraft(editKey);
    if (!active.current) return;
    setResult({ ...pending, saved: true, confirmed: true });
    await queryClient.invalidateQueries({ queryKey: ["copyright"] });
  }
  async function retrySave() {
    if (!result || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await finish(result);
    } catch (err) {
      if (active.current) setError(getParsedError(err));
    } finally {
      if (active.current) setIsSubmitting(false);
    }
  }
  async function register() {
    if (!selection || busy || result) return;
    setError("");
    const checked = registrationSchema.safeParse(payload());
    if (!checked.success) {
      setError(checked.error.issues[0].message);
      return;
    }
    if (!signedIn || chainId !== copyrightChain.id) {
      setError("Đăng nhập bằng đúng ví và mạng trước khi ghi nhận.");
      return;
    }
    setIsSubmitting(true);
    const currentSelection = selection;
    let preparationId: string | undefined;
    const remember = (hash: `0x${string}`, confirmed = true) => {
      const pending = {
        txHash: hash,
        fileHash: currentSelection.fileHash,
        title: checked.data.title,
        saved: false,
        confirmed,
        preparationId,
      };
      if (active.current) {
        setResult(pending);
        setStep(4);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(pending));
      } catch {
        /* Preserve current state and continue finalization if storage is unavailable. */
      }
    };
    try {
      const outcome = await submitRegistration({
        prepare: async () => {
          const [current, status] = await Promise.all([refetch(), pause.refetch()]);
          if (current.error || !current.data || status.data !== false)
            throw new Error("Không đọc được blockchain hoặc đăng ký đang tạm dừng.");
          if (current.data[0] !== zeroAddress) throw new Error("Tệp đã được ghi nhận. Hãy mở trang xác minh.");
          if (!active.current) throw new Error("Ví đã thay đổi. Hãy kiểm tra lại hồ sơ.");
          const prepared = await copyrightApi<{ preparationId: string }>("registration", "PUT", checked.data, wallet);
          preparationId = preparationIdSchema.parse(prepared.preparationId);
        },
        send: async (broadcast, confirmed) => {
          if (!active.current) throw new Error("Ví đã thay đổi. Chưa gửi giao dịch.");
          return writeContractAsync(
            {
              functionName: "registerWork",
              args: [
                currentSelection.fileHash,
                checked.data.title,
                checked.data.description,
                currentSelection.workType,
              ],
            },
            {
              notificationContext: `Đăng ký tác phẩm ${currentSelection.fileHash}`,
              onSuccess: broadcast,
              onBlockConfirmation: receipt => confirmed(receipt.transactionHash),
            },
          );
        },
        remember,
        finalize: hash =>
          finish({
            txHash: hash,
            fileHash: currentSelection.fileHash,
            title: checked.data.title,
            preparationId,
            saved: false,
          }),
      });
      if (active.current && !outcome.saved) setError(outcome.error || "Chưa lưu được hồ sơ.");
    } catch (err) {
      if (active.current) setError(getParsedError(err));
    } finally {
      if (active.current) setIsSubmitting(false);
    }
  }

  return (
    <div className="bqs-page">
      <PageHeader
        title="Đăng ký tác phẩm"
        description="Chuẩn bị đủ thông tin, kiểm tra rồi ghi nhận trên blockchain."
        backHref="/works"
        backLabel="Tác phẩm"
      />
      <div className="bqs-registration-layout">
        <div className="bqs-registration-main min-w-0">
          <ol ref={stepsRef} tabIndex={-1} className="bqs-process-steps" aria-label="Tiến trình đăng ký">
            {["Chọn tệp", "Khai thông tin", "Kiểm tra", "Hoàn tất"].map((label, i) => (
              <li
                key={label}
                aria-current={step === i + 1 ? "step" : undefined}
                className={step >= i + 1 ? "is-active" : ""}
              >
                <span>{step > i + 1 ? <CheckCircleIcon aria-hidden="true" /> : i + 1}</span>
                <strong>{label}</strong>
              </li>
            ))}
          </ol>
          {!result && step === 1 && (
            <InfoSection
              title="1. Chọn tệp gốc"
              icon={<FolderOpenIcon />}
              description="Tính dấu vân tay số và kiểm tra tệp đã được ghi nhận hay chưa."
            >
              {(!isConnected || chainId !== copyrightChain.id) && (
                <div className="bqs-inset-panel mb-5">
                  <p className="m-0">
                    Kết nối ví trên mạng {copyrightChain.name} trước khi chọn tệp để hồ sơ gắn đúng ví ngay từ đầu.
                  </p>
                  <WalletSession />
                </div>
              )}
              <WorkFilePicker
                value={selection}
                onChange={handleSelection}
                onBusyChange={setIsHashing}
                disabled={busy || !isConnected || chainId !== copyrightChain.id}
              />
              {resumeDraft && (
                <Notice title="Có bản nháp trên trình duyệt">
                  <p className="m-0">Chọn lại tệp {resumeDraft.fileName} để đối chiếu hash và tiếp tục.</p>
                  <button
                    className="btn btn-outline btn-sm"
                    type="button"
                    onClick={() => {
                      saveDraft(editKey);
                      setResumeDraft(undefined);
                      setError("");
                    }}
                  >
                    Bỏ bản nháp
                  </button>
                </Notice>
              )}
              {selection && isFetching && (
                <p role="status" className="bqs-help">
                  Đang đối chiếu trên blockchain…
                </p>
              )}
              {isRegistered && (
                <Notice role="status" tone="info">
                  <p className="m-0">
                    Tệp này đã được ghi nhận: <strong>{work?.[2]}</strong>.
                  </p>
                  <Link className="link" href={`/works/verify?hash=${selection?.fileHash}`}>
                    Mở thông tin tác phẩm
                  </Link>
                </Notice>
              )}
              <div className="bqs-form-actions bqs-form-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    !selection ||
                    !isConnected ||
                    chainId !== copyrightChain.id ||
                    busy ||
                    isFetching ||
                    !work ||
                    isRegistered ||
                    Boolean(readError || pause.error) ||
                    pause.data !== false
                  }
                  onClick={() => setStep(2)}
                >
                  Tiếp tục: khai thông tin
                </button>
              </div>
            </InfoSection>
          )}
          {!result && step === 2 && (
            <form onSubmit={review} className="bqs-form space-y-5">
              <InfoSection
                title="2. Thông tin tác phẩm"
                description="Các mục có dấu * cần được khai trước khi ghi nhận."
                icon={<DocumentTextIcon />}
              >
                <fieldset disabled={busy} className="space-y-4">
                  <label className="block">
                    <span className="label">
                      Tên tác phẩm <span className="text-error">*</span>
                    </span>
                    <input
                      id="work-title"
                      required
                      className="input input-bordered w-full"
                      value={title}
                      onChange={event => setTitle(event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="label">
                      Tóm tắt nội dung <span className="text-error">*</span>
                    </span>
                    <textarea
                      id="work-description"
                      required
                      className="textarea textarea-bordered w-full min-h-28"
                      value={description}
                      onChange={event => setDescription(event.target.value)}
                      placeholder="Nội dung chính, đặc điểm và phạm vi của tác phẩm…"
                    />
                  </label>
                  {getWorkMetadataError(title, description) && (
                    <p className="text-error text-sm">{getWorkMetadataError(title, description)}</p>
                  )}
                </fieldset>
              </InfoSection>
              <InfoSection
                title="Tác giả và căn cứ quyền"
                icon={<UsersIcon />}
                description="Khai đúng vai trò; ví gửi giao dịch không tự động được coi là tác giả."
              >
                <fieldset disabled={busy}>
                  <WorkDetailsFields value={details} onChange={setDetails} registration />
                </fieldset>
              </InfoSection>
              <div className="bqs-form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                  Quay lại chọn tệp
                </button>
                <button type="submit" className="btn btn-primary">
                  Kiểm tra hồ sơ
                </button>
              </div>
            </form>
          )}
          {!result && step === 3 && (
            <InfoSection
              title="3. Kiểm tra trước khi ghi nhận"
              icon={<ClipboardDocumentCheckIcon />}
              description="Tên, tóm tắt, hash và ví ghi trên blockchain sẽ không sửa được."
            >
              <dl className="bqs-info-grid mb-5">
                <div>
                  <dt>Tên tác phẩm</dt>
                  <dd>{title}</dd>
                </div>
                <div>
                  <dt>Tệp đã chọn</dt>
                  <dd>{selection?.file.name}</dd>
                </div>
                <div className="bqs-span-all">
                  <dt>Tóm tắt nội dung</dt>
                  <dd className="whitespace-pre-wrap">{description}</dd>
                </div>
                <div className="bqs-span-all">
                  <dt>Hash SHA-256</dt>
                  <dd className="bqs-code">{selection?.fileHash}</dd>
                </div>
              </dl>
              <WorkDetailsSummary details={workDetailsSchema.parse(details)} />
              <div className="bqs-inset-panel mt-5 space-y-4">
                <label className="bqs-check-label">
                  <input
                    className="checkbox checkbox-sm"
                    type="checkbox"
                    checked={rightsConfirmed}
                    onChange={event => setRightsConfirmed(event.target.checked)}
                    disabled={busy}
                  />
                  <span>
                    Tôi có quyền kê khai hoặc được đại diện hợp pháp; thông tin là trung thực và đã có sự đồng ý / cho
                    phép cần thiết của các bên liên quan. Tôi chịu trách nhiệm về nội dung tự khai.
                  </span>
                </label>
                <label className="bqs-check-label">
                  <input
                    className="checkbox checkbox-sm"
                    type="checkbox"
                    checked={publicConfirmed}
                    onChange={event => setPublicConfirmed(event.target.checked)}
                    disabled={busy}
                  />
                  <span>
                    Tôi đồng ý công khai các thông tin trên và hiểu đây là bản ghi blockchain kèm hồ sơ tự khai, không
                    phải Giấy chứng nhận đăng ký quyền tác giả của cơ quan nhà nước.
                  </span>
                </label>
              </div>
              <div className="bqs-inset-panel mt-5">
                <h3>Ví thực hiện và lưu hồ sơ</h3>
                <p className="bqs-help">
                  Đăng nhập bằng chữ ký thông điệp không mất gas. Giao dịch ghi blockchain ở bước sau có phí mạng.
                </p>
                <WalletSession />
              </div>
              <div className="bqs-form-actions mt-5">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busy}
                  onClick={() => {
                    setRightsConfirmed(false);
                    setPublicConfirmed(false);
                    setStep(2);
                  }}
                >
                  Sửa thông tin
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={register}
                  disabled={
                    !signedIn ||
                    !isConnected ||
                    chainId !== copyrightChain.id ||
                    busy ||
                    !rightsConfirmed ||
                    !publicConfirmed ||
                    pause.data !== false ||
                    isRegistered
                  }
                >
                  {isPending
                    ? "Chờ xác nhận trong ví…"
                    : isMining
                      ? "Đang xác nhận giao dịch…"
                      : isSubmitting
                        ? "Đang lưu hồ sơ…"
                        : "Ký và ghi nhận tác phẩm"}
                </button>
              </div>
            </InfoSection>
          )}
          {result && (
            <InfoSection
              title={
                result.saved
                  ? "Đã ghi nhận tác phẩm và lưu hồ sơ"
                  : result.confirmed
                    ? "Đã ghi blockchain · hồ sơ đang chờ hoàn tất"
                    : "Đã gửi giao dịch · chờ đối chiếu"
              }
              icon={<CheckCircleIcon />}
            >
              <h3>{result.title}</h3>
              <p>
                {result.saved
                  ? "Bạn có thể xem thông tin đã khai, xác minh hoặc quản lý giấy phép ngay."
                  : result.confirmed
                    ? "Giao dịch đã được xác nhận. Hoàn tất lưu hồ sơ bằng nút bên dưới; không cần đăng ký lại hoặc trả thêm phí blockchain."
                    : "Hệ thống đang chờ giao dịch được xác nhận. Nếu kết nối bị gián đoạn, thử đối chiếu lại bằng nút dưới; không gửi giao dịch mới khi chưa kiểm tra trạng thái."}
              </p>
              <a href={transactionUrl(result.txHash)} className="link bqs-code block">
                {result.txHash}
              </a>
              {result.preparationId && !result.saved && (
                <div className="bqs-inset-panel mt-4">
                  <p className="bqs-help">
                    Mã hồ sơ chuẩn bị · giữ cùng mã giao dịch để khôi phục đúng bản đã kiểm tra.
                  </p>
                  <p className="bqs-code m-0">{result.preparationId}</p>
                </div>
              )}
              {!result.saved && (
                <div className="bqs-inset-panel mt-4 space-y-3">
                  <WalletSession />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!signedIn || isSubmitting}
                    onClick={retrySave}
                  >
                    {isSubmitting ? "Đang xác nhận và lưu…" : "Đối chiếu giao dịch và lưu hồ sơ"}
                  </button>
                  <p className="bqs-help">
                    Giữ mã giao dịch và mã hồ sơ chuẩn bị để đối chiếu nếu đổi trình duyệt. Hồ sơ nháp vẫn được lưu trên
                    máy chủ.
                  </p>
                </div>
              )}
              <div className="bqs-form-actions mt-5">
                <Link className="btn btn-outline" href={`/works/verify?hash=${result.fileHash}`}>
                  Xem chi tiết tác phẩm
                </Link>
                <Link className="btn btn-outline" href="/my">
                  Quản lý của tôi
                </Link>
                {
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() => {
                      try {
                        localStorage.removeItem(storageKey);
                      } catch {
                        /* The prepared server draft remains available. */
                      }
                      saveDraft(editKey);
                      setResumeDraft(undefined);
                      setResult(undefined);
                      setSelection(undefined);
                      setStep(1);
                      setDescription("");
                      setError("");
                    }}
                  >
                    {result.saved ? "Đăng ký tác phẩm khác" : "Bắt đầu hồ sơ khác"}
                  </button>
                }
              </div>
            </InfoSection>
          )}
          {!result && (readError || pause.error || unavailable) && (
            <Notice role="alert" tone="error">
              <span>Chưa kết nối được blockchain hoặc contract trên {copyrightChain.name}.</span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  unavailable ? window.location.reload() : void Promise.all([refetch(), pause.refetch()])
                }
              >
                Thử lại
              </button>
            </Notice>
          )}
          {!result && pause.data === true && (
            <Notice role="alert" tone="warning">
              Đăng ký đang tạm dừng. Bạn vẫn có thể tra cứu tác phẩm.
            </Notice>
          )}
          {error && (
            <Notice role="alert" tone="error">
              {error}
            </Notice>
          )}
          <LegalContext />
          {isConnected && chainId === copyrightChain.id && (
            <details className="bqs-context border border-base-300 rounded-box bg-base-100">
              <summary>
                <ClipboardDocumentCheckIcon aria-hidden="true" />
                Khôi phục hồ sơ từ giao dịch đã gửi
              </summary>
              <form
                className="bqs-context-body bqs-form space-y-4"
                onSubmit={event => {
                  event.preventDefault();
                  const fields = new FormData(event.currentTarget);
                  const tx = hashSchema.safeParse(fields.get("recovery-tx"));
                  const hash = hashSchema.safeParse(fields.get("recovery-hash"));
                  const preparation = String(fields.get("recovery-preparation") ?? "").trim();
                  const checkedPreparation = preparationIdSchema.optional().safeParse(preparation || undefined);
                  if (!tx.success || !hash.success) {
                    setError("Nhập đầy đủ mã giao dịch và hash tệp dạng 0x + 64 ký tự hex.");
                    return;
                  }
                  if (!checkedPreparation.success) {
                    setError("Mã hồ sơ chuẩn bị phải có dạng 0x + 64 ký tự hex; bản nháp cũ dùng legacy.");
                    return;
                  }
                  setResult({
                    txHash: tx.data,
                    fileHash: hash.data,
                    preparationId: checkedPreparation.data,
                    title: "Hồ sơ đang khôi phục",
                    saved: false,
                  });
                  setStep(4);
                  setError("");
                }}
              >
                <p>
                  Chỉ dùng cho tác phẩm đã chuẩn bị hồ sơ qua quy trình này. Lấy mã giao dịch đăng ký từ ví; nếu đã tăng
                  tốc, dùng mã giao dịch mới. Bước này không gửi giao dịch blockchain.
                </p>
                <label className="block">
                  <span className="label">Mã giao dịch đăng ký</span>
                  <input
                    className="input input-bordered w-full font-mono"
                    name="recovery-tx"
                    required
                    defaultValue={result?.txHash}
                    placeholder="0x…"
                  />
                </label>
                <label className="block">
                  <span className="label">Hash SHA-256 của tệp</span>
                  <input
                    className="input input-bordered w-full font-mono"
                    name="recovery-hash"
                    required
                    defaultValue={result?.fileHash}
                    placeholder="0x…"
                  />
                </label>
                <label className="block">
                  <span className="label">Mã hồ sơ chuẩn bị (nếu có)</span>
                  <input
                    className="input input-bordered w-full font-mono"
                    name="recovery-preparation"
                    defaultValue={result?.preparationId}
                    placeholder="0x…"
                    aria-describedby="recovery-preparation-help"
                  />
                  <span id="recovery-preparation-help" className="bqs-help block mt-2">
                    Lấy từ bước chờ hoàn tất. Có thể để trống khi chỉ có một bản nháp; nếu có nhiều bản, cần mã để chọn
                    đúng hồ sơ.
                  </span>
                </label>
                <button className="btn btn-outline" disabled={busy}>
                  Mở bước khôi phục
                </button>
              </form>
            </details>
          )}
        </div>
        <aside className="bqs-registration-aside">
          <InfoSection title="Chuẩn bị trước khi ký" icon={<ClipboardDocumentCheckIcon />}>
            <ul className="bqs-guidance-list">
              <li>Tệp gốc hoàn chỉnh để tính hash.</li>
              <li>Tên, tóm tắt và ngày hoàn thành tác phẩm.</li>
              <li>Tác giả, chủ sở hữu và căn cứ quyền.</li>
              <li>Đồng ý / ủy quyền khi có nhiều bên hoặc đại diện.</li>
              <li>Ví đúng mạng {copyrightChain.name} và ETH trả phí.</li>
            </ul>
            <p className="bqs-help mt-4">
              Tệp gốc ở trên thiết bị của bạn. Hồ sơ tự khai được lưu riêng; hệ thống không lưu bản sao tệp để tải lại.
            </p>
          </InfoSection>
        </aside>
      </div>
    </div>
  );
}
