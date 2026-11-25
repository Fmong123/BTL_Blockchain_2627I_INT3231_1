"use client";

import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { AddressInput } from "@scaffold-ui/components";
import { isAddress, isAddressEqual, zeroAddress } from "viem";
import { LegalContext } from "~~/components/copyright/LegalContext";
import { TermsContent } from "~~/components/copyright/LicenseTermsPanel";
import { Notice } from "~~/components/copyright/Notice";
import { WalletSession, copyrightApi } from "~~/components/copyright/WalletSession";
import { CURRENT_TERMS } from "~~/utils/licenseTerms";
import { formatVietnamTimestamp } from "~~/utils/licenses";
import {
  DEFAULT_LICENSE_DAYS,
  LICENSE_TERMS,
  LICENSE_TERMS_VERSION,
  parseVietnamDateTime,
  toVietnamDateTimeInput,
} from "~~/utils/licenses";

type GrantLicenseFormProps = {
  registrant: string;
  chainTimestamp: bigint;
  disabled: boolean;
  busy: boolean;
  pendingLabel: string;
  attachTerms: boolean;
  grant: (licensee: string, expiresAt: bigint) => Promise<boolean>;
};

export function GrantLicenseForm({
  registrant,
  chainTimestamp,
  disabled,
  busy,
  pendingLabel,
  attachTerms,
  grant,
}: GrantLicenseFormProps) {
  const [licensee, setLicensee] = useState("");
  const [expiry, setExpiry] = useState(() =>
    toVietnamDateTimeInput(chainTimestamp + BigInt(DEFAULT_LICENSE_DAYS * 86400)),
  );
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (disabled || busy || checking) return;
    try {
      if (!isAddress(licensee) || isAddressEqual(licensee, zeroAddress))
        throw new Error("Nhập địa chỉ ví nhận hợp lệ, khác ví 0.");
      if (isAddressEqual(licensee, registrant)) throw new Error("Không thể tự cấp giấy phép cho ví đăng ký.");
      const expiresAt = parseVietnamDateTime(expiry);
      if (expiresAt <= chainTimestamp) throw new Error("Thời hạn phải ở tương lai theo thời gian blockchain.");
      if (!attachTerms) throw new Error("Đăng nhập bằng ví trước khi cấp để lưu đúng bản điều khoản.");
      if (!reviewing) {
        setAuthorized(false);
        setReviewing(true);
        return;
      }
      if (!authorized) throw new Error("Xác nhận thẩm quyền cấp phép trước khi ký.");
      setChecking(true);
      await copyrightApi("profile", "GET", undefined, registrant.toLowerCase());
      if (!active.current) return;
      if (await grant(licensee, expiresAt)) {
        setLicensee("");
        setReviewing(false);
        setAuthorized(false);
      }
    } catch (err) {
      if (active.current) setError(err instanceof Error ? err.message : "Thông tin cấp phép không hợp lệ.");
    } finally {
      if (active.current) setChecking(false);
    }
  }
  return (
    <form onSubmit={submit} className="bqs-form card border border-base-300 bg-base-100">
      <div className="card-body gap-4 p-5 sm:p-6">
        <h3 className="card-title">Cấp giấy phép sử dụng</h3>
        <p className="bqs-sub !mt-0">Chia sẻ quyền sử dụng miễn phí, có thời hạn cho ví khác.</p>
        <fieldset disabled={disabled || busy || checking} className="space-y-4">
          {!reviewing && (
            <>
              <label className="form-control block">
                <span className="label font-semibold">Ví nhận giấy phép</span>
                <div className="bqs-address-input">
                  <AddressInput
                    name="license-recipient"
                    value={licensee}
                    onChange={setLicensee}
                    disabled={disabled || busy}
                    placeholder="0x…"
                  />
                </div>
              </label>
              <label className="form-control">
                <span className="label font-semibold">Hết hạn (giờ Việt Nam, UTC+7)</span>
                <input
                  className="input input-bordered w-full"
                  type="datetime-local"
                  required
                  value={expiry}
                  onChange={event => setExpiry(event.target.value)}
                />
              </label>
            </>
          )}
          {reviewing && (
            <div className="bqs-inset-panel">
              <h4 className="font-semibold mb-3">Kiểm tra giấy phép sắp cấp</h4>
              <dl className="bqs-info-grid">
                <div className="bqs-span-all">
                  <dt>Ví nhận</dt>
                  <dd className="bqs-code">{licensee}</dd>
                </div>
                <div className="bqs-span-all">
                  <dt>Hết hạn · giờ Việt Nam</dt>
                  <dd>{formatVietnamTimestamp(parseVietnamDateTime(expiry))}</dd>
                </div>
                <div>
                  <dt>Phí sử dụng</dt>
                  <dd>Miễn phí</dd>
                </div>
              </dl>
            </div>
          )}
          <div className="bqs-inset-panel text-sm">
            <strong>Điều khoản v{attachTerms ? CURRENT_TERMS.version : LICENSE_TERMS_VERSION} · Miễn phí</strong>
            <div className="mt-3">
              <TermsContent content={attachTerms ? CURRENT_TERMS.content : LICENSE_TERMS.split(", ").join("\n")} />
            </div>
          </div>
          {reviewing && (
            <label className="bqs-check-label">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={authorized}
                onChange={event => setAuthorized(event.target.checked)}
              />
              <span>
                Tôi có thẩm quyền cấp quyền sử dụng này, đã có sự đồng ý cần thiết của đồng chủ sở hữu / bên ủy quyền và
                đồng ý với phạm vi, thời hạn, điều khoản nêu trên.
              </span>
            </label>
          )}
          {!attachTerms && (
            <div className="space-y-2">
              <p className="bqs-help">
                Đăng nhập trước khi cấp để lưu phiên bản điều khoản và cho ví nhận ký chấp thuận.
              </p>
              <WalletSession />
            </div>
          )}
          <LegalContext licensing />
          <div className="bqs-form-actions bqs-form-footer">
            {reviewing && (
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setReviewing(false);
                  setAuthorized(false);
                }}
              >
                Sửa ví nhận / thời hạn
              </button>
            )}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={disabled || busy || !attachTerms || (reviewing && !authorized)}
            >
              {checking && !busy
                ? "Đang kiểm tra phiên và hồ sơ…"
                : busy
                  ? pendingLabel
                  : reviewing
                    ? "Ký và cấp giấy phép"
                    : "Kiểm tra giấy phép"}
            </button>
          </div>
        </fieldset>
        {error && (
          <Notice tone="error" role="alert" title="Chưa thể cấp giấy phép">
            {error}
          </Notice>
        )}
      </div>
    </form>
  );
}
