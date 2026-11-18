"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { WorkFilePicker } from "~~/components/works/WorkFilePicker";
import { WorkRecord } from "~~/components/works/WorkRecord";
import { SelectedWorkFile, parseFileHash } from "~~/utils/workFiles";

export default function VerifyWorkPage() {
  const [mode, setMode] = useState<"file" | "hash">("file");
  const [selection, setSelection] = useState<SelectedWorkFile>();
  const [hashInput, setHashInput] = useState("");
  const [lookupHash, setLookupHash] = useState<`0x${string}`>();
  const [isHashing, setIsHashing] = useState(false);
  const [error, setError] = useState("");

  function changeMode(nextMode: "file" | "hash") {
    if (nextMode === mode) return;
    setMode(nextMode);
    setSelection(undefined);
    setHashInput("");
    setLookupHash(undefined);
    setError("");
  }
  function handleHashLookup(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLookupHash(undefined);
    try {
      setLookupHash(parseFileHash(hashInput));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hash không hợp lệ.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <span className="badge badge-outline mb-4">Bước 2 · Đối chiếu bản ghi</span>
      <h1 className="text-3xl font-bold tracking-tight">Xác minh tác phẩm</h1>
      <p className="text-base-content/70">
        Tra cứu dấu vân tay của file trên blockchain. Không cần kết nối ví hay trả phí giao dịch.
      </p>
      <div role="group" aria-label="Cách xác minh" className="join mt-4 mb-6">
        <button
          type="button"
          className={`btn join-item ${mode === "file" ? "btn-primary" : "btn-outline"}`}
          aria-pressed={mode === "file"}
          onClick={() => changeMode("file")}
          disabled={isHashing}
        >
          Chọn file
        </button>
        <button
          type="button"
          className={`btn join-item ${mode === "hash" ? "btn-primary" : "btn-outline"}`}
          aria-pressed={mode === "hash"}
          onClick={() => changeMode("hash")}
          disabled={isHashing}
        >
          Nhập hash
        </button>
      </div>
      <section className="card border border-base-300 bg-base-100 shadow-sm mb-6">
        <div className="card-body p-5 sm:p-8">
          {mode === "file" ? (
            <WorkFilePicker
              value={selection}
              onBusyChange={setIsHashing}
              onChange={value => {
                setSelection(value);
                setLookupHash(value?.fileHash);
              }}
            />
          ) : (
            <form onSubmit={handleHashLookup} className="space-y-4">
              <div>
                <label className="label font-semibold text-base-content" htmlFor="hash-input">
                  Hash SHA-256 của tác phẩm
                </label>
                <input
                  id="hash-input"
                  className="input input-bordered w-full font-mono text-sm"
                  value={hashInput}
                  onChange={event => {
                    setHashInput(event.target.value);
                    setLookupHash(undefined);
                    setError("");
                  }}
                  placeholder="0x… hoặc 64 ký tự hash"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  required
                  aria-describedby="hash-help"
                  aria-invalid={Boolean(error)}
                />
                <p id="hash-help" className="text-xs text-base-content/60">
                  Dán hash đã nhận khi đăng ký, gồm 64 ký tự 0–9 và a–f; tiền tố 0x không bắt buộc.
                </p>
              </div>
              <button type="submit" className="btn btn-primary">
                Tra cứu bản ghi
              </button>
              {error && (
                <p role="alert" className="text-error">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </section>
      {lookupHash && <WorkRecord key={lookupHash} fileHash={lookupHash} />}
      <p className="mt-6 text-sm text-base-content/60">
        Kết quả đối chiếu file nguyên vẹn. Nén, chỉnh sửa hoặc đổi định dạng có thể làm hash thay đổi. Dữ liệu demo
        thuộc mạng local đang chạy.
      </p>
    </div>
  );
}
