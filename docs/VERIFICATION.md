# Kết quả kiểm chứng

## Chuẩn bị Sepolia và hosting dùng chung — 24/11/2026

- 28/28 test frontend đạt, gồm chọn mạng/không fallback, deployment không đầy đủ, khai báo chỉ có Sepolia, và chia khoảng log không thiếu/trùng block. Các test mới đã chạy từ thất bại sang đạt.
- TypeScript Next.js và Hardhat đạt. Lint Next.js đạt. Production build cả Hardhat và Sepolia đạt bằng Next.js 16.2.12/Turbopack; build riêng tại `.next-local-check`, không ghi đè `.next` đang phục vụ người dùng.
- Smoke HTTP của bản Sepolia: thông báo thiếu deployment, tín hiệu streaming redirect sang Sepolia Etherscan, API trả 503 khi thiếu contract, SIWE challenge có chain ID 11155111. RPC công khai được kiểm tra chỉ đọc và trả `0xaa36a7`.
- API cấu hình Sepolia từ chối RPC Hardhat sai chain bằng 503 trước khi đọc contract. Preflight từ chối deployment thiếu; exporter từ chối khi chưa có receipt Sepolia. Integration runner từ chối chế độ Sepolia trước khi ghi dữ liệu.
- Regression API local đạt 5 nhóm SIWE/phiên, hồ sơ/quyền riêng tư, metadata/phân quyền, điều khoản/chữ ký/thu hồi/cấp lại, đăng xuất. Thêm kiểm tra cookie còn hạn nhưng thuộc chain khác bị từ chối và session trả null. Dùng RPC riêng 18545, app 3002 và database `bqs_network_check_20261124`; không chạy vào database đang dùng.
- Review độc lập phát hiện phụ thuộc cố định ABI vào 31337 trên clone chỉ deploy Sepolia; đã sửa và review lại, không còn finding Important/Critical trong phần chuẩn bị testnet.

Một lượt build đang kiểm tra TypeScript bị gián đoạn cùng phiên tiến trình local; đã chạy lại TypeScript và hai build hoàn chỉnh. Không reset/seed node người dùng để kiểm thử. Chưa deploy thật lên Sepolia, chưa tạo tài nguyên Vercel/Neon, chưa có cloud connection string hoặc ví deploy được nạp ETH. Preflight cloud thành công và nghiệm thu hai máy trên domain thật còn chờ các tài nguyên đó; không coi smoke test localhost là nghiệm thu public testnet. Hướng dẫn từng bước tại `TESTNET_DEPLOYMENT.md`.

## Bố cục giấy phép và thao tác tài liệu — 24/11/2026

- Các khung thông tin và thanh chức năng chung được kiểm tra ở desktop, 768px, 390px, 320px và dark mode; không tràn ngang.
- Điều khoản V1 chia thành ba mục tham chiếu. Fixture V2 đã chấp thuận hiển thị đúng nguyên văn bốn đoạn, thời điểm ký và hash, không hiện nút ký trên trang công khai. Fixture chỉ chặn phản hồi trong trình duyệt kiểm thử, không ghi vào database.
- Tải lại lấy block mới và điều khoản mới; đã mine một block rồi bấm và xác nhận số block hiển thị tăng. Lỗi API 503 có thông báo, thử lại khôi phục được. In không mở hộp thoại khi không cập nhật được điều khoản; khi khôi phục, gọi `window.print()` đúng một lần.
- Khi kiểm tra deployment ban đầu thất bại do RPC, nút Tải lại dữ liệu tải lại trang để thử tìm contract lại. Đã kiểm tra từ trạng thái lỗi sang đọc được giấy phép sau khi phục hồi RPC.
- QR giải mã giữ đúng giao dịch/block/contract. Bản in A4 ẩn thanh chức năng, giữ nội dung điều khoản; cỡ chữ địa chỉ ví theo cỡ chữ trường thông tin, ẩn avatar/copy trong bản in.
- `yarn test:frontend`: 24/24 đạt, gồm đọc snapshot mới mỗi lần tải lại, sai sự kiện/block thay thế và giấy phép không tồn tại. `yarn next:check-types` và `yarn next:build` đạt.

