import Link from "next/link";
import { PageHeader } from "~~/components/PageHeader";

export default function NotFound() {
  return (
    <div className="bqs-page">
      <PageHeader title="Không tìm thấy trang" description="Liên kết không tồn tại hoặc nội dung đã thay đổi." />
      <Link href="/works" className="btn btn-primary">
        Về danh sách tác phẩm
      </Link>
    </div>
  );
}
