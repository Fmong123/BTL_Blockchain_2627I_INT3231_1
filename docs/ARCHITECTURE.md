# Kiến trúc và quy ước tổ chức mã

## Nền tảng

Phát triển từ Scaffold-ETH 2, giữ Next.js App Router, RainbowKit, Wagmi/Viem, Hardhat, DaisyUI và OpenZeppelin. `packages/hardhat` là lớp blockchain; `packages/nextjs` là ứng dụng web. Không có REST API/database riêng trong phạm vi local này.

## Trách nhiệm thư mục

| Thư mục | Trách nhiệm |
| --- | --- |
| `packages/hardhat/contracts` | WorkRegistry: bản ghi tác phẩm, giấy phép, phân quyền |
| `packages/hardhat/test` | Test hành vi contract, timestamp và quyền |
| `packages/hardhat/deploy` | Triển khai contract bằng nền Rocketh/Hardhat Deploy hiện có |
| `packages/hardhat/scripts` | Sinh ABI, quản lý tài khoản, seed local |
| `packages/hardhat/demo` | Hướng dẫn và file/manifest sinh bởi seed, không phải storage của ứng dụng |
| `packages/nextjs/app` | Route, ghép màn hình và layout |
| `packages/nextjs/components/works` | Biểu mẫu, chọn file, danh sách và bản ghi tác phẩm |
| `packages/nextjs/components/licenses` | Cấp, thu hồi, hiển thị giấy phép và lịch sử |
| `packages/nextjs/hooks/works` | Đọc/giao dịch tác phẩm qua Scaffold hooks |
| `packages/nextjs/hooks/licenses` | Đọc giấy phép, thao tác và thời gian blockchain |
| `packages/nextjs/utils` | Xử lý file/hash, tìm/lọc/phân trang, trạng thái và ngày giờ; test thuần đặt cùng module |
| `packages/nextjs/contracts` | ABI/địa chỉ sinh tự động và khai báo external contract |
| `packages/nextjs/hooks/scaffold-eth` | Hook hạ tầng SE-2 dùng chung |
| `packages/nextjs/services/web3` | Cấu hình mạng và kết nối ví |
| `packages/nextjs/styles` | Token màu DaisyUI trong globals.css; bố cục/component theo demo tím trong copyright.css, gồm token đồng bộ Scaffold UI |
| `docs` | Kiến trúc, thiết kế và ghi nhận quá trình triển khai |

Component dùng lại qua nhiều màn hình nằm trong `components`; component chỉ dùng riêng một route có thể đặt ở `_components` của route đó. Không đưa nghiệp vụ giấy phép vào module xử lý file. Không tự viết lớp kết nối ví hay gọi contract thay thế Scaffold hooks.

Giao diện bám demo tím: header hai tầng, lưới thẻ tác phẩm và hai cột quản lý giấy phép. `WorkArt` chỉ minh họa loại file, không giả định có ảnh/file gốc trên server. Nội dung thẻ, số giấy phép hiệu lực và các trạng thái đọc từ blockchain. `/` hiển thị cùng danh sách với `/works`; công cụ admin/explorer nằm ở footer.

`components/PageHeader.tsx` thống nhất tiêu đề, mô tả, nút chính và liên kết quay lại cho các route. `styles/copyright.css` quản lý thang chữ và lề chung: nội dung/ô nhập 16px, chữ phụ 14px, tiêu đề 28–34px, khung desktop tối đa 1440px. Không đặt quy tắc bẻ mọi từ trên toàn ứng dụng; chỉ hash, code và giá trị dài được bẻ trong vùng riêng. Explorer dùng definition list cho metadata và vùng cuộn riêng cho bảng giao dịch.

## Luồng dữ liệu

1. Trình duyệt kiểm tra định dạng/dung lượng, đọc file và tính SHA-256. File gốc không được tải lên máy chủ/blockchain.
2. Ví ký giao dịch đăng ký: contract lấy `msg.sender` và `block.timestamp`, lưu Work, phát WorkRegistered.
3. Danh sách đọc event từ block deploy, rồi đọc metadata qua `works`. Tìm/lọc trên toàn bộ dữ liệu đã đọc trước khi phân trang 10 mục. Phù hợp demo local; cần indexer nếu mở rộng lớn.
4. Ví đăng ký cấp giấy phép: contract lưu License và latestLicenseId, phát LicenseGranted. Mỗi cặp tác phẩm–người nhận chỉ có một giấy phép đang hiệu lực.
5. Thu hồi chỉ đổi trạng thái giấy phép và phát LicenseRevoked; không xóa lịch sử. Cấp lại dùng mã mới.
6. Frontend đọc giấy phép và timestamp block để hiển thị trạng thái. Không suy ra hiệu lực từ đồng hồ máy. Unix timestamp là giây/bigint; ngày giờ nhập/hiển thị thống nhất Asia/Ho_Chi_Minh.
7. Giao dịch chỉ thành công sau receipt; lỗi refresh sau receipt không làm giao dịch đã xác nhận biến thành thất bại.

## Interface ổn định

- `works(hash)` → `(registrant, registeredAt, title, description, workType)`.
- `WorkType`: Image=0, Audio=1, Document=2. `registrant == address(0)` là chưa có Work.
- `licenses(id)` → `(fileHash, licensor, licensee, grantedAt, expiresAt, revoked)`.
- `licenseCount` là mã cao nhất; mã hợp lệ bắt đầu từ 1. `latestLicenseId(hash, licensee)` trả mã mới nhất, không phải bằng chứng giấy phép còn hiệu lực.
- `isLicenseValid(id)` kiểm tra tồn tại, chưa thu hồi và `block.timestamp < expiresAt`.
- Điều kiện sử dụng cố định phiên bản 1: phi thương mại, phải ghi nguồn, không cấp lại/chuyển nhượng. Không có cơ chế chuyển quyền sở hữu.

Không sửa tay `deployedContracts.ts`. Khi đổi contract, chạy compile/deploy, cập nhật frontend theo ABI sinh tự động. Dữ liệu local không được migration và mất khi tắt node.

## Quyền và giới hạn

Admin chỉ pause/unpause. Pause chặn đăng ký/cấp mới, vẫn cho đọc và thu hồi. Contract kiểm tra quyền dù frontend đã ẩn nút.

Logo, bản vẽ, hồ sơ sáng chế và nhạc là ví dụ nội dung file; hệ thống không tự xác minh tác giả, nhãn hiệu hay văn bằng sáng chế. Hash chỉ so sánh byte nguyên vẹn, không phát hiện nội dung tương tự. Giấy phép được ghi nhận trong ứng dụng không ngăn sao chép file bên ngoài.

## Phần kế thừa và phần nhóm phát triển

Giữ giấy phép gốc tại `LICENCE`. Nền SE-2 cung cấp kết nối ví, hook, debug, explorer và deployment; OpenZeppelin cung cấp Ownable/Pausable. Phần nhóm bổ sung: WorkRegistry theo nghiệp vụ, xử lý ba loại file, cấp/thu hồi giấy phép, tra cứu/quản lý cá nhân, giao diện tiếng Việt, seed và kiểm thử tương ứng.
