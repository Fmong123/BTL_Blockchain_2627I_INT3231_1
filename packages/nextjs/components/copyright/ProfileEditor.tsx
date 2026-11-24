"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { DetailField } from "./DetailFields";
import { WalletSession, copyrightApi, useWalletSession } from "./WalletSession";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "~~/utils/copyrightDetails";

export function ProfileEditor() {
  const { signedIn, wallet } = useWalletSession();
  const profile = useQuery({
    queryKey: ["copyright", "profile", wallet],
    queryFn: () => copyrightApi<{ profile: Profile | null }>("profile", "GET", undefined, wallet),
    enabled: signedIn,
    retry: false,
  });
  return (
    <div className="bqs-form card border border-base-300 bg-base-100">
      <div className="card-body gap-5">
        <WalletSession />
        {signedIn &&
          (profile.isPending ? (
            <p role="status">Đang tải hồ sơ…</p>
          ) : profile.error ? (
            <p role="alert">{profile.error.message}</p>
          ) : (
            <ProfileForm key={wallet} wallet={wallet!} initial={profile.data.profile} />
          ))}
      </div>
    </div>
  );
}

function ProfileForm({ wallet, initial }: { wallet: string; initial: Profile | null }) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState(initial?.kind ?? "person");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const result = await copyrightApi<{ profile: Profile }>(
        "profile",
        "PUT",
        {
          kind,
          name: fields.get("name"),
          role: fields.get("role"),
          website: fields.get("website"),
          organizationCode: fields.get("organizationCode") ?? "",
          authority: fields.get("authority") ?? "",
          isPublic: fields.has("isPublic"),
        },
        wallet,
      );
      queryClient.setQueryData(["copyright", "profile", wallet], result);
      await queryClient.invalidateQueries({ queryKey: ["copyright", "public-profile"] });
      setStatus("Đã lưu hồ sơ tự khai.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được hồ sơ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <fieldset disabled={busy} className="space-y-4">
        <label className="block">
          <span className="label">Loại hồ sơ tự khai</span>
          <select
            className="select w-full"
            value={kind}
            onChange={event => setKind(event.target.value === "organization" ? "organization" : "person")}
          >
            <option value="person">Cá nhân</option>
            <option value="organization">Tổ chức</option>
          </select>
        </label>
        <DetailField
          label={kind === "person" ? "Tên hiển thị / bút danh" : "Tên pháp lý của tổ chức"}
          name="name"
          value={initial?.name}
          required
        />
        <DetailField label="Vai trò" name="role" value={initial?.role} required />
        <DetailField label="Website HTTPS" name="website" type="url" value={initial?.website} max={500} />
        {kind === "organization" && (
          <>
            <DetailField label="Mã doanh nghiệp (nếu có)" name="organizationCode" value={initial?.organizationCode} />
            <DetailField
              label="Căn cứ đại diện (tóm tắt hoặc số tham chiếu)"
              name="authority"
              value={initial?.authority}
              max={500}
              required
            />
          </>
        )}
        <label className="flex items-center gap-3">
          <input type="checkbox" name="isPublic" className="checkbox" defaultChecked={initial?.isPublic} />
          Công khai tên, loại hồ sơ, vai trò và website trên trang tác phẩm.
        </label>
        <button className="btn btn-primary">Lưu hồ sơ</button>
        {status && <p role="status">{status}</p>}
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
      </fieldset>
    </form>
  );
}
