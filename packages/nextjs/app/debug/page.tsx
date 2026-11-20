import { DebugContracts } from "./_components/DebugContracts";
import { PageHeader } from "~~/components/PageHeader";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Công cụ contract",
  description: "Đọc dữ liệu và tương tác trực tiếp với contract của dự án.",
});

export default function Debug() {
  return (
    <div className="bqs-page bqs-debug">
      <PageHeader
        title="Công cụ contract"
        description="Đọc dữ liệu và thực hiện các hàm quản trị bằng ví có quyền phù hợp."
      />
      <DebugContracts />
    </div>
  );
}
