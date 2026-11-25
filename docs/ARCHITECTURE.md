# Kiến trúc và quy ước tổ chức mã

## Ưu tiên local và cấu hình mạng tùy chọn

Bản local phục vụ demo của nhóm hai người: Hardhat chạy theo phiên, Next.js và PostgreSQL local. Hardhat hiện lưu trạng thái trong RAM; PostgreSQL lưu bền riêng. Mức local giữ dữ liệu blockchain qua lần khởi động là phương án tiếp theo, chưa được triển khai hoặc kiểm chứng trong repo. Ứng dụng không có kho lưu file gốc; người dùng tự giữ file để đối chiếu hash.

`packages/nextjs/copyright.config.ts` chọn Hardhat hoặc Sepolia từ `NEXT_PUBLIC_COPYRIGHT_NETWORK`, cung cấp cùng chain/ABI/deployment cho giao diện, API và SIWE. Contract Sepolia được khai báo qua biến môi trường và `externalContracts.ts`; thiếu cấu hình sẽ báo chưa triển khai, không dùng contract local thay thế. ABI được lấy từ khai báo WorkRegistry đã sinh trên bất kỳ mạng nào, nên clone mới chỉ deploy Sepolia vẫn hoạt động.

Phiên đăng nhập gắn chain ID; lịch sử sự kiện đọc từ block deploy theo lô tối đa 500 block. Explorer local được thay bằng đường dẫn Sepolia Etherscan khi dùng testnet. Vercel, PostgreSQL cloud và Sepolia là lựa chọn triển khai dùng chung sau này, không bắt buộc cho bản local; nếu chọn thì phải cấu hình cùng bộ deployment theo [hướng dẫn triển khai](TESTNET_DEPLOYMENT.md). `BQS_NEXT_DIST_DIR` cho phép chạy build kiểm tra riêng, không ghi đè thư mục `.next` của app đang phục vụ người dùng.

## Nền tảng

Phát triển từ Scaffold-ETH 2, giữ Next.js App Router, RainbowKit, Wagmi/Viem, Hardhat, DaisyUI và OpenZeppelin. `packages/hardhat` là lớp blockchain; `packages/nextjs` gồm ứng dụng web và Route Handlers cho API hồ sơ, SIWE, metadata và điều khoản. PostgreSQL/Drizzle lưu dữ liệu ngoài blockchain; Next.js cần server runtime cho các API này.

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
| `packages/nextjs/components/copyright` | Đăng nhập, hồ sơ tự khai, metadata và chấp thuận điều khoản |
| `packages/nextjs/app/api/copyright` | API phiên, hồ sơ ví, metadata tác phẩm và điều khoản |
| `packages/nextjs/services/copyright` | Kiểm tra SIWE/quyền, đối chiếu blockchain và bản điều khoản bất biến |
| `packages/nextjs/db` | Schema, migration, seed và kiểm thử tích hợp PostgreSQL |
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

`components/PageHeader.tsx` thống nhất tiêu đề, mô tả, nút chính và liên kết quay lại cho các route. `InfoSection` chia các nhóm thông tin thành khung, `WorkDetailsFields` / `WorkDetailsSummary` dùng chung cho đăng ký và chỉnh sửa/đọc hồ sơ. `styles/copyright.css` quản lý thang chữ: ô nhập 16px, nội dung thông tin 15px, nhãn 13–14px, tiêu đề khung 20px, tiêu đề trang 28–34px, khung desktop tối đa 1440px. Không đặt quy tắc bẻ mọi từ trên toàn ứng dụng; chỉ hash, code và giá trị dài được bẻ trong vùng riêng. Explorer dùng definition list cho metadata và vùng cuộn riêng cho bảng giao dịch.

## Luồng dữ liệu