Công cụ kiểm thử Chrome/PDF vẫn là artifact tạm bên ngoài repo. Hộp thoại in của hệ điều hành được thay bằng spy trong Chrome headless; PDF được xuất bằng Chromium để kiểm tra bố cục. Không kiểm thử máy in vật lý.

## Chia sẻ và đồng bộ hệ thống — 23/11/2026

Nền kiểm tra: `origin/ngyn_branch` commit `426f34a`, thay đổi trên `codex/ngyn-system-consistency`. Windows, Node.js 24.21.0, Yarn 4.13.0, PostgreSQL 16.16 UTF-8 riêng tại cổng 55432, Hardhat 31337 riêng và Chrome 158 headless. Database kiểm thử nằm trong thư mục tạm; không thay database hay cấu hình bí mật của người dùng. Các kết quả bên dưới thay thế các ghi chú còn thiếu tương ứng ở các lần kiểm chứng lịch sử bên dưới.

| Kiểm tra | Kết quả |
| --- | --- |
| `yarn install --immutable` | Đạt, không thay lockfile; còn cảnh báo peer dependency của nền |
| `yarn test` | 24 test contract + 21 test frontend đạt |
| `yarn hardhat:check-types`, `yarn next:check-types` | Đạt |
| `yarn lint`, `yarn next:build` | Đạt; build gồm route động `/licenses/[id]` |
| Deploy và seed | Deploy local qua CLI Hardhat, sinh ABI; seed đủ ảnh/WAV/PDF và ba trạng thái giấy phép |
| PostgreSQL | Migration chạy hai lần liên tiếp, seed hồ sơ đạt; database xác nhận UTF-8 |
| `yarn test:copyright` trên production local | Đạt 5 nhóm: SIWE/nonce/phiên/đổi ví, hồ sơ/quyền riêng tư, metadata/quyền sửa/URL, điều khoản/chữ ký/thu hồi/cấp lại, đăng xuất/phiên độc lập |
| Workflow | YAML đọc được; có PostgreSQL service, migrate, production app và test API; chờ RPC/API có timeout, kiểm tra thành công và timeout thất bại |

Kiểm tra trình duyệt trên bản production local:

1. Trang giấy phép đọc đúng tác phẩm, các ví, thời hạn và block đối chiếu, không cần đăng nhập SIWE. Burner Wallet của nền có thể tự kết nối; không dùng chữ ký hay quyền của ví để đọc trang.
2. Giải mã QR giấy phép từ ảnh PNG bằng jsQR: URL chứa đúng ID, giao dịch, block cấp và contract. QR tác phẩm giải mã đúng hash; clipboard chứa đúng URL xác minh, không có dữ liệu phiên/ví.
3. Trạng thái còn hiệu lực/thu hồi/hết hạn khớp ba giấy phép seed.
4. Liên kết sai block bị từ chối; không còn bản ghi để in. ID 0, chữ, có số 0 đầu và vượt uint256 trả 404; ID dương chưa tồn tại hiển thị chưa có giấy phép và khóa in.
5. API điều khoản trả 503 hiển thị không xác định được nội dung/chấp thuận; không biến thành chưa ký hay không có điều khoản. RPC lỗi ẩn bản ghi và khóa nút in.
6. Desktop 1440px, mobile 390/320px và dark mode không tràn ngang. Đã xem ảnh desktop/mobile/dark; QR dùng nền sáng ở cả hai theme.
7. Chế độ in ẩn header/footer/thao tác, giữ dữ liệu, điều khoản và QR. Xuất PDF A4, render bằng Poppler và xem lại bố cục; mẫu V1 vừa một trang, không có trang trắng/nền thừa và khối QR/cảnh báo không bị tách giữa trang.
8. Điều khoản V2 đã chấp thuận vẫn hiện sau khi giấy phép bị thu hồi; trang công khai chỉ đọc, không hiện nút ký. PDF V2 dài hai trang, giữ QR/cảnh báo cùng khối.
9. Không ghi nhận lỗi JavaScript chưa xử lý ở các lượt hoàn tất.

