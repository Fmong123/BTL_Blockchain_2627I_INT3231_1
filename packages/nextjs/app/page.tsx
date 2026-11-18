import Link from "next/link";
import {
  ArrowRightIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  MusicalNoteIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

const formats = [
  { name: "Ảnh", formats: "JPG · PNG · WebP", limit: "20 MB", Icon: PhotoIcon },
  { name: "Bản ghi âm", formats: "MP3 · WAV", limit: "100 MB", Icon: MusicalNoteIcon },
  { name: "Tài liệu", formats: "PDF", limit: "20 MB", Icon: DocumentTextIcon },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <span className="badge badge-outline mb-6">Demo · Mạng blockchain local</span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Ghi nhận tác phẩm.
            <br />
            <span className="text-primary">Xác minh bằng blockchain.</span>
          </h1>
          <p className="my-6 max-w-xl text-lg text-base-content/70">
            Tạo bản ghi cho ảnh, bản ghi âm và tài liệu của bạn. Mỗi file được gắn với một dấu vân tay số, ví đăng ký và
            thời điểm ghi nhận.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/works/register" className="btn btn-primary">
              Đăng ký tác phẩm <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href="/works/verify" className="btn btn-outline">
              Xác minh file
            </Link>
          </div>
          <p className="mt-4 text-sm text-base-content/60">Bạn có thể xác minh mà không cần kết nối ví.</p>
        </div>
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-5">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                <FingerPrintIcon className="h-8 w-8" />
              </span>
              <h2 className="card-title">Một file, một dấu vân tay</h2>
            </div>
            <p className="m-0 text-base-content/70">
              File được xử lý ngay trên thiết bị. Chỉ hash SHA-256 và thông tin đăng ký được ghi lên blockchain.
            </p>
            <div className="divider my-0" />
            <p className="m-0 text-sm">
              Bạn tự giữ file gốc. Bản ghi thể hiện ví đăng ký và thời điểm; không tự xác nhận danh tính hay quyền tác
              giả.
            </p>
          </div>
        </div>
      </section>
      <section className="mt-14" aria-labelledby="formats-title">
        <h2 id="formats-title" className="text-xl font-bold">
          Ba loại tác phẩm, cùng một quy trình
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {formats.map(({ name, formats: extensions, limit, Icon }) => (
            <div key={name} className="card border border-base-300 bg-base-100">
              <div className="card-body gap-3 p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="card-title text-lg">{name}</h3>
                <p className="m-0 text-sm text-base-content/70">{extensions}</p>
                <span className="badge badge-ghost">Tối đa {limit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-12 rounded-box bg-base-200 p-6 sm:p-8" aria-labelledby="steps-title">
        <h2 id="steps-title" className="text-xl font-bold">
          Bắt đầu với 3 bước
        </h2>
        <ol className="mt-5 grid list-none gap-6 p-0 sm:grid-cols-3">
          {[
            ["01", "Chọn tác phẩm", "Chọn file gốc và nhập thông tin ngắn gọn."],
            ["02", "Xác nhận bằng ví", "Ví ký giao dịch đăng ký trên mạng local."],
            ["03", "Đối chiếu bất cứ lúc nào", "Chọn lại file hoặc nhập hash để tra cứu bản ghi."],
          ].map(([step, title, description]) => (
            <li key={step}>
              <span className="text-sm font-mono font-semibold text-primary">{step}</span>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mb-0 text-sm text-base-content/70">{description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
