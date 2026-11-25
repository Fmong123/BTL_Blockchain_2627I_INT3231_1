import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Notice } from "~~/components/copyright/Notice";

export function LegalContext({ licensing = false }: { licensing?: boolean }) {
  return (
    <div className="bqs-legal-context">
      <Notice tone="warning" title={licensing ? "Lưu ý trước khi sử dụng tác phẩm" : "Lưu ý về ghi nhận quyền tác giả"}>
        {licensing
          ? "Cần đối chiếu thẩm quyền của bên cấp và thỏa thuận sử dụng trước khi khai thác tác phẩm."
          : "Bản ghi blockchain không thay thế Giấy chứng nhận đăng ký quyền tác giả. Bạn cần tự giữ tệp gốc và tài liệu chứng minh quyền."}
      </Notice>
      <details className="bqs-context border border-base-300 rounded-box bg-base-100">
        <summary>
          <InformationCircleIcon aria-hidden="true" />
          {licensing ? "Phạm vi của giấy phép trong hệ thống" : "Ghi nhận blockchain và thủ tục quyền tác giả"}
        </summary>
        <div className="bqs-context-body">
          <p>
            {licensing
              ? "Hệ thống ghi nhận sự cho phép sử dụng của ví cấp. Địa chỉ ví và chữ ký chưa xác minh danh tính, tư cách đại diện hoặc toàn bộ nội dung của hợp đồng sử dụng quyền tác giả. Các bên cần đối chiếu thẩm quyền và thỏa thuận bằng văn bản phù hợp trước khi khai thác tác phẩm."
              : "Đăng ký tại đây tạo bản ghi hash, thời điểm và ví trên blockchain kèm hồ sơ tự khai. Hệ thống không gửi hồ sơ tới cơ quan nhà nước và không cấp Giấy chứng nhận đăng ký quyền tác giả. Bạn tự giữ tệp gốc và tài liệu chứng minh quyền."}
          </p>
          {!licensing && (
            <p>
              Khi làm thủ tục nhà nước, cần chuẩn bị tờ khai, bản sao tác phẩm, căn cứ sở hữu; văn bản ủy quyền, sự đồng
              ý của đồng tác giả / đồng chủ sở hữu khi có. Mẫu biểu và cách nộp được hướng dẫn tại cơ quan có thẩm
              quyền.
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <a
              className="link"
              target="_blank"
              rel="noopener noreferrer"
              href="https://congbao.chinhphu.vn/van-ban/van-ban-hop-nhat-so-160-2026-vbhn-lq-vpqh-470657.htm"
            >
              Luật Sở hữu trí tuệ · {licensing ? "Điều 47–48" : "Điều 6, 49–51"}
            </a>
            {!licensing && (
              <a
                className="link"
                target="_blank"
                rel="noopener noreferrer"
                href="https://cov.gov.vn/quyen-tac-gia-quyen-lien-quan/bo-tai-lieu-huong-dan-thu-tuc-hanh-chinh-ve-dang-ky-quyen-tac-gia-quyen-lien-quan-171084.html"
              >
                Hướng dẫn thủ tục chính thức
              </a>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
