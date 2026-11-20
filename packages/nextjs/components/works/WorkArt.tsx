import { WORK_TYPE_LABELS } from "~~/utils/workFiles";

export const WORK_CATEGORIES = {
  0: "Hình ảnh / Thiết kế",
  1: "Âm nhạc / Bản ghi",
  2: "Tài liệu / PDF",
};

const WAVE_HEIGHTS = [9, 18, 30, 15, 38, 51, 27, 43, 56, 35, 19, 40, 30, 49, 22, 36, 16, 26, 10];

/** Type illustration: the original file is not stored by the registry. */
export function WorkArt({ workType, title }: { workType: 0 | 1 | 2; title: string }) {
  const variant = workType === 0 ? "image" : workType === 1 ? "audio" : "document";
  return (
    <div
      className={`bqs-art bqs-art-${variant}`}
      role="img"
      aria-label={`Minh họa loại file: ${WORK_TYPE_LABELS[workType]}`}
    >
      <span className="bqs-art-tag">{WORK_TYPE_LABELS[workType]}</span>
      {workType === 0 ? (
        <>
          <span className="bqs-art-word" aria-hidden="true">
            {title.trim().split(/\s+/)[0]}.
          </span>
          <span className="bqs-art-caption" aria-hidden="true">
            Dấu ấn sáng tạo
          </span>
        </>
      ) : workType === 2 ? (
        <div className="bqs-paper" aria-hidden="true">
          <small>THƯ VIỆN SÁNG TẠO</small>
          <strong>{title}</strong>
          <span />
          <span />
          <span />
        </div>
      ) : (
        <>
          <div className="bqs-wave" aria-hidden="true">
            {WAVE_HEIGHTS.map((height, index) => (
              <span key={index} style={{ height }} />
            ))}
          </div>
          <span className="bqs-audio-title" aria-hidden="true">
            {title}
          </span>
        </>
      )}
    </div>
  );
}
