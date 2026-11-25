"use client";

import { Suspense, useState } from "react";
import type { SubmitEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "~~/components/PageHeader";
import { LegalContext } from "~~/components/copyright/LegalContext";
import { Notice } from "~~/components/copyright/Notice";
import { WorkFilePicker } from "~~/components/works/WorkFilePicker";
import { WorkRecord } from "~~/components/works/WorkRecord";
import { SelectedWorkFile, parseFileHash } from "~~/utils/workFiles";

export function VerifyWorkScreen() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6">
          Đang tải trang xác minh…
        </p>
      }
    >
      <VerifyWorkFromUrl />
    </Suspense>
  );
}

function VerifyWorkFromUrl() {
  const initialHash = useSearchParams().get("hash") ?? "";
  return <VerifyWorkForm key={initialHash} initialHash={initialHash} />;
}

function readInitialLookup(hash: string) {
  if (!hash) return {};
  try {
    return { fileHash: parseFileHash(hash) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Hash không hợp lệ." };
  }
}

function VerifyWorkForm({ initialHash }: { initialHash: string }) {
  const [initialLookup] = useState(() => readInitialLookup(initialHash));
  const [mode, setMode] = useState<"file" | "hash">(initialHash ? "hash" : "file");
  const [selection, setSelection] = useState<SelectedWorkFile>();
  const [hashInput, setHashInput] = useState(initialHash);
  const [lookupHash, setLookupHash] = useState(initialLookup.fileHash);
  const [isHashing, setIsHashing] = useState(false);
  const [error, setError] = useState(initialLookup.error ?? "");

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
    <div className="bqs-page">
      <PageHeader
        title={initialHash ? "Chi tiết tác phẩm" : "Xác minh tác phẩm"}
        description={
          initialHash
            ? "Thông tin đăng ký và giấy phép sử dụng."
            : "Đối chiếu file hoặc hash với bản ghi trên blockchain. Không cần kết nối ví."
        }
        backHref={initialHash ? "/works" : undefined}
        backLabel="Tác phẩm"
      />
      {lookupHash && <WorkRecord key={lookupHash} fileHash={lookupHash} />}
      <details className={`bqs-lookup-summary ${lookupHash ? "" : "bqs-form-width"}`} open={!lookupHash}>
        <summary>{lookupHash ? "Xác minh bằng file hoặc hash khác" : "Chọn cách xác minh"}</summary>
        <div className="bqs-lookup-body bqs-form">
          <div role="group" aria-label="Cách xác minh" className="join bqs-mode-switch mt-2 mb-5">
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
          <section>
            <div>
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
                    <p id="hash-help" className="bqs-help">
                      Dán hash đã nhận khi đăng ký, gồm 64 ký tự 0–9 và a–f; tiền tố 0x không bắt buộc.
                    </p>
                  </div>
                  <div className="bqs-form-actions bqs-form-footer">
                    <button type="submit" className="btn btn-primary">
                      Tra cứu bản ghi
                    </button>
                  </div>
                  {error && (
                    <Notice tone="error" role="alert" title="Kiểm tra lại hash">
                      {error}
                    </Notice>
                  )}
                </form>
              )}
            </div>
          </section>
        </div>
      </details>
      <Notice className="mt-5" title="Dùng đúng tệp gốc để đối chiếu">
        Chỉnh sửa hoặc đổi định dạng file có thể làm hash thay đổi.
      </Notice>
      <LegalContext />
    </div>
  );
}
