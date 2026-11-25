import Link from "next/link";
import { PageHeader } from "~~/components/PageHeader";
import { MyLibrary } from "~~/components/works/MyLibrary";

export default function MyPage() {
  return (
    <div className="bqs-page">
      <PageHeader
        title="Quản lý của tôi"
        description="Tác phẩm đã đăng ký và giấy phép bạn đã nhận."
        action={
          <Link className="btn btn-outline" href="/my/profile">
            Hồ sơ của tôi
          </Link>
        }
      />
      <MyLibrary />
    </div>
  );
}
