# Kết quả kiểm chứng — 19/11/2026

Kiểm chứng trên Windows, Node.js 24.21.0, Yarn 4.13.0, Hardhat local chain 31337 và Chrome headless. Giữ dependency theo lockfile; không thêm package runtime mới.

## Kiểm tra tự động

| Lệnh | Kết quả |
| --- | --- |
| `yarn install --immutable` | Thành công, giữ nguyên yarn.lock; còn các cảnh báo peer dependency của nền hiện tại |
| `yarn test` | 24 test contract + 15 test quy tắc frontend, tất cả đạt |
| `yarn hardhat:check-types` | Đạt |
| `yarn next:check-types` | Đạt |
| `yarn lint` | Đạt |
| `yarn next:build` | Đạt với Next.js 16.2.12/Turbopack, gồm route /my và ba route /works |
| `yarn deploy`, `yarn demo:seed` | Đạt trên node local sạch, tự sinh ABI |
| Chạy lại seed | Dừng an toàn khi đã có giấy phép; không ghi đè |

Contract được kiểm tra cấp/thu hồi, dữ liệu và event, phân quyền registrant/admin/người nhận/người ngoài, đầu vào lỗi, cấp trùng, cấp lại, ranh giới hết hạn và pause. Test frontend kiểm tra file/hash, tìm/lọc trước phân trang, ngày giờ Việt Nam, trạng thái giấy phép, contract không tồn tại và ngữ cảnh thông báo giao dịch.

Node cảnh báo khi tự nhận diện module ES trong các test TypeScript chạy trực tiếp; test vẫn thành công. Không đổi module mode của toàn bộ Next.js chỉ để ẩn cảnh báo này.

## Kiểm tra trình duyệt trên bản production local

Dùng Playwright từ bộ công cụ kiểm chứng, không thêm dependency vào ứng dụng. Provider EIP-1193 giả lập trong trình duyệt kiểm thử gửi giao dịch thực tới các tài khoản mở khóa của Hardhat local; không dùng khóa hay ví thật.

Các bước đã đạt:

1. Danh sách đọc ba tác phẩm seed; vẫn tra cứu được sau khi ngắt ví.
2. Tìm theo tên và lọc PDF cập nhật đúng kết quả.
3. Đường dẫn `/works/verify?hash=...` hiển thị tác phẩm và giấy phép công khai.
4. Ví đăng ký thu hồi giấy phép #1, chờ receipt và cập nhật trạng thái.
5. Cấp lại tạo giấy phép #4; giữ bản ghi #1 đã thu hồi.
6. Chuyển sang ví người nhận ẩn form cấp và nút thu hồi.
7. Thư viện người nhận hiển thị đủ giấy phép còn hiệu lực, hết hạn và đã thu hồi.
8. Chọn lại PDF từ seed tính đúng hash và tìm ra giấy phép hết hạn #3.
9. Đăng ký PDF mới qua UI, nhận receipt và bản ghi thành công.
10. Viewport rộng 390 px: chiều rộng nội dung bằng 390 px, không tràn ngang.
11. Đổi ví trong lúc chờ receipt: thông báo giữ ví/mạng/tác phẩm khởi tạo, kết quả form cũ không xuất hiện trong form của ví mới.
12. Mô phỏng RPC trả `eth_getCode = 0x`: hiện lỗi và nút Thử lại, không hiển thị danh sách rỗng thành công.

Không ghi nhận lỗi JavaScript ở các lượt kiểm tra hoàn tất. Bộ kiểm thử trình duyệt chạy theo nhiều lượt: đã sửa cách điều khiển Burner Wallet tự kết nối và trạng thái ví của provider kiểm thử khi chuyển trang; không thay code ứng dụng để khớp công cụ kiểm thử.

File seed PNG đã kiểm tra CRC/giải mã, WAV kiểm tra header/khung âm thanh, PDF đọc được một trang; SHA-256 cả ba khớp manifest. Ảnh mẫu là một pixel, dùng kiểm chứng hash thay vì minh họa thiết kế logo.

## Review và giới hạn còn lại

Review độc lập contract và tích hợp đã hoàn tất. Đã sửa PNG mẫu lỗi CRC, nhận diện bytecode rỗng của Viem và ngữ cảnh thông báo khi đổi ví; các phần liên quan được kiểm tra lại.

Chưa đo thời gian/RAM với WAV 20/50/100 MiB, chưa kiểm tra thủ công extension ví thật, chưa chạy trên máy thành viên khác hoặc testnet. Cấu hình GitHub Actions đã được cập nhật; chưa có kết quả một lượt chạy trên GitHub trong phiên này. Danh sách đang đọc toàn bộ event, phù hợp demo local; mở rộng dữ liệu cần đánh giá indexer. Đây là bản triển khai local, chưa phải kết quả vận hành production công khai.

