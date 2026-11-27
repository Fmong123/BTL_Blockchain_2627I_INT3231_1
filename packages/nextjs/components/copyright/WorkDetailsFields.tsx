"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { categories, partyRoles } from "~~/utils/copyrightDetails";
import type { WorkDetails } from "~~/utils/copyrightDetails";

export function emptyWorkDetails(): WorkDetails {
  return {
    category: "Tài liệu",
    language: "",
    creationDate: "",
    publicationDate: "",
    basis: "",
    certificate: "",
    experienceUrl: "",
    parties: [
      { name: "", role: "Người sáng tác" },
      { name: "", role: "Chủ sở hữu quyền" },
    ],
  };
}

export function WorkDetailsFields({ value, onChange }: { value: WorkDetails; onChange: (value: WorkDetails) => void }) {
  const set = <K extends keyof WorkDetails>(key: K, next: WorkDetails[K]) => onChange({ ...value, [key]: next });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return (
    <div className="space-y-6">
      <div className="bqs-field-grid">
        <label>
          <span className="label">
            Nhóm nội dung <span className="text-error">*</span>
          </span>
          <select
            className="select select-bordered w-full"
            value={value.category}
            onChange={event => set("category", event.target.value as WorkDetails["category"])}
          >
            {categories.map(category => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">
            Ngôn ngữ <span className="bqs-optional">(nếu có)</span>
          </span>
          <input
            className="input input-bordered w-full"
            value={value.language}
            maxLength={40}
            placeholder="Ví dụ: Tiếng Việt"
            onChange={event => set("language", event.target.value)}
          />
        </label>
        <label>
          <span className="label">
            Ngày hoàn thành / sáng tạo <span className="text-error">*</span>
          </span>
          <input
            type="date"
            required
            max={today}
            className="input input-bordered w-full"
            value={value.creationDate}
            onChange={event => set("creationDate", event.target.value)}
          />
        </label>
        <label>
          <span className="label">
            Ngày công bố <span className="bqs-optional">(nếu đã công bố)</span>
          </span>
          <input
            type="date"
            min={value.creationDate || undefined}
            max={today}
            className="input input-bordered w-full"
            value={value.publicationDate}
            onChange={event => set("publicationDate", event.target.value)}
          />
        </label>
      </div>
      <div className="bqs-inset-panel">
        <h3>Tác giả, chủ sở hữu và đại diện</h3>
        <p className="bqs-help">
          Khai riêng người sáng tác và chủ sở hữu quyền. Nếu là cùng một người, nhập tên ở cả hai vai trò. Thêm từng
          đồng tác giả / đồng chủ sở hữu nếu có.
        </p>
        <div className="space-y-3">
          {value.parties.map((party, index) => (
            <div className="bqs-party-row" key={index}>
              <label>
                <span className="label">
                  Tên bên {index + 1} <span className="text-error">*</span>
                </span>
                <input
                  required
                  maxLength={120}
                  className="input input-bordered w-full"
                  value={party.name}
                  onChange={event =>
                    set(
                      "parties",
                      value.parties.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)),
                    )
                  }
                />
              </label>
              <label>
                <span className="label">Vai trò</span>
                <select
                  className="select select-bordered w-full"
                  value={party.role}
                  onChange={event =>
                    set(
                      "parties",
                      value.parties.map((row, i) =>
                        i === index ? { ...row, role: event.target.value as typeof party.role } : row,
                      ),
                    )
                  }
                >
                  {partyRoles.map(role => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label={`Xóa bên ${index + 1}`}
                disabled={value.parties.length === 1}
                onClick={() =>
                  set(
                    "parties",
                    value.parties.filter((_, i) => i !== index),
                  )
                }
              >
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                <span className="sm:sr-only">Xóa</span>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm mt-4"
          disabled={value.parties.length >= 12}
          onClick={() => set("parties", [...value.parties, { name: "", role: "Người sáng tác" }])}
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Thêm bên liên quan
        </button>
      </div>
      <label className="block">
        <span className="label">
          Căn cứ sở hữu / đại diện <span className="text-error">*</span>
        </span>
        <textarea
          required
          maxLength={500}
          className="textarea textarea-bordered w-full min-h-28"
          value={value.basis}
          onChange={event => set("basis", event.target.value)}
          placeholder="Ví dụ: tự sáng tạo và sở hữu; hợp đồng giao việc / chuyển giao số…; văn bản ủy quyền số…"
        />
        <span className="bqs-help block">
          Nêu tóm tắt căn cứ và tham chiếu tài liệu. Nếu có đồng tác giả, đồng chủ sở hữu hoặc dùng tác phẩm gốc để làm
          phái sinh, ghi căn cứ đồng ý / cho phép tương ứng. Không nhập CCCD, địa chỉ riêng hay toàn văn giấy tờ.
        </span>
      </label>
      <div className="bqs-field-grid">
        <label>
          <span className="label">
            Chứng nhận đã có <span className="bqs-optional">(nếu có)</span>
          </span>
          <input
            className="input input-bordered w-full"
            maxLength={500}
            value={value.certificate}
            onChange={event => set("certificate", event.target.value)}
            placeholder="Số, ngày và cơ quan cấp; thông tin tự khai"
          />
        </label>
        <label>
          <span className="label">
            Liên kết trải nghiệm <span className="bqs-optional">(nếu có)</span>
          </span>
          <input
            type="url"
            className="input input-bordered w-full"
            maxLength={500}
            value={value.experienceUrl}
            onChange={event => set("experienceUrl", event.target.value)}
            placeholder="Liên kết HTTPS của YouTube / Spotify"
          />
        </label>
      </div>
      <p className="bqs-help">
        Các thông tin hồ sơ này sẽ được công khai và được ghi nhãn tự khai, chưa được cơ quan có thẩm quyền đối chiếu.
      </p>
    </div>
  );
}

export function WorkDetailsSummary({ details }: { details: WorkDetails }) {
  return (
    <dl className="bqs-info-grid">
      <div>
        <dt>Nhóm nội dung</dt>
        <dd>{details.category}</dd>
      </div>
      <div>
        <dt>Ngôn ngữ</dt>
        <dd>{details.language || "Không khai"}</dd>
      </div>
      <div>
        <dt>Ngày hoàn thành / sáng tạo</dt>
        <dd>{details.creationDate ? details.creationDate.split("-").reverse().join("/") : "Chưa khai"}</dd>
      </div>
      <div>
        <dt>Ngày công bố</dt>
        <dd>
          {details.publicationDate ? details.publicationDate.split("-").reverse().join("/") : "Chưa khai ngày công bố"}
        </dd>
      </div>
      <div className="bqs-span-all">
        <dt>Các bên và vai trò</dt>
        <dd>
          <ul className="bqs-party-list">
            {details.parties.map((party, i) => (
              <li key={i}>
                <strong>{party.name}</strong>
                <span>{party.role}</span>
              </li>
            ))}
          </ul>
        </dd>
      </div>
      <div className="bqs-span-all">
        <dt>Căn cứ sở hữu / đại diện</dt>
        <dd className="whitespace-pre-wrap">{details.basis}</dd>
      </div>
      {details.certificate && (
        <div className="bqs-span-all">
          <dt>Chứng nhận tự khai · chưa đối chiếu</dt>
          <dd>{details.certificate}</dd>
        </div>
      )}
      {details.experienceUrl && (
        <div className="bqs-span-all">
          <dt>Liên kết trải nghiệm</dt>
          <dd>
            <a className="link" href={details.experienceUrl} target="_blank" rel="noopener noreferrer">
              Mở trên {details.experienceUrl.includes("youtube.com") ? "YouTube" : "Spotify"}
            </a>
          </dd>
        </div>
      )}
    </dl>
  );
}