1. Trình duyệt kiểm tra định dạng/dung lượng, đọc file và tính SHA-256. File gốc không được tải lên máy chủ/blockchain.
2. Luồng đăng ký đi từ chọn tệp → khai đủ metadata và các bên/căn cứ quyền → xem lại → xác nhận kê khai/công khai và SIWE → chuẩn bị hồ sơ nháp → giao dịch → hoàn tất hồ sơ. `PUT /api/copyright/registration` xác thực và lưu vào `registration_drafts` trước khi ví ký. `preparationId` là digest của nội dung chuẩn hóa, thuộc khóa hồ sơ nháp cùng mạng/contract/ví/hash file; các nội dung khác nhau không ghi đè nhau giữa các tab. Contract lấy `msg.sender` và `block.timestamp`, lưu Work, phát WorkRegistered. `POST` chỉ định đúng mã chuẩn bị, đối chiếu receipt, ví, contract, hash và metadata rồi lưu `work_details` gắn blockHash và xóa các phiên bản nháp của cùng mạng/contract/ví/hash trong một transaction DB. Lần hoàn tất đầu tiên được giữ nguyên; retry hoặc tab khác trả lại hồ sơ đã hoàn tất và không ghi đè các chỉnh sửa sau đó. Khôi phục cũ không có mã chỉ tự chọn khi có đúng một nháp phù hợp; nhiều nháp cần chỉ định mã. Hash giao dịch được nhớ ngay khi broadcast, thay bằng hash receipt khi tăng tốc; lỗi lưu có thể retry/khôi phục không gửi giao dịch mới. Migration `0002` gắn mã `legacy` cho các nháp cũ, giữ nguyên nội dung và ngày tạo.
3. Danh sách đọc event từ block deploy, rồi đọc metadata qua `works`. Tìm/lọc trên toàn bộ dữ liệu đã đọc trước khi phân trang 10 mục. Phù hợp demo local; cần indexer nếu mở rộng lớn.
4. Ví đăng ký cấp giấy phép: contract lưu License và latestLicenseId, phát LicenseGranted. Mỗi cặp tác phẩm–người nhận chỉ có một giấy phép đang hiệu lực.
5. Thu hồi chỉ đổi trạng thái giấy phép và phát LicenseRevoked; không xóa lịch sử. Cấp lại dùng mã mới.
6. Frontend đọc giấy phép và timestamp block để hiển thị trạng thái. Không suy ra hiệu lực từ đồng hồ máy. Unix timestamp là giây/bigint; ngày giờ nhập/hiển thị thống nhất Asia/Ho_Chi_Minh.
7. Giao dịch chỉ thành công sau receipt; lỗi refresh sau receipt không làm giao dịch đã xác nhận biến thành thất bại.
8. SIWE dùng nonce một lần trong PostgreSQL và cookie HttpOnly; phiên gắn với ví ký. Backend kiểm tra ví từ phiên với quyền trên blockchain khi cập nhật tác phẩm hoặc điều khoản.
9. Ví cấp đăng nhập trước khi cấp để lưu bản điều khoản v2 theo giao dịch, block, contract và mã giấy phép. Lưu ngoài blockchain lỗi có thể gắn lại; không gửi lại giao dịch cấp đã thành công. Ví nhận ký thông điệp của chính bản đã lưu; cấp lại sinh ID và bản chấp thuận riêng.
10. Trang xác minh có QR/liên kết chứa hash, không chứa phiên hoặc ví đăng nhập. `/licenses/[id]` đọc giấy phép, tác phẩm và sự kiện cấp tại cùng block qua `useScaffoldContract`, dùng timestamp của block đó để xác định hiệu lực. QR trên bản in gắn `tx`, `block`, `contract`; route từ chối hiển thị giấy phép khác nếu danh tính không khớp sau reset chain.

## Hiệu lực và chấp thuận

WorkRegistry V1 là nguồn quyết định hiệu lực giấy phép; contract không lưu hash điều khoản hoặc bắt buộc chấp thuận. Vì vậy một giấy phép có thể đang hiệu lực trên blockchain và chưa được ký chấp thuận. UI tách hai trạng thái này. API lỗi được hiển thị là không xác định được điều khoản/chấp thuận, không suy ra chưa ký hoặc không có điều khoản.

