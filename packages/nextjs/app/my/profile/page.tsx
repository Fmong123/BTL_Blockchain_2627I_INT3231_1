import { PageHeader } from "~~/components/PageHeader";
import { ProfileEditor } from "~~/components/copyright/ProfileEditor";

export default function ProfilePage() {
  return (
    <div className="bqs-page">
      <PageHeader
        title="Hồ sơ của tôi"
        description="Khai báo thông tin tác giả hoặc tổ chức bằng ví của bạn."
        backHref="/my"
        backLabel="Quản lý của tôi"
      />
      <div className="bqs-form-width">
        <ProfileEditor />
      </div>
    </div>
  );
}
