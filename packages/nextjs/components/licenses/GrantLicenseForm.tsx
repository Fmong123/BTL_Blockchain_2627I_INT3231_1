"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { AddressInput } from "@scaffold-ui/components";
import { isAddress, isAddressEqual, zeroAddress } from "viem";
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
  grant: (licensee: string, expiresAt: bigint) => Promise<boolean>;
};

export function GrantLicenseForm({
  registrant,
  chainTimestamp,
  disabled,
  busy,
  pendingLabel,
  grant,
}: GrantLicenseFormProps) {
  const [licensee, setLicensee] = useState("");
  const [expiry, setExpiry] = useState(() =>
    toVietnamDateTimeInput(chainTimestamp + BigInt(DEFAULT_LICENSE_DAYS * 86400)),
  );
  const [error, setError] = useState("");
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (disabled || busy) return;
    try {
      if (!isAddress(licensee) || isAddressEqual(licensee, zeroAddress))
        throw new Error("Nhập địa chỉ ví nhận hợp lệ, khác ví 0.");
      if (isAddressEqual(licensee, registrant)) throw new Error("Không thể tự cấp giấy phép cho ví đăng ký.");
      const expiresAt = parseVietnamDateTime(expiry);
      if (expiresAt <= chainTimestamp) throw new Error("Thời hạn phải ở tương lai theo thời gian blockchain.");
      if (await grant(licensee, expiresAt)) setLicensee("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thông tin cấp phép không hợp lệ.");
    }
  }
  return (
    <form onSubmit={submit} className="bqs-form card border border-base-300 bg-base-100">
      <div className="card-body gap-4 p-5 sm:p-6">
        <h3 className="card-title">Cấp giấy phép sử dụng</h3>
        <p className="bqs-sub !mt-0">Chia sẻ quyền sử dụng miễn phí, có thời hạn cho ví khác.</p>
        <fieldset disabled={disabled || busy} className="space-y-4">
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
          <div className="rounded-box bg-base-200 p-4 text-sm">
            <strong>Điều khoản v{LICENSE_TERMS_VERSION} · Miễn phí</strong>
            <p className="mb-0">{LICENSE_TERMS}</p>
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={disabled || busy}>
            {busy ? pendingLabel : "Ký và cấp giấy phép"}
          </button>
        </fieldset>
        {error && (
          <p role="alert" className="m-0 text-sm text-error">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
