"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import { Notice } from "~~/components/copyright/Notice";
import { WorkHash } from "~~/components/works/WorkHash";
import { hashFile } from "~~/utils/hashFile";
import {
  SelectedWorkFile,
  WORK_FILE_ACCEPT,
  WORK_TYPE_LABELS,
  WorkType,
  formatFileSize,
  validateWorkFile,
} from "~~/utils/workFiles";

type WorkFilePickerProps = {
  value?: SelectedWorkFile;
  disabled?: boolean;
  onChange: (selection: SelectedWorkFile | undefined) => void;
  onBusyChange: (busy: boolean) => void;
};

export function WorkFilePicker({ value, disabled, onChange, onBusyChange }: WorkFilePickerProps) {
  const [isHashing, setIsHashing] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  useEffect(() => {
    setPreviewError(false);
    if (!value) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const currentRequest = ++requestId.current;
    onChange(undefined);
    setError("");
    if (!file) return;
    try {
      const workType = validateWorkFile(file);
      setIsHashing(true);
      onBusyChange(true);
      const fileHash = await hashFile(file);
      if (requestId.current === currentRequest) onChange({ file, fileHash, workType });
    } catch (err) {
      if (requestId.current === currentRequest) {
        input.value = "";
        setError(err instanceof Error ? err.message : "Không đọc được file. Hãy chọn lại.");
      }
    } finally {
      if (requestId.current === currentRequest) {
        setIsHashing(false);
        onBusyChange(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="bqs-file-zone">
        <label className="label font-semibold text-base-content" htmlFor="work-file">
          Chọn file tác phẩm
        </label>
        <input
          id="work-file"
          type="file"
          accept={WORK_FILE_ACCEPT}
          className="file-input file-input-bordered w-full"
          onChange={handleFileChange}
          disabled={disabled || isHashing}
          aria-describedby="work-file-help"
          aria-invalid={Boolean(error)}
        />
        <p id="work-file-help" className="mt-2 text-sm text-base-content/70">
          JPG, PNG, WebP, PDF: tối đa 20 MB · MP3, WAV: tối đa 100 MB. File được xử lý trên thiết bị của bạn.
        </p>
      </div>
      {isHashing && (
        <p role="status" className="flex items-center gap-2">
          <span className="loading loading-spinner loading-sm" aria-hidden="true" />
          Đang đọc file và tính dấu vân tay số…
        </p>
      )}
      {error && (
        <Notice tone="error" role="alert" title="Không đọc được tệp">
          {error}
        </Notice>
      )}
      {value && (
        <div className="rounded-box border border-base-300 bg-base-200/50 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-outline">{WORK_TYPE_LABELS[value.workType]}</span>
            <span className="text-sm">{formatFileSize(value.file.size)}</span>
          </div>
          <p className="m-0 break-words font-medium">{value.file.name}</p>
          {previewUrl && value.workType === WorkType.Image && !previewError && (
            <Image
              src={previewUrl}
              alt={`Xem trước ${value.file.name}`}
              width={640}
              height={360}
              unoptimized
              className="max-h-64 w-full rounded-lg object-contain"
              onError={() => setPreviewError(true)}
            />
          )}
          {previewUrl && value.workType === WorkType.Audio && (
            <audio
              controls
              preload="metadata"
              src={previewUrl}
              className="w-full"
              aria-label={`Nghe thử ${value.file.name}`}
              onError={() => setPreviewError(true)}
            />
          )}
          {previewUrl && value.workType === WorkType.Document && (
            <a href={previewUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              Mở xem PDF
            </a>
          )}
          {previewError && (
            <Notice tone="warning" title="Chưa xem trước được tệp">
              Không xem trước được file này. Bạn vẫn có thể ghi nhận hoặc xác minh hash của file.
            </Notice>
          )}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/60">SHA-256</span>
            <WorkHash key={value.fileHash} fileHash={value.fileHash} />
          </div>
        </div>
      )}
    </div>
  );
}
