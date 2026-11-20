# Phạm vi và kế hoạch Bản Quyền Số

## Nền tảng và phạm vi

Phát triển từ Scaffold-ETH 2 và code đăng ký/xác minh của nhóm. Giữ Hardhat, Next.js App Router, OpenZeppelin Ownable/Pausable, DaisyUI, RainbowKit, Wagmi/Viem và Scaffold hooks. Cấu trúc chi tiết ở [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); lệnh chạy và interface hiện tại ở [README.md](README.md).

Luồng mục tiêu: **đăng ký → danh sách/tra cứu → xác minh → cấp giấy phép → xem quyền nhận → hết hạn/thu hồi → cấp lại và giữ lịch sử**.

| Nghiệp vụ | Phạm vi |
| --- | --- |
| File | Ảnh JPG/PNG/WebP và PDF 20 MiB; MP3/WAV 100 MiB |
| Đăng ký | SHA-256, metadata, ví, timestamp; chặn trùng toàn hệ thống |
| Tra cứu | Tên/ví/hash, loại file, tác phẩm của tôi; phân trang 10 mục |
| Giấy phép | Miễn phí, có hạn, không chuyển nhượng; chỉ registrant cấp/thu hồi |
| Điều kiện v1 | Phi thương mại, ghi nguồn, không cấp lại hoặc chuyển nhượng |
| Lịch sử | Giữ giấy phép cũ; cấp lại sau hết hạn/thu hồi bằng mã mới |
| Quản trị | Pause/unpause; đọc/thu hồi vẫn hoạt động khi pause |
| Demo | Node local, file mẫu do script tạo, tài khoản thử nghiệm nhiều vai trò |

Thiết kế và checklist triển khai đợt hoàn thiện: [design](docs/superpowers/specs/2026-11-19-license-management-design.md), [plan](docs/superpowers/plans/2026-11-19-license-management.md). Kết quả kiểm chứng thực tế cần ghi riêng, không suy ra từ tài liệu mô tả tính năng.

## Phân công nhóm 2–3 người

| Thành viên | Trách nhiệm |
| --- | --- |
| A | Contract, test phân quyền/thời gian, deploy/sinh ABI, seed và kết nối dữ liệu |
| B | Màn hình tác phẩm, cấp/thu hồi, quản lý cá nhân, trạng thái lỗi/loading và mobile |
| C nếu có | Kiểm thử tích hợp độc lập, đo file lớn, tài liệu/slide/video và review chéo |

Nhóm 2 người chia phần C cho A/B. Chốt interface trước khi ghép UI; ABI chỉ cập nhật bằng deploy. Khi đổi component dùng chung hoặc dependency, thông báo người phụ trách liên quan; lockfile không cập nhật tùy tiện. Mỗi phần ghép vào nhánh tích hợp sau khi có kiểm tra tương ứng.

## Tiêu chí nghiệm thu

- Clone mới chạy được theo README, không sửa tay ABI hoặc địa chỉ contract.
- Đăng ký/xác minh đủ ảnh, audio, PDF; tên UTF-8 và giới hạn dung lượng nhất quán.
- A cấp cho B; B thấy quyền; admin/C không cấp hoặc thu hồi thay A.
- Test trước/đúng/sau mốc hết hạn; chặn cấp trùng đang hiệu lực; cấp lại giữ lịch sử.
- Pause chặn đăng ký/cấp mới nhưng cho đọc/thu hồi.
- Đổi ví/mạng, từ chối ký, RPC mất kết nối và lỗi refresh không tạo thông báo thành công sai.
- Tìm/lọc toàn bộ tập dữ liệu trước phân trang; người chưa kết nối ví vẫn xác minh được.
- Chạy test, typecheck hai package, lint, build; kiểm tra lại mobile và máy teammate.
- Đo WAV thực tế 20/50/100 MiB; ghi máy, trình duyệt, thời gian và vấn đề RAM. Chỉ thêm Web Worker nếu phép đo cho thấy cần.
- Bản nộp có mã, hướng dẫn, seed/file mẫu, sơ đồ, kết quả kiểm thử/đo, báo cáo, slide và video dự phòng.

## Kịch bản trình diễn 5–7 phút

1. Giới thiệu nền tảng kế thừa và phần nhóm tự xây.
2. Ví A đăng ký một tác phẩm mới, xác minh lại bằng file.
3. Mở audio/PDF từ bộ seed; tìm/lọc danh sách.
4. A cấp quyền cho B, đổi sang B mở giấy phép nhận.
5. A thu hồi; B thấy trạng thái thay đổi, mở lịch sử và thử cấp lại.
6. Chỉ ra bản ghi hết hạn và kết quả test quyền/timestamp; trình bày giới hạn.

## Cải tiến sau khi ổn định phiên bản này

Theo thứ tự lợi ích/chi phí cho nhóm nhỏ:

1. QR/liên kết chia sẻ trang xác minh và bản in thông tin giấy phép; tận dụng qrcode.react sẵn có. Bản in cần dẫn về trạng thái hiện tại vì quyền có thể bị thu hồi.
2. Tự động hóa các ca giao diện bằng Playwright; bổ sung phép đo file lớn và Web Worker nếu có bằng chứng nghẽn UI.
3. Phân nhóm nội dung thiết kế/logo, tài liệu, bản ghi nhạc riêng với loại file; chọn mẫu điều khoản có phiên bản và dấu vết thay đổi.
4. Testnet dùng chung để hai máy xem cùng dữ liệu. Cần thay các giả định local, kiểm tra RPC giới hạn và cấu hình mạng toàn bộ stack trước khi triển khai.
5. IPFS cho bản xem trước/file được phép công khai, có pinning và quy tắc công bố; CID lưu riêng với SHA-256. Đây là thay đổi phạm vi, không phải phần đang thiếu của bản local.
6. Indexer như Ponder khi lượng event lớn hoặc chạy mạng công khai; vẫn giữ contract làm nguồn quyết định quyền.

Video, NFT/token, thanh toán, chuyển nhượng, chia tiền bản quyền, đồng tác giả, xác minh danh tính và phát hiện tương tự cần thiết kế nghiệp vụ riêng trước khi triển khai. Không gộp tất cả vào bài nhóm nhỏ.

## Giới hạn phải giải thích khi bảo vệ

Blockchain ghi nhận ví, nội dung hash và thời điểm; không tự chứng minh tác giả hay cấp văn bằng pháp lý. Hash không phát hiện đạo văn hoặc nội dung tương tự. File gốc ở thiết bị người dùng, giấy phép không ngăn sao chép ngoài ứng dụng. Local reset làm mất dữ liệu; thời gian seed được tăng để tạo trạng thái demo. Không gọi việc lưu PDF hồ sơ sáng chế là cấp bằng độc quyền sáng chế.
