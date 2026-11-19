# Bản Quyền Số — demo đăng ký và xác minh tác phẩm

Ứng dụng blockchain local cho nhóm phát triển tiếp. Demo hiện có **đăng ký, danh sách tác phẩm và xác minh bằng file hoặc hash**. Hỗ trợ ảnh JPG/PNG/WebP (20 MB), bản ghi âm MP3/WAV (100 MB) và PDF (20 MB). 1 MB trong giới hạn ứng dụng = 1024 × 1024 byte.

File được tính SHA-256 trong trình duyệt. Blockchain lưu hash, tên, mô tả, loại tác phẩm, ví đăng ký và thời điểm. Xem trước và nghe thử dùng file gốc trên thiết bị. Giấy phép sử dụng và quản lý giấy phép cá nhân là phần mở rộng tiếp theo.

## Chạy local

Yêu cầu Node.js **>= 22.10.0** (khuyến nghị Node 24), Yarn **4.13.0**, Git và trình duyệt hiện đại. Trong PowerShell:

```powershell
Set-Location 'D:\Blockchain UET\blockchain'
corepack enable
yarn install --immutable
```

Giữ các terminal sau mở, đều tại thư mục dự án:

**Terminal 1 — blockchain:**

```powershell
yarn chain
```

**Terminal 2 — triển khai contract, chạy sau khi blockchain sẵn sàng:**

```powershell
yarn deploy
```

**Terminal 3 — website:**

```powershell
yarn start
```

