"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { DetailField } from "./DetailFields";
import { InfoSection } from "./InfoSection";
import { Notice } from "./Notice";
import { WalletSession, copyrightApi, useWalletSession } from "./WalletSession";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeIcon, IdentificationIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
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
    <div className="bqs-form space-y-5">
      <InfoSection
        title="Đăng nhập và quyền chỉnh sửa"
        icon={<ShieldCheckIcon />}
        description="Chỉ ví đã đăng nhập mới xem và chỉnh sửa hồ sơ riêng của mình."
      >
        <WalletSession />
      </InfoSection>
      {signedIn &&
        (profile.isPending ? (
          <p role="status">Đang tải hồ sơ…</p>
        ) : profile.error ? (
          <Notice tone="error" role="alert" title="Không tải được hồ sơ">
            {profile.error.message}
          </Notice>
        ) : (
          <ProfileForm key={wallet} wallet={wallet!} initial={profile.data.profile} />
        ))}
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
        <InfoSection
          title="Thông tin cá nhân / tổ chức"
          icon={<IdentificationIcon />}
          description="Đây là thông tin tự khai, chưa xác minh danh tính hoặc tư cách pháp nhân."
        >
          <div className="space-y-4">
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
            <div className="bqs-field-grid">
              <DetailField label="Vai trò" name="role" value={initial?.role} required />
              <DetailField
                label="Website HTTPS (nếu có)"
                name="website"
                type="url"
                value={initial?.website}
                max={500}
              />
            </div>
            {kind === "organization" && (
              <div className="bqs-inset-panel space-y-4">
                <h3>Thông tin đại diện · chỉ hiển thị cho ví của bạn</h3>
                <DetailField
                  label="Mã doanh nghiệp (nếu có)"
                  name="organizationCode"
                  value={initial?.organizationCode}
                />
                <DetailField
                  label="Căn cứ đại diện (tóm tắt hoặc số tham chiếu)"
                  name="authority"
                  value={initial?.authority}
                  max={500}
                  required
                />
              </div>
            )}
          </div>
        </InfoSection>
        <InfoSection
          title="Phạm vi công khai"
          icon={<EyeIcon />}
          description="Bạn quyết định thông tin nào được hiển thị cùng tác phẩm."
        >
          <label className="bqs-check-label">
            <input type="checkbox" name="isPublic" className="checkbox" defaultChecked={initial?.isPublic} />
            Công khai tên, loại hồ sơ, vai trò và website trên trang tác phẩm.
          </label>
          <p className="bqs-help mt-3">
            Mã doanh nghiệp và căn cứ đại diện chỉ được hiển thị trong hồ sơ riêng của ví đã đăng nhập. Không nhập dữ
            liệu định danh cá nhân vào trường công khai.
          </p>
        </InfoSection>
        <div className="bqs-form-actions bqs-form-footer">
          <button className="btn btn-primary" aria-busy={busy}>
            {busy ? "Đang lưu…" : "Lưu hồ sơ"}
          </button>
        </div>
        {status && (
          <Notice tone="success" role="status">
            {status}
          </Notice>
        )}
        {error && (
          <Notice tone="error" role="alert" title="Chưa lưu được hồ sơ">
            {error}
          </Notice>
        )}
      </fieldset>
    </form>
  );
}
