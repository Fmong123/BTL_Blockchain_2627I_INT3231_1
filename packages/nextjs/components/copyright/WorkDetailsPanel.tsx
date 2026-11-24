"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { DetailField } from "./DetailFields";
import { WalletSession, copyrightApi, useWalletSession } from "./WalletSession";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { categories, partyRoles } from "~~/utils/copyrightDetails";
import type { Profile, WorkDetails } from "~~/utils/copyrightDetails";

export function WorkDetailsPanel({ fileHash, registrant }: { fileHash: string; registrant: string }) {
  const path = "work?hash=" + fileHash;
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const owner = address?.toLowerCase() === registrant.toLowerCase();
  const [editing, setEditing] = useState(false);
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
  const showEditor = editing && owner;
  return (
    <section className="bqs-license-panel mt-6 space-y-4" aria-label="Hồ sơ tác phẩm">
      <h3>Hồ sơ tác phẩm tự khai</h3>
      {profile.data?.profile && (
        <p>
          Ví đăng ký khai báo {profile.data.profile.kind === "organization" ? "tổ chức" : "tên"}{" "}
          <strong>{profile.data.profile.name}</strong> · {profile.data.profile.role}
          {profile.data.profile.website && (
            <>
              {" "}
              ·{" "}
              <a className="link" target="_blank" rel="noopener noreferrer" href={profile.data.profile.website}>
                Website
              </a>
            </>
          )}
        </p>
      )}
      {details.isPending && <p role="status">Đang tải hồ sơ…</p>}
      {details.error && (
        <div className="flex flex-wrap gap-3">
          <p role="status">{details.error.message}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => void details.refetch()}>
            Tải lại hồ sơ
          </button>
        </div>
      )}
      {details.data && !data && <p>Chưa có hồ sơ bổ sung.</p>}
      {data && (
        <dl className="grid gap-2 break-words">
          <div>
            <dt className="font-semibold">Nhóm nội dung</dt>
            <dd>{data.category}</dd>
          </div>
          {data.language && (
            <div>
              <dt className="font-semibold">Ngôn ngữ</dt>
              <dd>{data.language}</dd>
            </div>
          )}
          {data.creationDate && (
            <div>
              <dt className="font-semibold">Ngày sáng tạo</dt>
              <dd>{data.creationDate}</dd>
            </div>
          )}
          {data.publicationDate && (
            <div>
              <dt className="font-semibold">Ngày công bố</dt>
              <dd>{data.publicationDate}</dd>
            </div>
          )}
          <div>
            <dt className="font-semibold">Các bên và vai trò</dt>
            <dd>
              <ul className="list-inside list-disc">
                {data.parties.map((party, i) => (
                  <li key={i}>
                    {party.name} · {party.role}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Căn cứ quyền</dt>
            <dd>{data.basis}</dd>
          </div>
          {data.certificate && (
            <div>
              <dt className="font-semibold">Thông tin chứng nhận chưa đối chiếu</dt>
              <dd>{data.certificate}</dd>
            </div>
          )}
          {data.experienceUrl && (
            <div>
              <dt className="font-semibold">Liên kết trải nghiệm do ví đăng ký cung cấp</dt>
              <dd>
                <a className="link" target="_blank" rel="noopener noreferrer" href={data.experienceUrl}>
                  Mở trên {data.experienceUrl.includes("youtube.com") ? "YouTube" : "Spotify"}
                </a>
                <p className="text-sm">Nếu nội dung đã bị gỡ, nền tảng gốc sẽ thông báo khi mở liên kết.</p>
              </dd>
            </div>
          )}
        </dl>
      )}
      {owner && (
        <button className="btn btn-outline btn-sm" disabled={!details.isSuccess} onClick={() => setEditing(!editing)}>
          {showEditor ? "Đóng chỉnh sửa" : "Sửa hồ sơ tác phẩm"}
        </button>
      )}
      {showEditor && (
        <Editor
          key={registrant}
          path={path}
          initial={data}
          onSave={saved => {
            queryClient.setQueryData(["copyright", path], saved);
            setEditing(false);
          }}
        />
      )}
    </section>
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
  const [partyRows, setPartyRows] = useState(() =>
    (initial?.parties ?? [{ name: "", role: partyRoles[0] }]).map((party, id) => ({ ...party, id })),
  );
  const [nextId, setNextId] = useState(partyRows.length);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const saved = await copyrightApi<{ details: WorkDetails }>(
        path,
        "PUT",
        {
          category: fields.get("category"),
          language: fields.get("language"),
          creationDate: fields.get("creationDate"),
          publicationDate: fields.get("publicationDate"),
          basis: fields.get("basis"),
          certificate: fields.get("certificate"),
          experienceUrl: fields.get("experienceUrl"),
          parties: partyRows.map(({ id }) => ({ name: fields.get("party" + id), role: fields.get("role" + id) })),
        },
        wallet,
      );
      onSave(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được hồ sơ.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <WalletSession />
      {signedIn && (
        <form onSubmit={save}>
          <fieldset disabled={busy} className="space-y-4">
            <p className="text-sm">
              Các trường này hiển thị công khai. Chỉ nhập tóm tắt hoặc số tham chiếu của giấy tờ.
            </p>
            <label className="block">
              <span className="label">Nhóm nội dung</span>
              <select name="category" className="select w-full" defaultValue={initial?.category}>
                {categories.map(value => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <DetailField label="Ngôn ngữ" name="language" value={initial?.language} max={40} />
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Ngày sáng tạo" name="creationDate" type="date" value={initial?.creationDate} />
              <DetailField label="Ngày công bố" name="publicationDate" type="date" value={initial?.publicationDate} />
            </div>
            {partyRows.map((party, index) => (
              <div key={party.id} className="grid gap-3 sm:grid-cols-2">
                <DetailField label={"Tên bên " + (index + 1)} name={"party" + party.id} value={party.name} required />
                <label className="block">
                  <span className="label">Vai trò</span>
                  <select name={"role" + party.id} className="select w-full" defaultValue={party.role}>
                    {partyRoles.map(role => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </label>
                {partyRows.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm justify-self-start"
                    onClick={() => setPartyRows(partyRows.filter(row => row.id !== party.id))}
                  >
                    Xóa bên {index + 1}
                  </button>
                )}
              </div>
            ))}
            {partyRows.length < 12 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setPartyRows([...partyRows, { id: nextId, name: "", role: partyRoles[0] }]);
                  setNextId(nextId + 1);
                }}
              >
                Thêm bên liên quan
              </button>
            )}
            <DetailField label="Căn cứ quyền" name="basis" max={500} value={initial?.basis} required />
            <DetailField
              label="Chứng nhận (loại, số, cơ quan, ngày cấp nếu có)"
              name="certificate"
              max={500}
              value={initial?.certificate}
            />
            <DetailField
              label="Liên kết YouTube hoặc Spotify"
              name="experienceUrl"
              type="url"
              max={500}
              value={initial?.experienceUrl}
            />
            <button className="btn btn-primary">Lưu hồ sơ tác phẩm</button>
            {error && (
              <p role="alert" className="text-error">
                {error}
              </p>
            )}
          </fieldset>
        </form>
      )}
    </div>
  );
}
