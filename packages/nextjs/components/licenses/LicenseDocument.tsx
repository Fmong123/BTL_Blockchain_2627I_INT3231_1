"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { zeroAddress } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  CubeTransparentIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  PrinterIcon,
  QrCodeIcon,
  UsersIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "~~/components/PageHeader";
import { LicenseTermsPanel } from "~~/components/copyright/LicenseTermsPanel";
import type { LicenseTerms } from "~~/components/copyright/LicenseTermsPanel";
import { WalletSession, copyrightApi, useWalletSession } from "~~/components/copyright/WalletSession";
import { copyrightChain, copyrightDeployment, transactionUrl } from "~~/copyright.config";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { readEventLogs } from "~~/utils/eventLogs";
import { readLicenseDocumentSnapshot } from "~~/utils/licenseSnapshot";
import { LICENSE_STATUS_LABELS, LICENSE_TERMS, formatVietnamTimestamp, getLicenseStatus } from "~~/utils/licenses";
import { LicenseIdentity, licensePath, matchesLicenseIdentity, publicUrl, verificationPath } from "~~/utils/shareLinks";

function DocumentField({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="bqs-document-field">
      <dt>{label}</dt>
      <dd className={mono ? "bqs-document-code" : undefined}>{children}</dd>
    </div>
  );
}

