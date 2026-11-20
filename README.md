# Bản Quyền Số — ghi nhận và quản lý quyền sử dụng tác phẩm

Đồ án blockchain cho nhóm 2–3 người, phát triển từ **Scaffold-ETH 2** và demo đăng ký/xác minh hiện có. Luồng nghiệp vụ: **đăng ký → xác minh → cấp giấy phép có hạn → kiểm tra → thu hồi hoặc cấp lại**.

Hỗ trợ ảnh JPG/JPEG, PNG, WebP (20 MiB), PDF (20 MiB), MP3/WAV (100 MiB). File được tính SHA-256 trong trình duyệt; blockchain lưu hash và metadata. Người dùng tự giữ file gốc. Logo, tài liệu, bản vẽ và bản ghi nhạc là các tình huống minh họa; chưa hỗ trợ video.

## Chạy local

Yêu cầu Node.js >= 22.10.0 (khuyến nghị Node 24), Yarn 4.13.0 và Git. Chạy tại root chứa package.json/yarn.lock:

```sh
corepack enable
yarn install --immutable
```

Mỗi lệnh ở một terminal riêng; giữ blockchain và frontend mở:

```sh
# Terminal 1: blockchain local
yarn chain

# Terminal 2: đợi RPC sẵn sàng rồi triển khai contract và sinh ABI
yarn deploy

# Terminal 3: frontend
yarn start
```

Mở địa chỉ Next.js thông báo, mặc định http://localhost:3000. Mạng local: RPC http://127.0.0.1:8545, chain ID 31337. Có thể dùng Burner Wallet hoặc MetaMask với ví thử nghiệm; dùng faucet để nhận ETH local. Không cần kết nối ví để tra cứu/xác minh.

### Bật hồ sơ, SIWE và điều khoản

1. Tạo cơ sở dữ liệu PostgreSQL bằng UTF-8. Nếu dùng Docker, đặt biến môi trường BQS_POSTGRES_PASSWORD cho phiên terminal rồi chạy docker compose up -d --wait. Compose chỉ mở cổng 5432 trên máy local.
2. Sao chép packages/nextjs/.env.example thành packages/nextjs/.env.local. Điền DATABASE_URL theo dạng postgresql://postgres:<mật-khẩu-đã-URL-encode>@127.0.0.1:5432/banquyenso. Đặt IRON_SESSION_SECRET bằng khóa ngẫu nhiên tối thiểu 32 ký tự (ví dụ chạy node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))" để sinh khóa).
3. Đặt SIWE_ORIGIN đúng địa chỉ trình duyệt đang mở, gồm scheme, tên máy và cổng. Mặc định http://localhost:3000. COPYRIGHT_RPC_URL phải trỏ tới chính Hardhat mà frontend đang dùng. Sau khi sửa cấu hình, khởi động lại frontend.
4. Tại root, chạy yarn db:migrate rồi yarn db:seed nếu cần hồ sơ mẫu. Migration có thể chạy lại. Seed chỉ chạy với database local và giữ các hồ sơ đã có.

Nếu chạy trên PowerShell và Yarn bị chặn, thay yarn bằng yarn.cmd. Có thể dùng một PostgreSQL UTF-8 đã có thay Compose. Hồ sơ, đăng nhập và điều khoản cần Next.js có server runtime. Luồng đăng ký, xác minh và cấp/thu hồi V1 vẫn chạy được khi chưa cấu hình database.

## Tạo bộ dữ liệu demo

Sau deploy, chạy:

```sh
yarn demo:seed
```

Script chỉ dùng node local và từ chối chain ID khác 31337. Script sinh file mẫu tại `packages/hardhat/demo` cùng `manifest.json` chứa hash, địa chỉ ví và contract:

| Tài khoản Hardhat | Vai trò |
| --- | --- |
| #0 | Admin: pause/unpause qua Debug |
| #1 | Người đăng ký ba tác phẩm và cấp giấy phép |
| #2 | Người nhận các giấy phép |
| #3 | Người ngoài để thử phân quyền |

