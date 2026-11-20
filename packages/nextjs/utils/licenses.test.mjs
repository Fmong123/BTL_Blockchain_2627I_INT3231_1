import { getLicenseStatus, parseVietnamDateTime, toVietnamDateTimeInput } from "./licenses.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("License status uses chain time, expires at the exact boundary, and preserves revocation", () => {
  const license = { id: 1n, revoked: false, expiresAt: 100n };
  assert.equal(getLicenseStatus(license, 99n), "valid");
  assert.equal(getLicenseStatus(license, 100n), "expired");
  assert.equal(getLicenseStatus(license, 101n), "expired");
  assert.equal(getLicenseStatus({ ...license, revoked: true }, 99n), "revoked");
  assert.equal(getLicenseStatus({ ...license, revoked: true }, 101n), "revoked");
  assert.equal(getLicenseStatus(license, undefined), undefined);
  assert.equal(getLicenseStatus(undefined, 99n), undefined);
});

test("Vietnam datetime input round-trips independently of the device timezone", () => {
  const timestamp = BigInt(Date.parse("2026-11-19T03:00:00Z") / 1000);
  assert.equal(toVietnamDateTimeInput(timestamp), "2026-11-19T10:00");
  assert.equal(parseVietnamDateTime("2026-11-19T10:00"), timestamp);
  assert.equal(toVietnamDateTimeInput(BigInt(Date.parse("2026-12-31T20:15:00Z") / 1000)), "2027-01-01T03:15");
});

test("Malformed and impossible calendar dates are rejected before transactions", () => {
  for (const input of [
    "",
    "2026-02-30T10:00",
    "2026-13-01T10:00",
    "2026-11-19T24:00",
    "2026-11-19",
    "2026-11-19T10:00Z",
  ]) {
    assert.throws(() => parseVietnamDateTime(input), /thời gian/i);
  }
});
