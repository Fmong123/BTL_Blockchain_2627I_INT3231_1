# Hoàn thiện hệ thống Bản Quyền Số

## Mục tiêu và phạm vi được yêu cầu

Phát triển trực tiếp từ Scaffold-ETH 2 và mã hiện tại: giữ đăng ký/xác minh SHA-256; bổ sung cấp phép miễn phí có thời hạn, thu hồi, lịch sử, giấy phép nhận, tìm kiếm; thống nhất file và tài liệu. Nhóm 2–3 người, demo Hardhat local. Ảnh JPG/PNG/WebP và PDF 20 MiB; MP3/WAV 100 MiB. Không lưu file gốc, không thêm backend/database, token, thanh toán, IPFS hoặc video trong đợt này. Logo là ví dụ nội dung ảnh, hồ sơ sáng chế là ví dụ tài liệu; ứng dụng không cấp văn bằng pháp lý.

## Phương án

- Mở rộng WorkRegistry và frontend hiện có (chọn theo yêu cầu người dùng): ít thay đổi nền tảng, ABI sinh bằng deploy, các route cũ tiếp tục hoạt động.
- Tách server/database/indexer: tăng vận hành và nguồn dữ liệu phải đồng bộ, chưa cần cho local.
- Thay dự án bằng nền tảng NFT: không phù hợp giấy phép không chuyển nhượng và yêu cầu giữ code gốc.

## Contract và dữ liệu

Giữ nguyên Work và registerWork. Thêm License theo tuple `(fileHash, licensor, licensee, grantedAt, expiresAt, revoked)`; `licenseCount` bắt đầu 0, mã mới bắt đầu 1. `latestLicenseId[fileHash][licensee]` giữ mã gần nhất; không duyệt mảng trong contract.

- `grantLicense(bytes32 fileHash, address licensee, uint256 expiresAt) returns (uint256 licenseId)`.
- `revokeLicense(uint256 licenseId)`.
- `licenses(uint256 licenseId)` là public mapping getter.
- `isLicenseValid(uint256 licenseId) view returns (bool)`: tồn tại, chưa thu hồi, `block.timestamp < expiresAt`.
- `LicenseGranted(uint256 indexed licenseId, bytes32 indexed fileHash, address indexed licensee, address licensor, uint256 grantedAt, uint256 expiresAt)`.
- `LicenseRevoked(uint256 indexed licenseId, bytes32 indexed fileHash, address indexed licensee, uint256 revokedAt)`.

Chỉ registrant được cấp/thu hồi, cả admin cũng không thay thế. Chặn tác phẩm không tồn tại, ví 0, tự cấp, hạn không ở tương lai, trùng giấy phép còn hiệu lực, mã không tồn tại và thu hồi lặp. Cấp lại sinh mã mới và giữ lịch sử. Pause chặn đăng ký/cấp mới nhưng cho đọc/thu hồi. Giữ Ownable/Pausable của OpenZeppelin; dùng custom error cho nghiệp vụ mới.

## Frontend

Giữ Next.js App Router, DaisyUI, RainbowKit, Scaffold hooks và thành phần Address/AddressInput từ @scaffold-ui/components. Không dùng mock/fallback khi RPC lỗi. Các hook nghiệp vụ nằm ở hooks/works và hooks/licenses, component ở components/works và components/licenses; route chỉ ghép màn hình.

- /works: danh sách mới nhất, tìm toàn bộ theo tên/ví/hash, lọc loại và của tôi, phân trang 10 mục.
- /works/register và /works/verify: giữ khả năng hiện tại, tái sử dụng xử lý file; xác minh không cần ví. /works/verify?hash= tiếp tục là chi tiết tác phẩm và nhúng quản lý giấy phép.
- /my: hai tab tác phẩm đăng ký và giấy phép nhận, xử lý chưa kết nối ví và đổi tài khoản.
- Chi tiết: điều khoản v1 cố định phi thương mại, ghi nguồn, không cấp lại/chuyển nhượng; người đăng ký thấy form cấp và xác nhận thu hồi. Xem giấy phép công khai, trạng thái dựa dữ liệu/thời gian blockchain. Hiện mã giao dịch và lịch sử cấp/thu hồi.
- Thành công chỉ sau receipt; phân biệt lỗi giao dịch và lỗi refresh. Thao tác đang chạy gắn với ví/tác phẩm lúc gửi; đổi ví không hiển thị kết quả cũ dưới danh tính mới.

Tận dụng layout hiện tại; cải thiện bố cục và theme nhất quán, không dùng hình minh họa giả làm file on-chain. File gốc vẫn do người dùng giữ.

## Tổ chức và vận hành

Dọn contract/deploy/test YourContract khi không còn phụ thuộc; giữ Debug/Block Explorer và công cụ SE-2. ABI chỉ được sinh qua compile/deploy. Script seed chỉ chạy chain ID 31337, tạo dữ liệu ảnh/audio/PDF cùng giấy phép hợp lệ/hết hạn/thu hồi; có file mẫu sử dụng được để đối chiếu hash. Không hardcode địa chỉ contract trong seed.

## Kiểm chứng

Test contract cho phân quyền, ranh giới timestamp trước/đúng/sau, cấp lại và pause. Test hàm frontend cho ngày giờ Việt Nam, trạng thái, tìm/lọc trước phân trang. Chạy test, typecheck hai package, lint và build. Chạy node local/deploy/seed và kiểm tra luồng trình duyệt nhiều ví, không kết nối ví, lỗi mạng, mobile. CI chạy các kiểm tra tương ứng và chờ RPC sẵn sàng trước deploy.