Review độc lập phát hiện khả năng trộn dữ liệu khi chain thay đổi giữa các lần đọc. Đã bổ sung đối chiếu lại hash block sau khi đọc, so sánh toàn bộ trường bất biến của sự kiện cấp với giấy phép và dùng block được chụp trong kết quả để hiển thị thời gian/hiệu lực. Test hồi quy từ thất bại sang đạt, có cả sự kiện thiếu trường và block bị thay thế.

Giới hạn: `/licenses/<id>` không có query là tra cứu mã trên mạng hiện tại. Dùng QR hoặc liên kết đầy đủ trong bản tra cứu để giữ danh tính qua reset chain. Chưa chạy workflow thực trên GitHub, chưa nghiệm thu trên máy thành viên khác/extension ví thật, chưa testnet. Phép đo WAV thực tế của đợt 20/11 nằm tại `HANDOFF_NGYN.md`; không đo lại trong đợt này. Những thử nghiệm trình duyệt/PDF ở đây là công cụ kiểm chứng tạm, chưa được thêm thành bộ Playwright trong CI.

## Kiểm chứng ban đầu — 19/11/2026

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
# Bổ sung 25/11/2026 · Giao diện và quy trình đăng ký

- Form kết nối ví trước chọn tệp, khai tác giả/chủ sở hữu/ngày/căn cứ quyền trước ghi blockchain, xem lại và xác nhận. Server lưu nháp trước giao dịch, đối chiếu receipt/metadata rồi hoàn tất hồ sơ; retry không gửi giao dịch lần hai. Hash broadcast và hash thay thế được lưu để phục hồi sau timeout/reload.
- Đã chạy 34/34 unit tests; lint các file thay đổi không lỗi/cảnh báo; production build cuối đạt (compile54s, TypeScript16.4s). API6 nhóm đạt trên node18545 và DB bqs_ui_registration_20261124, gồm prepare trước tx, sai ví/hash/metadata, retry idempotent, SIWE/hồ sơ/điều khoản.
- Browser: PDF mẫu → khai → xem lại; nút ký bị khóa khi thiếu đồng ý/đăng nhập. Đã xem trang chi tiết có hồ sơ đầy đủ, hồ sơ tổ chức và phạm vi công khai; kiểm tra sáng/tối, 375px không tràn ở8 trang nghiệp vụ/công cụ. Không ký đăng ký/cấp phép mới vào node8545 trong kiểm thử này. Chưa thực hiện giao dịch đầy đủ bằng extension ví thật trên máy khác.
- Đã thêm migration0001, áp dụng trên DB test và DB local. Bản cuối đang phục vụ3000; read-only kiểm tra node người dùng vẫn có3 tác phẩm/3 giấy phép demo. Không reset/seed, không dừng node8545; đã dừng node18545 và frontend test3003. Các khối print cũ giữ nguyên, không chạy lại xuất PDF trong đợt này.
- Hướng dẫn kiểm tra tại `TEST_UI_REGISTRATION.md`. Đây là hồ sơ tự khai và bản ghi kỹ thuật, không phải chứng nhận hoặc nộp hồ sơ nhà nước. Căn cứ pháp lý liên kết trong giao diện được đối chiếu nguồn chính thức ngày24/11.

# Bổ sung 25/11/2026 · Tải PDF trực tiếp