Các bước phát triển tiếp theo theo ưu tiên nằm trong [kế hoạch dự án](../KE_HOACH_DU_AN.md).

## Khôi phục thiết kế theo demo tím

Đợt sửa giao diện cùng ngày đã đối chiếu HTML/ảnh demo ban đầu, khôi phục header hai tầng, khung bo góc, nền #f7f7fb, điểm nhấn #7050cd, lưới ba thẻ có minh họa loại file và bố cục chi tiết/cấp phép hai cột. Trang đăng ký, xác minh, quản lý cá nhân, dark mode và các component Scaffold UI dùng chung bảng màu.

Kiểm chứng sau sửa: 15 test quy tắc frontend đạt; `yarn next:build` đạt lint, TypeScript và production build. Trình duyệt kiểm tra lại tìm/lọc, chặn file trùng, đăng ký PDF mới, cấp/thu hồi bằng giao dịch local thật, đổi ví/ẩn thao tác chủ đăng ký, giấy phép nhận và băm PDF để xác minh. Không ghi nhận lỗi JavaScript trong lượt kiểm tra hoàn tất.

Ảnh desktop/detail/mobile/dark đã được xem và so với demo gốc. Kiểm tra computed style xác nhận token ứng dụng và Scaffold cùng #7050cd, AddressInput có nền/border/bo góc đúng thiết kế, lưới desktop ba cột và màn hình 390px không tràn ngang. Review đã sửa h1 trang chi tiết và tab điều hướng khi mở hash trực tiếp. Sau kiểm thử giao dịch, demo local được đưa về ba tác phẩm seed ban đầu.

## Đồng bộ frontend — 20/11/2026

Giữ bảng màu tím và nền Scaffold-ETH 2. Các trang tác phẩm, đăng ký, xác minh/chi tiết, quản lý cá nhân, explorer, công cụ contract và trang 404 dùng chung `PageHeader`, lề nội dung và thang chữ. Chữ chính/ô nhập 16px, chữ phụ tối thiểu 14px, tiêu đề 28–34px theo viewport; chữ trang trí trong minh họa không mang thông tin nghiệp vụ. Khung desktop tối đa 1440px. Bỏ khẩu hiệu lặp và nhãn loại file lặp trong chi tiết.

Explorer dùng definition list với nhãn rộng 210px trên desktop và xếp dọc trên điện thoại. Hash, tham số hàm, bytecode và mô tả dài xuống dòng trong giá trị; bảng danh sách giao dịch cuộn ngang trong khung riêng. Search phân biệt địa chỉ/hash trước khi điều hướng, có lỗi đầu vào; giao dịch không tồn tại có lỗi và nút thử lại. Địa chỉ zero vẫn có nội dung; URL địa chỉ sai hiển thị 404. Tooltip debug và QR ví được giới hạn theo màn hình nhỏ.

Kiểm chứng của đợt này:

- `yarn test:frontend`: 17/17 đạt, gồm hai test parser explorer mới.
- `yarn next:build`: đạt lint, TypeScript và production build.
- Chrome headless kiểm tra 10 route ở 1920, 1440, 768, 390 và 320px: tiêu đề hiển thị, ô nhập 16px, không tràn ngang toàn trang. Đã xem ảnh desktop, form, chi tiết, explorer, mobile và dark mode.
- Tra cứu giao dịch cấp giấy phép thực tế, mở địa chỉ nhận, tab mã/bộ nhớ/nhật ký; bộ nhớ hiển thị có giới hạn 16 slot. Kiểm tra hash sai, giao dịch không tồn tại/thử lại, địa chỉ zero và 404.
- Xác minh PDF seed, tìm/lọc danh sách, mở chi tiết từ thẻ và explorer từ giấy phép. Kiểm tra form chủ đăng ký ở bốn kích thước, chặn đăng ký file trùng, thư viện ví nhận ở ba kích thước, menu ví và QR ở 320px.
- Nội dung tiêu đề/mô tả liền dài được thử trong DOM trình duyệt kiểm thử, không ghi lên blockchain. Các lượt kiểm tra hoàn tất không ghi nhận lỗi JavaScript chưa xử lý.

Đợt này chỉ khởi động lại frontend. Không deploy, reset chain hoặc gửi giao dịch thử; giữ nguyên dữ liệu local hiện có. Kiểm chứng trên Chrome headless và trình duyệt xem trước local, chưa kiểm tra extension ví thật trên thiết bị khác.
