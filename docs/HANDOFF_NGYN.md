# Bản Quyền Số — Hồ sơ và điều khoản cấp phép

Bản mở rộng dành cho đồ án INT3231.1, phát triển trên nhánh ngyn_branch từ mốc phong_branch 0c6642f.

## Hệ thống và dữ liệu

| Thành phần | Dữ liệu và trách nhiệm |
| --- | --- |
| Trình duyệt | Băm SHA-256 và xem trước file trên thiết bị, ký SIWE, gửi giao dịch, ký chấp thuận bản điều khoản |
| Next.js Route Handlers | Phát và tiêu thụ nonce SIWE, gắn phiên với ví, kiểm tra quyền sửa, đối chiếu sự kiện blockchain |
| PostgreSQL | Nonce hết hạn, hồ sơ cá nhân/tổ chức, metadata tự khai, bản điều khoản theo phiên bản và chữ ký chấp thuận |
| WorkRegistry V1 | Đăng ký hash của tác phẩm, cấp, thu hồi và kiểm tra hiệu lực giấy phép |

Hồ sơ cá nhân/tổ chức thuộc phiên SIWE của chính ví đó. API công khai chỉ trả tên, loại hồ sơ, vai trò và website khi chủ hồ sơ bật công khai. Mã doanh nghiệp và căn cứ đại diện trên hồ sơ tổ chức dành riêng cho ví đăng nhập. Hồ sơ tác phẩm là phần công khai tự khai. Khi sửa, server đối chiếu ví từ phiên với sự kiện WorkRegistered, theo bộ chain ID, địa chỉ contract và hash file. Block hash ngăn việc dùng nhầm hồ sơ khi dựng lại chain local.

Sau khi xác nhận LicenseGranted, hệ thống lưu nội dung v2 chuẩn hóa NFC, hash Keccak-256 và dữ liệu các bên theo đúng giao dịch, block và mã giấy phép. Ví nhận ký thông điệp chứa danh tính giao dịch, hạn, phiên bản và nội dung. Sửa metadata hay cấp lại sẽ không sửa bản đã ký. Contract V1 không chứa hash điều khoản. Trên giao diện, trạng thái blockchain và tình trạng chấp thuận được hiển thị riêng. Giấy phép V1 cũ vẫn tra cứu được và chỉ có bản điều khoản lưu khi ví cấp chủ động gắn.

## Tái lập và nghiệm thu

1. Chuẩn bị PostgreSQL UTF-8 và biến cấu hình theo README. Chạy migration và seed hồ sơ.
2. Cài dependency từ lockfile, chạy Hardhat local, deploy contract rồi seed ảnh/WAV/PDF.
3. Chạy Next.js, mở đúng SIWE_ORIGIN. Dùng các ví thử nghiệm trên chain này.
4. Chạy `yarn test` trước `yarn hardhat:check-types` để sinh kiểu contract trong clone mới. Chạy `yarn next:check-types`, `yarn lint` và `yarn next:build`. Chạy `yarn test:copyright` khi app, DB và RPC local sẵn sàng.

## Kết quả kiểm chứng ngày 20/11/2026

- Clone trực tiếp `ngyn_branch` từ GitHub vào thư mục sạch trên máy Windows. Cài từ lockfile, build Next.js và khởi động bản production local. Áp dụng migration lên một database PostgreSQL UTF-8 mới và nạp hồ sơ mẫu.
- 24 test contract và 17 test frontend đạt. Lint và kiểm tra kiểu của hai workspace đạt. Test API trên bản production đạt các ca nonce hết hạn/dùng lại, chữ ký sai ví, đổi ví, quyền sửa hồ sơ, lọc trường công khai, URL bị từ chối, đối chiếu giao dịch và chữ ký gắn đúng giấy phép.
- Chrome chạy qua luồng hai ví từ SIWE, tạo hồ sơ, đăng ký ảnh đến cấp, ký chấp thuận, thu hồi và cấp lại. Xác minh đủ ảnh, WAV và PDF khi không kết nối ví ở chiều rộng 390 px.
- Clone sạch được kiểm tra trên máy phát triển. Bài chạy trên máy thành viên khác cần thực hiện khi nhóm tiếp nhận bộ bàn giao.

Đo WAV PCM trên Windows, Chrome 157.0.8103.79, AMD Ryzen 7 H 260 và khoảng 31 GiB RAM khả dụng. Mỗi cỡ chọn file ba lần trong trang đăng ký sau khi làm nóng ứng dụng. Thời gian tính từ lúc lệnh chọn file đến lúc UI hiển thị đúng hash, so sánh với SHA-256 của Node.js. RAM bên dưới là phần tăng ước tính của bộ nhớ backing store do Chrome DevTools báo, không phản ánh toàn bộ RAM của tiến trình.

| File WAV | Thời gian của 3 lần chạy (ms) | RAM tăng ước tính |
| --- | --- | --- |
| 20 MiB | 47, 42, 103 | 20 MiB |
| 50 MiB | 132, 95, 90 | 50 MiB |
| 100 MiB | 230, 238, 239 | 100 MiB |

## Kịch bản trình bày 6 phút

[Slide trình bày](handoff-media/ban-quyen-so-handoff.pptx) · [Video dự phòng có chú thích](handoff-media/demo-ban-quyen-so.mp4)

| Thời gian | Màn hình | Thao tác |
| --- | --- | --- |
| 0:00–0:45 | Quản lý của tôi → Hồ sơ của tôi | Ví A ký SIWE, tạo hồ sơ và bật công khai tên/vai trò |
| 0:45–1:45 | Đăng ký | Chọn PNG hoặc WAV mẫu chưa đăng ký, xem SHA-256, ký giao dịch và mở bản ghi |
| 1:45–2:45 | Chi tiết tác phẩm | Thêm tác giả, đơn vị đại diện, căn cứ quyền và liên kết trải nghiệm. Mở liên kết trong tab mới |
| 2:45–3:15 | Xác minh | Mở cửa sổ không có ví, chọn lại cùng file hoặc nhập hash và đối chiếu bản ghi |
| 3:15–4:15 | Giấy phép tác phẩm | Ví A đọc mẫu v2, nhập ví B và hạn, ký cấp giấy phép |
| 4:15–5:00 | Giấy phép đã nhận | Ví B đăng nhập, mở điều khoản đã lưu và ký chấp thuận |
| 5:00–6:00 | Chi tiết tác phẩm | Ví A thu hồi và cấp lại, đối chiếu ID mới và lịch sử chấp thuận cũ |

Khi trình bày, phân biệt dữ liệu tự khai, bằng chứng giao dịch và trạng thái chấp thuận. Đăng ký hash chỉ là bản ghi trong hệ thống. Dự án dùng blockchain local, không lưu file gốc và chưa triển khai mua bán, NFT, thanh toán, xác minh danh tính pháp lý hay quy trình tranh chấp.
