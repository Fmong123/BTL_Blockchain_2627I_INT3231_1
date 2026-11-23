import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "~~/components/PageHeader";
import { WorkCatalog } from "~~/components/works/WorkCatalog";

export default function WorksPage() {
  return (
    <div className="bqs-page">
      <PageHeader
        title="Tác phẩm"
        description="Đăng ký, xác minh và quản lý quyền sử dụng tác phẩm số."
        action={
          <Link href="/works/register" className="btn btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" /> Đăng ký tác phẩm
          </Link>
        }
      />
      <WorkCatalog />
    </div>
  );
}
