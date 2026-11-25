# Registration and Interface Implementation Plan

**Goal:** Hoàn chỉnh thông tin trước khi ghi nhận blockchain và thống nhất khung thông tin toàn ứng dụng.
**Architecture:** Dùng lại schema WorkDetails, hook Scaffold và phiên SIWE. Thêm lưu nháp server và đối chiếu receipt trước khi chuyển nháp sang hồ sơ công khai. UI dùng section card, bước xem lại và tiến trình rõ ràng.
**Spec:** ../specs/2026-11-24-registration-and-interface-design.md

## Constraints

- Giữ nút và thẻ tác phẩm, dùng DaisyUI và Heroicons hiện có.
- Không reset/seed node 8545; không chạy mutation tests trên DB người dùng.
- Không công bố hệ thống là cơ quan đăng ký hay chứng nhận quyền tác giả.

## Tasks

- [x] Validation + draft protocol: test thiếu tác giả/chủ quyền/ngày, ngày đảo, title quá dài, sai receipt; thêm bảng nháp và API prepare/finalize.
- [x] Form chia bước: chọn tệp, khai, xem lại, xác nhận; lưu nháp trước gửi; retry hồ sơ sau giao dịch, xử lý đổi ví.
- [x] Dùng lại fields/summary cho trang chỉnh sửa; nhóm hồ sơ, xác minh, cấp phép và phần thông tin hệ thống; xem lại trước cấp phép, xác nhận đọc trước chấp thuận.
- [x] Kiểm tra unit, TypeScript, lint, build; API bằng node/DB riêng; kiểm tra desktop/mobile. Khởi động frontend mới và cập nhật hướng dẫn test. CSS print cũ giữ nguyên; không phát sinh thay đổi bố cục bản in trong đợt này.

## Execution ledger · hoàn tất 25/11

- Ruling: giữ WorkRegistry V1; nháp ở PostgreSQL và receipt gắn blockHash thay vì sửa contract — tránh triển khai lại và công khai thêm dữ liệu trên chuỗi.
- Ruling: yêu cầu kết nối đúng ví trước khi chọn tệp — tránh form mất dữ liệu khi kết nối ví ở cuối; SIWE vẫn ở bước xác nhận.
- Review độc lập phát hiện mất hash giao dịch thay thế, mất form khi kết nối, thiếu recovery khi timeout. Đã sửa và re-review không còn Important/Critical. Test regression cho replacement/timeout đã thấy fail rồi pass.
- 34/34 unit tests, lint phạm vi thay đổi 0 lỗi/cảnh báo, production build và TypeScript đạt. API 6 nhóm đạt trên node18545 + DB bqs_ui_registration_20261124. Migration thêm bảng nháp đã áp dụng trên DB test rồi DB local hiện tại.
- Browser: chọn PDF mẫu, khai và xem lại; chưa ký vào chain người dùng. Desktop sáng/tối, 375px cho works/register/verify/my/profile/license/explorer/debug, không tràn ngang. Đã sửa khoảng cách giữa khung và chuyển focus/scroll khi sang bước.
- Bản cuối build đúng RPC8545, chạy trên3000; xác nhận còn3 tác phẩm và3 giấy phép demo. Chỉ dừng testserver3003 và testchain18545. Giữ PostgreSQL, chain người dùng. Đã hoàn nguyên cấu hình TypeScript/next-env tự sinh do build riêng.
- Hướng dẫn kiểm tra: docs/TEST_UI_REGISTRATION.md. Chưa triển khai testnet/cloud; không có tuyên bố thủ tục hành chính đã hoàn thành.

## Review focus

DB hỏng trước giao dịch phải chặn gửi; DB hỏng sau giao dịch phải cho retry không đăng ký lại. Receipt của ví/tác phẩm khác bị từ chối. Dữ liệu cũ vẫn đọc được. Đổi ví không dùng quyền phiên cũ. Long text/địa chỉ không tràn ở 375px.