Mở [http://localhost:3000](http://localhost:3000). Website mặc định kết nối Hardhat local, Chain ID `31337`, RPC `http://127.0.0.1:8545`.

## Demo bằng ví

1. Mở trang **Đăng ký**, kết nối ví ở đầu trang. Có thể dùng **Burner Wallet** của Scaffold-ETH cho demo nhanh hoặc MetaMask.
2. Với MetaMask, thêm mạng local theo RPC/Chain ID trên. Dùng một tài khoản Hardhat thử nghiệm được in khi chạy `yarn chain`, hoặc dùng ví thử nghiệm riêng và nhận ETH từ nút faucet ở đầu trang. Không dùng tài khoản/khóa thử nghiệm này trên mạng thật.
3. Chọn một file gốc. Ứng dụng kiểm tra loại/dung lượng, tính hash, hiển thị xem trước hoặc nghe thử và tự gợi ý tên từ tên file.
4. Nhập tên, mô tả nếu cần; nhấn **Ký và đăng ký tác phẩm**. Với MetaMask, xác nhận giao dịch trong ví. Chỉ hiển thị thành công sau khi receipt xác nhận thành công.
5. Mở **Tác phẩm** để xem bản ghi theo thứ tự mới nhất. Chọn **Tác phẩm của tôi** để lọc theo ví đang kết nối. Nút **Xem bản ghi** mở thẳng kết quả xác minh.
6. Mở **Xác minh** để tra cứu bằng file hoặc hash. Kết quả có tên, mô tả, loại tác phẩm, ví, thời điểm đăng ký và nút **Sao chép hash**. Bạn có thể xác minh khi ngắt kết nối ví.
7. Thử đăng ký lại cùng file, kể cả bằng ví khác. Contract chặn trùng. Đổi tên file giữ nguyên hash, còn sửa byte trong file có thể làm hash khác.

Mã giao dịch sau đăng ký có liên kết tới Block Explorer local. **Công cụ** dẫn tới trang Debug để quản trị viên thử `pause`/`unpause`; tra cứu vẫn hoạt động khi đang tạm dừng.

### Khởi động lại và xử lý lỗi

- Hardhat local không giữ dữ liệu khi dừng node. Sau khi khởi động lại, chạy `yarn deploy` và đăng ký lại file mẫu. ABI/địa chỉ frontend được sinh tự động khi deploy; không sửa thủ công.
- Nếu vừa thay đổi contract mà chưa deploy, frontend có thể báo lỗi đọc dữ liệu. Chạy deploy, sau đó tải lại trang.
- Nếu MetaMask báo nonce không khớp sau khi reset node, xóa dữ liệu hoạt động/nonce của **tài khoản thử nghiệm trên mạng local** trong ví rồi thử lại, hoặc tạo tài khoản thử nghiệm khác. Khởi động lại node sẽ làm mất các bản ghi local.
- Nếu không đọc được blockchain, kiểm tra terminal `yarn chain`, chạy deploy và kiểm tra cổng `8545`. Nếu cổng `3000` đang được dùng, dùng địa chỉ Next.js thông báo trong terminal.
- Nút đăng ký chỉ khả dụng sau khi file/thông tin hợp lệ, ví đúng mạng, dữ liệu contract đọc được và tác phẩm chưa tồn tại. Giới hạn định dạng/dung lượng ở đăng ký và xác minh là như nhau.
- Với audio lớn, chờ bước đọc/tính hash; không có phần trăm tiến độ giả. Trình duyệt đọc toàn bộ file vào RAM. Không phát được audio không đồng nghĩa không tính được hash; WAV phải có codec trình duyệt hỗ trợ để nghe thử.
- Việc kiểm tra đuôi file/MIME giúp chọn đúng đầu vào; không chứng nhận nội dung hay quyền tác giả. Bản ghi và thông tin là công khai trong mạng demo. Chữ ký xác thực ví gửi giao dịch, không xác minh tên thật hoặc người sáng tạo tác phẩm.

## Kiểm tra chất lượng

```powershell
yarn test
yarn hardhat:check-types
yarn next:check-types
yarn lint
yarn next:build
```

`yarn test` chạy test contract và test xử lý file/hash bằng test runner tích hợp của Node, không cần cài thêm thư viện test. Có thể chạy riêng `yarn hardhat:test` hoặc `yarn test:files`. Test không yêu cầu giữ node local đang chạy. Thư mục artifacts/cache/build là đầu ra công cụ được Git bỏ qua.

Demo đã được kiểm tra với giao dịch thật qua Burner Wallet cho ảnh PNG, WAV PCM 100 MB và PDF; xác minh bằng file/hash, tra cứu khi ngắt ví, hash sai/chưa đăng ký, chặn đăng ký trùng và audio vượt giới hạn. File WAV kiểm thử được tạo trong bộ nhớ trình duyệt, không phải phép đo tốc độ đọc từ ổ đĩa. Lỗi RPC được mô phỏng trong trình duyệt; màn hình trả thông báo kết nối và nút thử lại. Bố cục được kiểm tra ở viewport 390 px. File kiểm thử trình duyệt không được lưu trong repo.

## Điểm bàn giao cho thành viên khác

| Phần | Vị trí / giao diện ổn định |
| --- | --- |
| Contract và test | `packages/hardhat/contracts/WorkRegistry.sol`, `packages/hardhat/test/WorkRegistry.ts` |
| Đăng ký | `registerWork(bytes32 fileHash, string title, string description, WorkType workType)` |
| Đọc tác phẩm | `works(fileHash)` trả về `(registrant, registeredAt, title, description, workType)` theo đúng thứ tự này |
| Loại tác phẩm | `Image = 0`, `Audio = 1`, `Document = 2` |
| Giới hạn thông tin | Tên: 1–256 byte UTF-8; mô tả: 0–2048 byte UTF-8. UI trim trước khi gửi và kiểm tra cùng giới hạn |
| Event | `WorkRegistered(fileHash indexed, registrant indexed, registeredAt)`; dùng để dựng danh sách/lịch sử, đọc metadata từ `works` |
| File và kiểm tra đầu vào | `packages/nextjs/utils/workFiles.ts`; hash tại `utils/hashFile.ts` |
| Thành phần dùng chung | `packages/nextjs/components/works/WorkFilePicker.tsx`, `WorkRecord.tsx` |
| Màn hình | `/`, `/works`, `/works/register`, `/works/verify` |

Hash là `0x` + 64 ký tự hex; địa chỉ ví là hex. Timestamp blockchain là Unix **giây**, phía TypeScript đọc dưới dạng `bigint`; UI chuyển sang giờ Việt Nam. Bản ghi chưa có có `registrant = address(0)`. Giá trị `workType = 0` ở bản ghi trống không thể hiện tác phẩm ảnh đã tồn tại; luôn kiểm tra registrant trước.

Danh sách dùng event đăng ký và đọc chi tiết từ `works` cho các bản ghi trên trang hiện tại. Người làm giấy phép mở rộng contract và dùng hook trong `hooks/scaffold-eth` để tích hợp. Khi thêm hàm hoặc thay contract, deploy lại và dùng ABI được sinh tự động. Kế hoạch tổng thể và phân công ở [KE_HOACH_DU_AN.md](KE_HOACH_DU_AN.md).

## Mã nguồn mở và phạm vi

Kế thừa [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2) (MIT), [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) cùng các dependency trong repo. Giữ giấy phép gốc tại `LICENCE`. Phần phát triển thêm: đăng ký metadata, phân loại/kiểm tra ba loại file, xác minh hash, giao diện tiếng Việt và kiểm thử tương ứng.

Đây là demo ghi nhận dữ liệu trên blockchain local phục vụ bài tập. Hash chỉ đối chiếu byte nguyên vẹn, không phát hiện ảnh/âm thanh/tài liệu tương tự và không ngăn sao chép file. Demo không thay thế thủ tục xác lập quyền tại cơ quan có thẩm quyền.