Hồ sơ ví và metadata là dữ liệu tự khai. Hồ sơ công khai chỉ trả loại, tên, vai trò và website khi chủ ví bật công khai. Mã doanh nghiệp/căn cứ đại diện không xuất hiện trên trang chia sẻ hay bản in. Metadata tác phẩm và điều khoản được đối chiếu block hash để không dùng nhầm dữ liệu khi chain local được tạo lại.

## Chia sẻ và bản in

Các thẻ giấy phép trong chi tiết tác phẩm và thư viện cá nhân đều mở cùng `/licenses/[id]`. Menu **In / Tải PDF** có hai thao tác: **In giấy phép** dùng `window.print()` và CSS riêng, ẩn header/footer/nút thao tác; **Tải PDF về máy** tạo PDF A4 trực tiếp trong trình duyệt, nhúng font tiếng Việt và tải file `giay-phep-<id>.pdf`. Cả hai tải lại blockchain và điều khoản trước khi xuất, giữ thông tin giấy phép, block đối chiếu, điều khoản/chấp thuận và QR. Bản xuất là ảnh chụp thông tin ở thời điểm đối chiếu, có thể hết hiệu lực sau đó và không phải chứng nhận quyền tác giả. QR dẫn về trạng thái cập nhật, không tải file gốc lên server. URL localhost chỉ hoạt động trên máy chạy app.

## Interface ổn định

- `works(hash)` → `(registrant, registeredAt, title, description, workType)`.
- `WorkType`: Image=0, Audio=1, Document=2. `registrant == address(0)` là chưa có Work.
- `licenses(id)` → `(fileHash, licensor, licensee, grantedAt, expiresAt, revoked)`.
- `licenseCount` là mã cao nhất; mã hợp lệ bắt đầu từ 1. `latestLicenseId(hash, licensee)` trả mã mới nhất, không phải bằng chứng giấy phép còn hiệu lực.
- `isLicenseValid(id)` kiểm tra tồn tại, chưa thu hồi và `block.timestamp < expiresAt`.
- Điều kiện V1 là phần mô tả cố định của luồng cũ; bản v2 và chữ ký được lưu ngoài blockchain khi ví cấp gắn điều khoản. Bản đã lưu không bị thay thế khi sửa metadata hay cấp lại. Không có cơ chế chuyển quyền sở hữu.

Không sửa tay `deployedContracts.ts`. Khi đổi contract, chạy compile/deploy, cập nhật frontend theo ABI sinh tự động. Blockchain local mất khi tắt node; PostgreSQL tồn tại riêng và cần migration bằng `yarn db:migrate`. Không xóa DB khi reset chain; bản ghi ngoài blockchain được phân biệt bằng danh tính giao dịch/block.

## Quyền và giới hạn

Admin chỉ pause/unpause. Pause chặn đăng ký/cấp mới, vẫn cho đọc và thu hồi. Contract kiểm tra quyền dù frontend đã ẩn nút.

Logo, bản vẽ, hồ sơ sáng chế và nhạc là ví dụ nội dung file; hệ thống không tự xác minh tác giả, nhãn hiệu hay văn bằng sáng chế. Hash chỉ so sánh byte nguyên vẹn, không phát hiện nội dung tương tự. Giấy phép được ghi nhận trong ứng dụng không ngăn sao chép file bên ngoài.

## Phần kế thừa và phần nhóm phát triển

Giữ giấy phép gốc tại `LICENCE`. Nền SE-2 cung cấp kết nối ví, hook, debug, explorer và deployment; OpenZeppelin cung cấp Ownable/Pausable. Phần nhóm bổ sung: WorkRegistry theo nghiệp vụ, xử lý ba loại file, cấp/thu hồi giấy phép, tra cứu/quản lý cá nhân, giao diện tiếng Việt, seed và kiểm thử tương ứng.
