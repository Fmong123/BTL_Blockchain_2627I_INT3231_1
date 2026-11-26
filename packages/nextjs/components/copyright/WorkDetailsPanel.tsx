"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { InfoSection } from "./InfoSection";
import { Notice } from "./Notice";
import { WalletSession, copyrightApi, useWalletSession } from "./WalletSession";
import { WorkDetailsFields, WorkDetailsSummary, emptyWorkDetails } from "./WorkDetailsFields";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { DocumentTextIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { workDetailsSchema } from "~~/utils/copyrightDetails";
import type { Profile, WorkDetails } from "~~/utils/copyrightDetails";
import { editableWorkDetails } from "~~/utils/workDetails";

const detailLabels: Record<keyof WorkDetails, string> = {
  category: "Nhóm nội dung",
  language: "Ngôn ngữ",
  creationDate: "Ngày sáng tạo",
  publicationDate: "Ngày công bố",
  parties: "Các bên và vai trò",
  basis: "Căn cứ quyền",
  certificate: "Thông tin chứng nhận",
  experienceUrl: "Liên kết",
};

type DossierRevision = { id: number; changedAt: string | null; editor: string; details: WorkDetails };

export function WorkDetailsPanel({ fileHash, registrant }: { fileHash: string; registrant: string }) {
  const path = "work?hash=" + fileHash;
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const owner = address?.toLowerCase() === registrant.toLowerCase();
  const { wallet, signedIn } = useWalletSession(owner);
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const historyKey = ["copyright", path, "history", wallet];
  const history = useQuery({
    queryKey: historyKey,
    queryFn: () =>
      copyrightApi<{ history: DossierRevision[]; hasEarlier: boolean }>(path + "&history=1", "GET", undefined, wallet),
    enabled: owner && signedIn && showHistory,
    retry: false,
  });
  const details = useQuery({
    queryKey: ["copyright", path],
    queryFn: () => copyrightApi<{ details: WorkDetails | null }>(path),
    retry: false,
  });
  const profile = useQuery({
    queryKey: ["copyright", "public-profile", registrant],
    queryFn: () =>
      copyrightApi<{ profile: Pick<Profile, "name" | "kind" | "role" | "website"> | null }>(
        "profile?wallet=" + registrant,
      ),
    retry: false,
  });
  const data = details.data?.details;
  const publicProfile = profile.data?.profile;
  return (
    <InfoSection
      className="mt-6"
      title="Hồ sơ tác phẩm tự khai"
      icon={<DocumentTextIcon />}
      description="Thông tin do ví đăng ký cung cấp; chưa được đối chiếu bởi cơ quan có thẩm quyền."
    >
      {publicProfile && (
        <div className="bqs-inset-panel mb-5">
          <h3>Hồ sơ ví đăng ký</h3>
          <p className="m-0 break-words">
            <strong>{publicProfile.name}</strong> · {publicProfile.kind === "organization" ? "Tổ chức" : "Cá nhân"} ·{" "}
            {publicProfile.role}
            {publicProfile.website && (
              <>
                {" "}
                ·{" "}
                <a className="link" target="_blank" rel="noopener noreferrer" href={publicProfile.website}>
                  Website
                </a>
              </>
            )}
          </p>
        </div>
      )}
      {profile.error && (
        <p role="status" className="bqs-help">
          Chưa tải được hồ sơ công khai của ví.{" "}
          <button type="button" className="link" onClick={() => void profile.refetch()}>
            Thử lại
          </button>
        </p>
      )}
      {details.isPending && <p role="status">Đang tải hồ sơ…</p>}
      {details.error && (
        <div role="alert" className="alert alert-error flex flex-wrap">
          <span>{details.error.message}</span>
          <button className="btn btn-outline btn-sm" onClick={() => void details.refetch()}>
            Tải lại hồ sơ
          </button>
        </div>
      )}
      {details.data && !data && (
        <p className="bqs-help">Bản ghi này chưa có hồ sơ bổ sung. Ví đăng ký có thể khai thông tin bên dưới.</p>
      )}
      {data && <WorkDetailsSummary details={data} />}
      {owner && data && (
        <details className="bqs-inset-panel mt-5" onToggle={event => setShowHistory(event.currentTarget.open)}>
          <summary className="cursor-pointer font-semibold">Lịch sử hồ sơ</summary>
          {showHistory && !signedIn && <WalletSession />}
          {showHistory && signedIn && (
            <div className="mt-3 space-y-3">
              {history.isPending && <p role="status">Đang tải lịch sử…</p>}
              {history.error && (
                <Notice tone="error" role="alert">
                  {history.error.message}
                </Notice>
              )}
              {history.data?.history.length === 0 && <p>Chưa có bản chỉnh sửa được ghi nhận.</p>}
              {history.data?.history.map((revision, index, revisions) => {
                const earlier = revisions[index + 1];
                const changes =
                  earlier &&
                  (Object.keys(detailLabels) as (keyof WorkDetails)[])
                    .filter(field => JSON.stringify(revision.details[field]) !== JSON.stringify(earlier.details[field]))
                    .map(field => detailLabels[field])
                    .join(", ");
                return (
                  <details key={revision.id} className="rounded-box border border-base-300 p-3">
                    <summary className="cursor-pointer">
                      {revision.changedAt
                        ? new Date(revision.changedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
                        : "Hồ sơ trước khi có lịch sử"}
                      {changes ? " · " + changes : ""}
                    </summary>
                    <p className="my-2 break-all text-sm">Ví lưu: {revision.editor}</p>
                    <WorkDetailsSummary details={revision.details} />
                  </details>
                );
              })}
              {history.data?.hasEarlier && <p className="text-sm">Đang hiển thị 50 bản gần nhất.</p>}
            </div>
          )}
        </details>
      )}
      {owner && (
        <button
          className="btn btn-outline btn-sm mt-5"
          disabled={!details.isSuccess}
          onClick={() => setEditing(!editing)}
        >
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
          {editing ? "Đóng chỉnh sửa" : data ? "Sửa hồ sơ tác phẩm" : "Bổ sung hồ sơ tác phẩm"}
        </button>
      )}
      {editing && owner && (
        <Editor
          key={registrant}
          path={path}
          initial={data}
          onSave={saved => {
            queryClient.setQueryData(["copyright", path], saved);
            void queryClient.invalidateQueries({ queryKey: historyKey });
            setEditing(false);
          }}
        />
      )}
    </InfoSection>
  );
}

function Editor({
  path,
  initial,
  onSave,
}: {
  path: string;
  initial?: WorkDetails | null;
  onSave: (saved: { details: WorkDetails }) => void;
}) {
  const { signedIn, wallet } = useWalletSession();
  const [value, setValue] = useState(() => editableWorkDetails(initial ?? emptyWorkDetails()));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const checked = workDetailsSchema.safeParse(value);
    if (!checked.success) {
      setError(checked.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      onSave(await copyrightApi<{ details: WorkDetails }>(path, "PUT", checked.data, wallet));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được hồ sơ.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="bqs-inset-panel mt-5 space-y-4">
      <WalletSession />
      {signedIn && (
        <form onSubmit={save} className="bqs-form">
          <fieldset disabled={busy} className="space-y-5">
            <WorkDetailsFields value={value} onChange={setValue} />
            <p className="bqs-help">
              Chỉnh sửa này cập nhật hồ sơ tự khai. Tên, tóm tắt, hash và thời điểm trên blockchain giữ theo giao dịch
              gốc.
            </p>
            <div className="bqs-form-actions bqs-form-footer">
              <button className="btn btn-primary" aria-busy={busy}>
                {busy ? "Đang lưu…" : "Lưu hồ sơ tác phẩm"}
              </button>
            </div>
            {error && (
              <Notice tone="error" role="alert" title="Chưa lưu được hồ sơ tác phẩm">
                {error}
              </Notice>
            )}
          </fieldset>
        </form>
      )}
    </div>
  );
}