- Nút **In / Tải PDF** có hai lựa chọn trong cùng menu: **In giấy phép** dùng hộp thoại in và **Tải PDF về máy** tạo file PDF A4 trực tiếp trong trình duyệt. Hai thao tác đều tải lại blockchain/điều khoản và kiểm tra danh tính lần cấp trước khi xuất.
- Font Noto Sans được lưu kèm giấy phép OFL trong repo; PDF có tiếng Việt, điều khoản/chấp thuận, hash đối chiếu, QR và liên kết gắn giao dịch/block/contract. Không tải nội dung tài liệu lên dịch vụ ngoài.
- 36/36 unit tests đạt; lint phần thay đổi và production build/TypeScript đạt. IAB bấm tải thật đã tạo `Downloads/giay-phep-3.pdf`; pypdf đọc đúng tên tác phẩm, trạng thái hết hạn, liên kết QR. Poppler render hai trang đã kiểm tra trực quan tiếng Việt và bố cục. Fixture điều khoản dài giữ đủ 100 mục, chấp thuận và QR trên năm trang. Không thử máy in vật lý trong đợt này.
- Chỉ thay frontend cổng3000; giữ nguyên blockchain8545 và PostgreSQL. Không deploy, reset, seed hoặc gửi giao dịch mới.
- Kiểm tra cuối sau khi phiên công cụ thay đổi: cả cổng8545/55432 không còn lắng nghe. Đã mở lại riêng frontend; chưa khởi tạo chain mới. File tải thử trước đó vẫn có trong Downloads. Trạng thái dịch vụ này không làm thay đổi kết quả kiểm chứng tải PDF đã thực hiện khi các dịch vụ còn chạy.

## Bổ sung 25/11/2026 · Sửa lỗi sau rà soát và dọn mã

- Sửa lỗi hồ sơ đã lưu không chỉnh sửa lại được: GET/PUT và giá trị khởi tạo editor chỉ dùng các trường hồ sơ được phép sửa. API vẫn từ chối trường nội bộ hoặc ví không có quyền. Ba regression test chạy route thực với DB/chain/session giả lập đã tái hiện lỗi trước sửa và đạt sau sửa.
- Nháp đăng ký có `preparationId` theo nội dung chuẩn hóa, được nhớ cùng hash giao dịch và truyền khi hoàn tất/khôi phục. Các tab không ghi đè nháp của nhau; khôi phục thiếu mã bị chặn khi có nhiều nháp. Hoàn tất đồng thời giữ bản đã lưu đầu tiên; retry không ghi đè nội dung đã chỉnh sửa. Có đường khôi phục nháp cũ không có mã khi chỉ có một bản phù hợp.
- Migration `0002_registration_preparations.sql` giữ nội dung/ngày tạo của nháp cũ và gắn mã `legacy`. Đã đối chiếu nguyên vẹn sáu nháp trên DB thử trước/sau migration. Đã migrate hai lần trên DB nâng cấp và hai lần từ DB trống qua đủ 0000/0001/0002; `drizzle-kit check` đạt.
- `yarn test`: 24/24 contract và 39/39 frontend đạt. `yarn lint`, TypeScript hai package và production build `.next-review-fixes` đạt. Bảy nhóm API trên app production cổng3006, chain18546 và PostgreSQL55434 đạt; gồm nháp cũ, chuẩn bị đồng thời, sai mã/metadata, chặn mơ hồ, hoàn tất đồng thời và retry sau chỉnh sửa. Review độc lập không ghi nhận lỗi cần sửa trong phạm vi này.
- Xóa hai module không còn tham chiếu: `BuidlGuidlLogo.tsx` và `fetchPriceFromUniswap.ts`. Đồng bộ README, kiến trúc, bàn giao và hướng dẫn test với đăng ký đầy đủ trước giao dịch, tải PDF trực tiếp và ưu tiên local. Giữ font/OFL, migration/snapshot, file cấu hình và module đang dùng. Các file mới vẫn cần được đưa vào commit bàn giao cùng mã nguồn.
- Chỉ dùng dữ liệu và dịch vụ kiểm thử riêng; không reset, seed hoặc gửi giao dịch vào chain người dùng. Chưa chạy migration0002 trên DB người dùng trong đợt này; cần mở PostgreSQL rồi chạy `yarn.cmd db:migrate` trước khi chạy bản mới. Kiểm thử trình duyệt/extension ví thật và PDF không được chạy lại trong đợt sửa này; các kết quả trước đó được giữ theo đúng phạm vi lịch sử ở trên. Kho file gốc local và blockchain local lưu bền vẫn là đề xuất riêng.
