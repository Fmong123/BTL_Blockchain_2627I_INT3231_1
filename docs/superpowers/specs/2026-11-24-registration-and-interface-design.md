# Đồng bộ giao diện và quy trình ghi nhận tác phẩm

Theo yêu cầu ngày 24/11: giữ nút, thẻ tác phẩm và bố cục tổng thể; nhóm thông tin vào khung gọn, thống nhất tiêu đề/nhãn/nội dung và chỉ thêm icon ở các đầu mục có ích.

## Phương án

Chỉ sửa CSS không giải quyết việc thiếu hồ sơ trước khi ghi blockchain. Đổi smart contract để đưa toàn bộ hồ sơ lên chuỗi gây công khai dữ liệu và buộc triển khai lại. Chọn giữ WorkRegistry V1 và đưa việc khai, kiểm tra, lưu nháp PostgreSQL vào cùng luồng đăng ký.

## Quy trình

1. Chọn tệp, tính hash và kiểm tra trùng; không gửi tệp gốc lên máy chủ.
2. Nhập tên, tóm tắt, nhóm nội dung, ngày sáng tạo, người sáng tác, chủ sở hữu, căn cứ quyền; ngày công bố, ngôn ngữ, chứng nhận và liên kết là tùy chọn. Người có nhiều vai trò được khai thành các dòng riêng. Tài liệu đại diện, đồng tác giả, phái sinh được hướng dẫn bằng căn cứ/tham chiếu, không yêu cầu giấy tờ cá nhân công khai.
3. Xem lại toàn bộ thông tin, xác nhận quyền kê khai và việc công khai. Đăng nhập ví trước khi gửi. Server xác thực và lưu nháp trước khi blockchain nhận giao dịch.
4. Sau khi giao dịch xác nhận, server đối chiếu receipt, sự kiện, ví, hash và metadata; lưu hồ sơ gắn đúng block. Nếu bước lưu lỗi, cho thử lại bằng giao dịch đã có, không gửi đăng ký lần hai. Lưu mã khôi phục trong trình duyệt, giới hạn theo ví/mạng/contract.

Trang hồ sơ, xác minh, chi tiết, cấp phép, giấy phép nhận và bản in dùng cùng khung thông tin. Cấp phép có bước xem lại và xác nhận thẩm quyền, chấp thuận điều khoản có ô xác nhận đã đọc. Các giấy phép cũ vẫn tra cứu được.

## Phạm vi pháp lý

Đây là ghi nhận kỹ thuật và hồ sơ tự khai, không phải tiếp nhận hồ sơ hay cấp giấy chứng nhận nhà nước. Tham chiếu Điều 6, 49–51 Luật SHTT và Điều 47–48 về chuyển quyền sử dụng. Không tuyên bố chữ ký ví chứng minh danh tính/pháp nhân hoặc hệ thống hoàn thành hợp đồng pháp lý. Cung cấp liên kết hướng dẫn chính thức:

- https://congbao.chinhphu.vn/van-ban/van-ban-hop-nhat-so-160-2026-vbhn-lq-vpqh-470657.htm
- https://cov.gov.vn/quyen-tac-gia-quyen-lien-quan/bo-tai-lieu-huong-dan-thu-tuc-hanh-chinh-ve-dang-ky-quyen-tac-gia-quyen-lien-quan-171084.html

## Giới hạn và kiểm chứng

Không reset/seed lại blockchain người dùng, không sửa ABI/contract, không thay khóa/cấu hình triển khai. Migration chỉ thêm bảng nháp. Kiểm thử validation, lưu trước giao dịch, sai ví/receipt/hash, retry, desktop/mobile, dark theme; build riêng trước khi đổi frontend đang chạy. Thử giao dịch trên node và DB kiểm thử riêng.