Giấy phép #1 cho ảnh còn hiệu lực, #2 cho audio đã thu hồi, #3 cho PDF hết hạn. Script tăng thời gian chain **61 giây** để có ngay trạng thái hết hạn. File gốc có thể chọn lại ở trang xác minh; âm thanh là WAV PCM 440 Hz dài 0,25 giây, ảnh là PNG 1 pixel, PDF tối giản, đều do code sinh.

Seed dừng nếu contract đã có giấy phép để giữ dữ liệu hiện tại. Muốn tạo lại bộ mẫu: dừng/chạy lại `yarn chain`, chạy `yarn deploy` và `yarn demo:seed`. Tài khoản/khóa Hardhat chỉ dùng thử nghiệm, không dùng trên mạng thật.

## Sử dụng

1. **Đăng ký:** kết nối ví đúng mạng, chọn file, nhập tên/mô tả và xác nhận giao dịch. Chỉ báo thành công khi receipt thành công. File trùng bị chặn dù dùng ví khác.
2. **Tác phẩm:** tìm theo tên/ví/hash, lọc loại hoặc ví của tôi, phân trang 10 bản ghi. Tìm/lọc áp dụng trên toàn tập bản ghi đã đọc.
3. **Xác minh:** chọn file hoặc nhập hash; không cần ví. Nút Xem bản ghi mở `/works/verify?hash=...`, giữ tương thích đường dẫn bàn giao.
4. **Cấp phép:** trong chi tiết, ví đăng ký nhập người nhận và hạn theo giờ Việt Nam, mặc định 30 ngày. Đăng nhập SIWE trước khi cấp để lưu bản điều khoản v2. Nếu giao dịch đã thành công nhưng lưu điều khoản lỗi, mở thẻ giấy phép và gắn lại điều khoản. Ví nhận đăng nhập, đọc bản đã lưu rồi ký chấp thuận.
5. **Quản lý của tôi:** xem tác phẩm, giấy phép đã nhận và vào Hồ sơ của tôi để tạo hồ sơ tác giả hoặc tổ chức. Trong chi tiết tác phẩm, ví đăng ký có thể bổ sung vai trò, căn cứ quyền và liên kết YouTube/Spotify. Các trường công khai được gắn nhãn tự khai.
6. **Thu hồi:** ví đăng ký xác nhận thu hồi; người nhận thấy trạng thái cập nhật. Sau hết hạn/thu hồi, cấp lại sinh mã mới và giữ lịch sử.

Chỉ ví đăng ký được cấp/thu hồi, admin không làm thay. Mỗi cặp tác phẩm–người nhận chỉ có một giấy phép còn hiệu lực. Không cấp cho ví rỗng hoặc chính mình. Khi pause, đăng ký/cấp mới bị chặn; đọc và thu hồi vẫn hoạt động.

## Interface và tổ chức code

| Thành phần | Vị trí |
| --- | --- |
| Contract/test | `packages/hardhat/contracts/WorkRegistry.sol`, `packages/hardhat/test` |
| Deploy và seed | `packages/hardhat/deploy`, `packages/hardhat/scripts/seed_demo.ts` |
| Route nghiệp vụ | `packages/nextjs/app/works`, `packages/nextjs/app/my` |
| Component nghiệp vụ | `packages/nextjs/components/works`, `packages/nextjs/components/licenses` |
| Hook nghiệp vụ | `packages/nextjs/hooks/works`, `packages/nextjs/hooks/licenses` |
| File/hash và quy tắc thuần | `packages/nextjs/utils` |
| ABI tự sinh | `packages/nextjs/contracts/deployedContracts.ts` |
| API hồ sơ, SIWE, điều khoản | packages/nextjs/app/api/copyright và packages/nextjs/services/copyright |
| Schema, migration và seed | packages/nextjs/db |

`works(hash)` trả `(registrant, registeredAt, title, description, workType)`; ví rỗng là chưa có bản ghi. `Image=0`, `Audio=1`, `Document=2`. Tên 1–256 byte UTF-8, mô tả 0–2048 byte UTF-8.