export function LicenseDocument({ id, expectedIdentity }: { id: bigint; expectedIdentity?: LicenseIdentity }) {
  const [origin, setOrigin] = useState("");
  const [action, setAction] = useState<"refresh" | "print" | "download" | "evidence" | null>(null);
  const exportMenu = useRef<HTMLDetailsElement>(null);
  const [actionError, setActionError] = useState("");
  const [feedback, setFeedback] = useState("");
  const queryClient = useQueryClient();
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const client = usePublicClient({ chainId: copyrightChain.id });
  const { data: contract, isLoading: contractLoading } = useScaffoldContract({
    contractName: "WorkRegistry",
    chainId: copyrightChain.id,
  });
  const record = useQuery({
    queryKey: ["license-document", copyrightChain.id, contract?.address, id.toString()],
    enabled: Boolean(contract && client),
    retry: false,
    refetchInterval: action ? false : 3000,
    queryFn: async () => {
      if (!contract || !client) throw new Error("Chưa kết nối được blockchain.");
      return readLicenseDocumentSnapshot(id, {
        getLatestBlock: () => client.getBlock({ blockTag: "latest" }),
        readLicense: async (licenseId, blockNumber) => {
          const data = await contract.read.licenses([licenseId], { blockNumber });
          return data[1] === zeroAddress
            ? null
            : {
                id: licenseId,
                fileHash: data[0],
                licensor: data[1],
                licensee: data[2],
                grantedAt: data[3],
                expiresAt: data[4],
                revoked: data[5],
              };
        },
        readGrant: async (licenseId, blockNumber) =>
          (
            await readEventLogs(BigInt(copyrightDeployment?.deployedOnBlock ?? 0), blockNumber, (fromBlock, toBlock) =>
              contract.getEvents.LicenseGranted({ licenseId }, { fromBlock, toBlock, strict: true }),
            )
          )[0],
        readTitle: async (fileHash, blockNumber) => (await contract.read.works([fileHash], { blockNumber }))[2],
        getBlockAt: blockNumber => client.getBlock({ blockNumber }),
      });
    },
  });
  const license = record.data?.license;
  const { address } = useAccount();
  const party = Boolean(
    address &&
    license &&
    [license.licensor, license.licensee].some(value => value.toLowerCase() === address.toLowerCase()),
  );
  const { signedIn, wallet } = useWalletSession(party);
  const grant = record.data?.grant;
  const observedBlock = record.data?.observedBlock;
  const identity =
    grant && contract ? { tx: grant.transactionHash, block: grant.blockHash, contract: contract.address } : undefined;
  const mismatch = identity && !matchesLicenseIdentity(expectedIdentity, identity);
  const url = identity && origin ? publicUrl(origin, licensePath(id, identity)) : "";
  const error = record.error || (!contractLoading && !contract);
  const loading = record.isPending || contractLoading;
  const status = getLicenseStatus(license, observedBlock?.timestamp);
  const printable = Boolean(license && status && url && !mismatch && !error && !loading);

  function downloadFile(blob: Blob, name: string) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }

  async function runAction(nextAction: "refresh" | "print" | "download" | "evidence") {
    if (action) return;
    if (exportMenu.current) exportMenu.current.open = false;
    // A failed deployment check leaves the contract hook unavailable until it
    // mounts again. Reloading also retries that check, rather than only the record.
    if (nextAction === "refresh" && !contract) {
      window.location.reload();
      return;
    }
    setAction(nextAction);
    setActionError("");
    setFeedback("");
    try {
      const result = await record.refetch({ throwOnError: true });
      const fresh = result.data;
      if (!fresh || !contract) {
        if (nextAction !== "refresh") throw new Error("Chưa có dữ liệu giấy phép để xuất.");
        setFeedback("Đã cập nhật. Chưa tìm thấy giấy phép trên mạng hiện tại.");
        return;
      }
      if (
        !matchesLicenseIdentity(expectedIdentity, {
          tx: fresh.grant.transactionHash,
          block: fresh.grant.blockHash,
          contract: contract.address,
        })
      ) {
        throw new Error("Liên kết không khớp lần cấp giấy phép trên mạng hiện tại.");
      }
      const termsPath = "terms?tx=" + fresh.grant.transactionHash + "&id=" + id + "&block=" + fresh.grant.blockHash;
      if (nextAction === "evidence") {
        const evidence = await copyrightApi(termsPath + "&evidence=1", "GET", undefined, wallet);
        downloadFile(
          new Blob([JSON.stringify(evidence, null, 2) + "\n"], { type: "application/json" }),
          "giay-phep-" + id + ".json",
        );
        setFeedback("Đã tải dữ liệu đối chiếu giấy phép.");
        return;
      }
      const { terms } = await queryClient.fetchQuery({
        queryKey: ["copyright", "terms", fresh.grant.transactionHash, id.toString(), fresh.grant.blockHash],
        queryFn: () => copyrightApi<{ terms: LicenseTerms | null }>(termsPath),
        staleTime: 0,
      });
      setFeedback("Đã cập nhật blockchain và điều khoản · Block #" + fresh.observedBlock.number.toString() + ".");
      if (nextAction === "print") {
        await document.fonts.ready;
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        window.print();
      }
      if (nextAction === "download") {
        const [{ createLicensePdf }, regular, bold] = await Promise.all([
          import("~~/utils/licensePdf"),
          fetch("/fonts/noto-sans/NotoSans-Regular.ttf").then(async response => {
            if (!response.ok) throw new Error("Không tải được font PDF. Hãy thử lại.");
            return new Uint8Array(await response.arrayBuffer());
          }),
          fetch("/fonts/noto-sans/NotoSans-Bold.ttf").then(async response => {
            if (!response.ok) throw new Error("Không tải được font PDF. Hãy thử lại.");
            return new Uint8Array(await response.arrayBuffer());
          }),
        ]);
        const freshStatus = getLicenseStatus(fresh.license, fresh.observedBlock.timestamp);
        if (!freshStatus) throw new Error("Chưa xác định được trạng thái giấy phép.");
        const verificationUrl = publicUrl(
          window.location.origin,
          licensePath(id, {
            tx: fresh.grant.transactionHash,
            block: fresh.grant.blockHash,
            contract: contract.address,
          }),
        );
        const bytes = await createLicensePdf(
          {
            id: id.toString(),
            title: fresh.title,
            status: LICENSE_STATUS_LABELS[freshStatus],
            fileHash: fresh.license.fileHash,
            licensor: fresh.license.licensor,
            licensee: fresh.license.licensee,
            grantedAt: formatVietnamTimestamp(fresh.license.grantedAt),
            expiresAt: formatVietnamTimestamp(fresh.license.expiresAt),
            observedAt: formatVietnamTimestamp(fresh.observedBlock.timestamp),
            blockNumber: fresh.observedBlock.number.toString(),
            blockHash: fresh.observedBlock.hash,
            txHash: fresh.grant.transactionHash,
            grantBlockHash: fresh.grant.blockHash,
            chainName: copyrightChain.name,
            chainId: copyrightChain.id.toString(),
            contract: contract.address,
            verificationUrl,
            referenceTerms: LICENSE_TERMS,
            terms: terms
              ? {
                  ...terms,
                  acceptedAt: terms.acceptedAt
                    ? formatVietnamTimestamp(BigInt(Math.floor(Date.parse(terms.acceptedAt) / 1000)))
                    : null,
                }
              : null,
          },
          { regular, bold },
        );
        downloadFile(new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" }), "giay-phep-" + id + ".pdf");
        setFeedback(`Đã tạo và bắt đầu tải giay-phep-${id}.pdf · Block #${fresh.observedBlock.number}.`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không thể cập nhật tài liệu. Vui lòng thử lại.");
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="bqs-page bqs-license-page">
      <div className="bqs-no-print">
        <PageHeader
          title={"Giấy phép #" + id}
          description="Thông tin quyền sử dụng tác phẩm và điều khoản liên quan."
          backHref="/works"
          backLabel="Tác phẩm"
        />
        <div className="bqs-document-toolbar card border border-base-300 bg-base-100">
          <div className="bqs-document-toolbar-copy">
            <DocumentTextIcon aria-hidden="true" />
            <div>
              <strong>Tài liệu giấy phép</strong>
              <span>Chọn in giấy phép hoặc tải file PDF trực tiếp về máy.</span>
            </div>
          </div>
          <div className="bqs-document-actions">
            <button
              type="button"
              className="btn btn-outline"
              disabled={Boolean(action) || contractLoading}
              onClick={() => void runAction("refresh")}
              aria-busy={action === "refresh"}
            >
              <ArrowPathIcon className={action === "refresh" ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
              {action === "refresh" ? "Đang cập nhật…" : "Tải lại dữ liệu"}
            </button>
            <details ref={exportMenu} className="dropdown dropdown-end">
              <summary
                className={`btn btn-primary ${!printable || action ? "btn-disabled" : ""}`}
                aria-disabled={!printable || Boolean(action)}
                aria-busy={action === "print" || action === "download"}
                onClick={event => {
                  if (!printable || action) event.preventDefault();
                }}
              >
                <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
                {action === "download" ? "Đang tạo PDF…" : action === "print" ? "Đang chuẩn bị…" : "In / Tải PDF"}
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
              </summary>
              <ul
                className="menu dropdown-content bqs-export-menu rounded-box border border-base-300 bg-base-100 shadow-lg"
                aria-label="Xuất giấy phép"
              >
                <li>
                  <button
                    type="button"
                    disabled={!printable || Boolean(action)}
                    onClick={() => void runAction("print")}
                  >
                    <PrinterIcon className="h-4 w-4" aria-hidden="true" />
                    In giấy phép
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={!printable || Boolean(action)}
                    onClick={() => void runAction("download")}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                    Tải PDF về máy
                  </button>
                </li>
                {party && signedIn && (
                  <li>
                    <button
                      type="button"
                      disabled={!printable || Boolean(action)}
                      onClick={() => void runAction("evidence")}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                      Tải dữ liệu đối chiếu JSON
                    </button>
                  </li>
                )}
              </ul>
            </details>
          </div>
        </div>
        {printable && party && !signedIn && (
          <details className="mt-3 bqs-inset-panel">
            <summary className="cursor-pointer">Đăng nhập để xuất dữ liệu đối chiếu chữ ký</summary>
            <WalletSession />
          </details>
        )}
        {actionError && (
          <div role="alert" className="alert alert-error mb-4">
            <InformationCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        )}
        <p className="bqs-document-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      </div>
      {mismatch ? (
        <div role="alert" className="alert alert-error">
          Liên kết thuộc một lần cấp giấy phép khác. Giao dịch, block hoặc contract không khớp mạng hiện tại; không thể
          thay thế giấy phép đã chia sẻ bằng bản ghi này.
        </div>
      ) : error ? (
        <div role="alert" className="alert alert-error">
          Không đọc được đầy đủ dữ liệu blockchain. Kiểm tra kết nối và cấu hình contract trên {copyrightChain.name},
          rồi chọn Tải lại dữ liệu.
        </div>
      ) : loading ? (
        <div role="status" className="bqs-document-loading card border border-base-300 bg-base-100">
          <span className="loading loading-spinner loading-sm" />
          Đang tra cứu giấy phép trên blockchain…
        </div>
      ) : !license ? (
        <div role="status" className="alert alert-info">
          Chưa có giấy phép #{id.toString()} trên mạng hiện tại.
        </div>
      ) : (
        <article className="bqs-license-document card border border-base-300 bg-base-100">
          <div className="bqs-document-heading">
            <div>
              <p className="bqs-document-eyebrow">BẢN QUYỀN SỐ · BẢN TRA CỨU CÔNG KHAI</p>
              <h2>Giấy phép sử dụng #{id.toString()}</h2>
              <p>Thông tin được đối chiếu tại một block xác định trên blockchain.</p>
            </div>
            <span
              className={
                "badge bqs-document-status " +
                (status === "valid" ? "badge-success" : status === "revoked" ? "badge-error" : "badge-warning")
              }
            >
              {status === "valid" ? (
                <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
              ) : status === "revoked" ? (
                <XCircleIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ClockIcon className="h-4 w-4" aria-hidden="true" />
              )}
              {status ? LICENSE_STATUS_LABELS[status] : "Chưa xác định"}
            </span>
          </div>
          <div className="bqs-document-grid">
            <section className="bqs-document-section" aria-labelledby="document-work-title">
              <h3 id="document-work-title">
                <DocumentTextIcon aria-hidden="true" />
                Tác phẩm được cấp phép
              </h3>
              <dl>
                <DocumentField label="Tên tác phẩm">{record.data?.title}</DocumentField>
                <DocumentField label="Mã tác phẩm · SHA-256" mono>
                  <Link className="link" href={verificationPath(license.fileHash)}>
                    {license.fileHash}
                  </Link>
                </DocumentField>
              </dl>
            </section>
            <section className="bqs-document-section" aria-labelledby="document-parties-title">
              <h3 id="document-parties-title">
                <UsersIcon aria-hidden="true" />
                Bên cấp và bên nhận
              </h3>
              <dl>
                <DocumentField label="Ví bên cấp">
                  <Address
                    address={license.licensor}
                    chain={copyrightChain}
                    format="long"
                    onlyEnsOrAddress
                    disableAddressLink
                  />
                </DocumentField>
                <DocumentField label="Ví bên nhận">
                  <Address
                    address={license.licensee}
                    chain={copyrightChain}
                    format="long"
                    onlyEnsOrAddress
                    disableAddressLink
                  />
                </DocumentField>
              </dl>
            </section>
          </div>
          <section className="bqs-document-section" aria-labelledby="document-dates-title">
            <h3 id="document-dates-title">
              <ClockIcon aria-hidden="true" />
              Thời hạn và thời điểm đối chiếu<span className="bqs-document-section-note">Giờ Việt Nam · UTC+7</span>
            </h3>
            <dl className="bqs-document-dates">
              <DocumentField label="Được cấp">{formatVietnamTimestamp(license.grantedAt)}</DocumentField>
              <DocumentField label="Hết hạn">{formatVietnamTimestamp(license.expiresAt)}</DocumentField>
              <DocumentField label="Đối chiếu tại block">
                #{observedBlock?.number.toString()}
                <span className="bqs-document-secondary">
                  {observedBlock && formatVietnamTimestamp(observedBlock.timestamp)}
                </span>
              </DocumentField>
            </dl>
          </section>
          {grant && (
            <LicenseTermsPanel
              key={grant.transactionHash}
              license={license}
              tx={grant.transactionHash}
              grantBlockHash={grant.blockHash}
              active={status === "valid"}
              readOnly
              expanded
            />
          )}
          <section className="bqs-document-section" aria-labelledby="document-chain-title">
            <h3 id="document-chain-title">
              <CubeTransparentIcon aria-hidden="true" />
              Thông tin đối chiếu blockchain
            </h3>
            <dl className="bqs-document-chain">
              <DocumentField label="Mạng / Chain ID">
                {copyrightChain.name} / {copyrightChain.id}
              </DocumentField>
              <DocumentField label="Contract" mono>
                {contract?.address}
              </DocumentField>
              <DocumentField label="Hash block đối chiếu" mono>
                {observedBlock?.hash}
              </DocumentField>
              <DocumentField label="Giao dịch cấp" mono>
                {grant && (
                  <Link className="link" href={transactionUrl(grant.transactionHash)}>
                    {grant.transactionHash}
                  </Link>
                )}
              </DocumentField>
            </dl>
          </section>
          <section
            className="bqs-document-verification bqs-document-section"
            aria-labelledby="document-verification-title"
          >
            {url && (
              <div className="bqs-document-qr">
                <QRCodeSVG value={url} size={160} marginSize={4} title="QR kiểm tra lại giấy phép hiện tại" />
              </div>
            )}
            <div className="bqs-document-verification-copy">
              <h3 id="document-verification-title">
                <QrCodeIcon aria-hidden="true" />
                Kiểm tra lại giấy phép
              </h3>
              <p>
                Quét mã QR hoặc mở liên kết để xem trạng thái mới nhất. Giấy phép có thể hết hạn hoặc bị thu hồi sau khi
                in.
              </p>
              <a className="link bqs-document-open-link" href={url}>
                Mở trang tra cứu
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              </a>
              <a className="bqs-document-code bqs-document-share-url" href={url}>
                {url}
              </a>
              {origin && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname) && (
                <p className="bqs-document-local-note">Liên kết localhost chỉ mở được trên máy đang chạy ứng dụng.</p>
              )}
            </div>
          </section>
          <div className="bqs-document-disclaimer">
            <InformationCircleIcon aria-hidden="true" />
            <p>
              Bản in phản ánh dữ liệu tại block đối chiếu; không phải chứng nhận quyền tác giả hoặc danh tính pháp lý.
              Điều khoản và chữ ký chấp thuận được lưu ngoài blockchain.
            </p>
          </div>
        </article>
      )}
    </div>
  );
}
