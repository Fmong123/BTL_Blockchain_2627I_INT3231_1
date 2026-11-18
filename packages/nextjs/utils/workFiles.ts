export const WorkType = { Image: 0, Audio: 1, Document: 2 } as const;
export type WorkType = (typeof WorkType)[keyof typeof WorkType];

const MB = 1024 * 1024;
export const MAX_TITLE_BYTES = 256;
export const MAX_DESCRIPTION_BYTES = 2048;
export const WORK_TYPE_LABELS = ["Ảnh", "Bản ghi âm", "Tài liệu PDF"] as const;
export const WORK_FILE_ACCEPT = ".jpg,.jpeg,.png,.webp,.mp3,.wav,.pdf";

const fileFormats = {
  jpg: { workType: WorkType.Image, mimeTypes: ["image/jpeg"], maxBytes: 20 * MB },
  jpeg: { workType: WorkType.Image, mimeTypes: ["image/jpeg"], maxBytes: 20 * MB },
  png: { workType: WorkType.Image, mimeTypes: ["image/png"], maxBytes: 20 * MB },
  webp: { workType: WorkType.Image, mimeTypes: ["image/webp"], maxBytes: 20 * MB },
  mp3: { workType: WorkType.Audio, mimeTypes: ["audio/mpeg", "audio/mp3", "audio/x-mp3"], maxBytes: 100 * MB },
  wav: {
    workType: WorkType.Audio,
    mimeTypes: ["audio/wav", "audio/wave", "audio/x-wav", "audio/vnd.wave"],
    maxBytes: 100 * MB,
  },
  pdf: { workType: WorkType.Document, mimeTypes: ["application/pdf"], maxBytes: 20 * MB },
} as const;

export type SelectedWorkFile = {
  file: File;
  fileHash: `0x${string}`;
  workType: WorkType;
};

export function validateWorkFile(file: Pick<File, "name" | "size" | "type">): WorkType {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.name.lastIndexOf(".") < 1 || !extension || !Object.hasOwn(fileFormats, extension)) {
    throw new Error("Hãy chọn ảnh JPG/PNG/WebP, bản ghi âm MP3/WAV hoặc tài liệu PDF.");
  }
  const format = fileFormats[extension as keyof typeof fileFormats];
  const mimeType = file.type.toLowerCase().split(";")[0].trim();
  if (
    mimeType &&
    mimeType !== "application/octet-stream" &&
    !(format.mimeTypes as readonly string[]).includes(mimeType)
  ) {
    throw new Error("Định dạng file không khớp phần mở rộng. Hãy chọn lại file gốc.");
  }
  if (file.size === 0) throw new Error("File đang trống. Hãy chọn file có nội dung.");
  if (file.size > format.maxBytes) {
    throw new Error(
      `File vượt giới hạn ${format.maxBytes / MB} MB cho ${WORK_TYPE_LABELS[format.workType].toLowerCase()}.`,
    );
  }
  return format.workType;
}

export function getWorkMetadataError(title: string, description: string): string | undefined {
  const encoder = new TextEncoder();
  if (!title.trim()) return "Hãy nhập tên tác phẩm.";
  if (encoder.encode(title.trim()).byteLength > MAX_TITLE_BYTES) return "Tên tác phẩm quá dài. Hãy rút gọn tên.";
  if (encoder.encode(description.trim()).byteLength > MAX_DESCRIPTION_BYTES) return "Mô tả quá dài. Hãy rút gọn mô tả.";
}

export function parseFileHash(value: string): `0x${string}` {
  const hex = value.trim().replace(/^0x/i, "");
  if (!/^[a-f\d]{64}$/i.test(hex))
    throw new Error("Hash SHA-256 cần đúng 64 ký tự thập lục phân, có thể bắt đầu bằng 0x.");
  return `0x${hex.toLowerCase()}`;
}

export function formatFileSize(bytes: number): string {
  return bytes < MB ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / MB).toFixed(1)} MB`;
}