`licenses(id)` trả `(fileHash, licensor, licensee, grantedAt, expiresAt, revoked)`. Mã bắt đầu từ 1. `latestLicenseId(hash, licensee)` trả mã mới nhất; dùng `isLicenseValid(id)` để kiểm tra hiệu lực. Timestamp là Unix **giây**, đọc bằng bigint; giao diện dùng giờ Việt Nam và thời gian blockchain, không dùng riêng đồng hồ máy để xác định hiệu lực.

Không sửa ABI thủ công. Khi đổi contract, deploy lại. Giữ Debug/Block Explorer và Scaffold hooks; contract mẫu YourContract được dọn khỏi phần nghiệp vụ. Chi tiết quy ước và luồng dữ liệu: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Kiểm tra chất lượng

```sh
yarn test
yarn hardhat:check-types
yarn next:check-types
yarn lint
yarn next:build
```

`yarn test` chạy test contract và quy tắc frontend. Có thể chạy riêng `yarn hardhat:test`, `yarn test:frontend` hoặc test file gốc `yarn test:files`. Test contract không cần giữ node local mở. Test thời gian dùng công cụ Hardhat, không chờ thực tế. CI cài dependency theo lockfile, test, chờ RPC, deploy/seed, kiểm tra kiểu, lint và build.

Kết quả chạy thực tế và phạm vi kiểm chứng: [docs/VERIFICATION.md](docs/VERIFICATION.md).

Chạy yarn test:copyright trên app, Hardhat và PostgreSQL local dành riêng cho kiểm thử. Lệnh ký bằng ví Hardhat mẫu, cập nhật hồ sơ của các ví này và tạo giao dịch kiểm thử. Xem [bộ bàn giao](docs/HANDOFF_NGYN.md) để chuẩn bị demo 5–7 phút.

## Xử lý lỗi

- Tắt Hardhat làm mất dữ liệu. Khởi động lại cần deploy lại và tạo dữ liệu mẫu; ABI/địa chỉ được sinh tự động.
- Nếu RPC/contract không đọc được, kiểm tra cổng 8545, node và deploy, rồi thử lại/tải lại trang. Không thay dữ liệu blockchain lỗi bằng dữ liệu mẫu trong UI.
- Sai nonce sau reset node: xóa dữ liệu hoạt động/nonce của tài khoản thử nghiệm local trong ví hoặc dùng tài khoản thử nghiệm mới.
- Sai mạng, hủy ký hoặc thiếu ETH: chỉnh mạng/kết nối, thử lại hoặc nhận ETH local từ faucet.
- Không phát được WAV có thể do codec trình duyệt; vẫn có thể băm nếu file hợp lệ. Ứng dụng đọc toàn bộ file vào RAM; không có phần trăm tiến độ giả.
- Khi giao dịch thành công nhưng refresh lỗi, giữ mã giao dịch và tải lại dữ liệu; không gửi lại chỉ vì chưa thấy danh sách mới.

## Mã nguồn mở và giới hạn

Kế thừa [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2) và [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts). Giữ thông báo/giấy phép gốc trong `LICENCE`; phần tự phát triển gồm dữ liệu tác phẩm, xử lý file, quản lý giấy phép, giao diện tiếng Việt và các kiểm thử tương ứng.

Hash chỉ đối chiếu byte; sửa/nén/đổi định dạng có thể làm hash khác. Chữ ký xác thực ví giao dịch, không tự xác minh tác giả, danh tính thật, nhãn hiệu hoặc bằng sáng chế. Ghi nhận tài liệu PDF không tạo quyền sáng chế. Giấy phép không chuyển quyền sở hữu và không ngăn sao chép file ngoài hệ thống. Không có lưu file, NFT/token, thanh toán hoặc indexer trong phiên bản local này.

Phạm vi, phân công và cải tiến tiếp theo: [KE_HOACH_DU_AN.md](KE_HOACH_DU_AN.md).
