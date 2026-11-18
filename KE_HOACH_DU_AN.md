# Kế hoạch hệ thống ghi nhận và quản lý quyền sử dụng tác phẩm số trên blockchain

> Bản cập nhật theo phạm vi đã thống nhất: nhóm 2–3 người, 14 ngày, chạy local; hỗ trợ ảnh, bản ghi âm và PDF; lưu hash và thông tin, cấp phép miễn phí có thời hạn và thu hồi.

**Demo nền đã triển khai:** đăng ký tên/mô tả/loại file bằng ví và xác minh bằng file hoặc hash; hỗ trợ ảnh/PDF 20 MB và MP3/WAV 100 MB. Xem `README.md` để chạy và bàn giao interface. Các chức năng cấp phép, danh sách và quản lý cá nhân bên dưới là lộ trình bổ sung.

## 1. Mục tiêu và phạm vi

Xây dựng ứng dụng web tiếng Việt có quy trình khép kín: **đăng ký tác phẩm → xác minh file → cấp quyền sử dụng → kiểm tra giấy phép → hết hạn hoặc thu hồi**.

Phát triển tiếp repo `D:\Blockchain UET\blockchain`. Demo nền hiện có contract `WorkRegistry` lưu hash, tên, mô tả, loại tác phẩm, ví và thời điểm, chặn trùng; giao diện đăng ký/xác minh hỗ trợ cả ba loại file theo giới hạn bên dưới. Danh sách, tìm kiếm, quản lý cá nhân và nghiệp vụ giấy phép là phần cần bổ sung tiếp.

| Loại tác phẩm | Định dạng của bản nộp | Giới hạn mỗi file | Xem trước từ file trên máy |
| --- | --- | --- | --- |
| Ảnh | JPG/JPEG, PNG, WebP | 20 MB | Hiển thị ảnh |
| Bản ghi âm | MP3, WAV | 100 MB | Trình phát audio, không tự phát |
| Tài liệu | PDF | 20 MB | Tên, dung lượng và nút mở xem |

Giới hạn dung lượng dùng quy ước hiện có trong code: 1 MB = 1024 × 1024 byte. Xử lý một file tại một thời điểm. Dùng cùng quy tắc định dạng và dung lượng ở đăng ký và xác minh.

File gốc được xử lý trong trình duyệt, không tải lên máy chủ hoặc blockchain. Người dùng tự giữ và chia sẻ file gốc. Danh sách tác phẩm hiển thị thông tin và biểu tượng loại file; không có thư viện ảnh, trình nghe hay tải file gốc khi người xem chưa chọn file từ máy.

Không đưa vào phiên bản này: IPFS/lưu file, NFT/ERC-20, thanh toán, chuyển quyền sở hữu, chia tiền bản quyền, đồng tác giả, nhận diện đạo văn/nội dung tương tự, xác minh danh tính thật và đăng ký quyền tại cơ quan nhà nước.

## 2. Quy trình sử dụng và màn hình

### Đăng ký và chữ ký của ví

Người dùng kết nối ví, chọn file, nhập tên và mô tả, kiểm tra thông tin rồi xác nhận giao dịch trong MetaMask. Kết nối ví chưa phải là đăng ký; chỉ hoàn tất sau khi giao dịch được xác nhận thành công.

| Thông tin | Nguồn dữ liệu |
| --- | --- |
| Tên tác phẩm | Người dùng nhập, bắt buộc |
| Mô tả ngắn | Người dùng nhập, không bắt buộc |
| Loại tác phẩm | Giao diện xác định từ loại file được hỗ trợ |
| Hash SHA-256 | Tính từ toàn bộ byte của file trong trình duyệt |
| Ví đăng ký | Contract lấy từ `msg.sender`, không lấy từ trường người dùng nhập |
| Thời điểm đăng ký | Contract lấy từ `block.timestamp` |
| Mã giao dịch | Lấy từ giao dịch đăng ký đã xác nhận |

Ví ký giao dịch chứa hash và thông tin tác phẩm. Tận dụng chữ ký giao dịch Ethereum có sẵn, không thêm bước ký thông điệp riêng. Khóa riêng được quản lý bởi ví; ứng dụng không yêu cầu nhập hoặc lưu khóa riêng.

### Các màn hình

| Màn hình | Chức năng |
| --- | --- |
| Trang chủ / danh sách | Giới thiệu ngắn, hướng dẫn 3 bước, nút đăng ký/xác minh; danh sách tìm theo tên, ví, hash và lọc Ảnh / Bản ghi âm / PDF. Phân trang 10 bản ghi. |
| Đăng ký | Chọn file, kiểm tra định dạng/dung lượng, xem trước, nhập thông tin, tính hash, kiểm tra trùng, ký giao dịch. Thành công chuyển tới chi tiết. |
| Xác minh | Chọn file hoặc nhập hash; trả về bản ghi tương ứng hoặc chưa tìm thấy. Không cần kết nối ví. |
| Chi tiết tác phẩm | Hiển thị thông tin đăng ký, mã giao dịch, mẫu điều kiện sử dụng, các giấy phép và lịch sử. Chỉ ví đăng ký thấy thao tác cấp/thu hồi. |
| Quản lý của tôi | Hai tab: tác phẩm tôi đăng ký và giấy phép tôi nhận; trạng thái còn hiệu lực, hết hạn hoặc đã thu hồi. |

Điều hướng chính gồm Trang chủ, Đăng ký, Xác minh, Quản lý của tôi. Debug và Block Explorer đặt trong mục công cụ phát triển, không phải lối đi nghiệp vụ chính. Bố cục dùng được trên desktop và điện thoại; biểu mẫu có nhãn, hỗ trợ bàn phím, địa chỉ/hash có nút sao chép.

### Cấp và thu hồi giấy phép

- Ví đăng ký chọn tác phẩm, nhập ví người nhận, chọn ngày giờ hết hạn; mặc định sau 30 ngày. Giao diện hiển thị giờ Việt Nam, gửi Unix timestamp tới contract.
- Dùng chung một mẫu điều kiện cố định phiên bản 1: **sử dụng phi thương mại, phải ghi nguồn, không được cấp lại hoặc chuyển nhượng**. Nội dung được hiển thị ở form cấp và chi tiết giấy phép; không cho tự nhập điều khoản trong bản nộp.
- Người cấp ký giao dịch; người nhận xem được giấy phép ngay khi giao dịch thành công, không cần bước chấp nhận riêng.
- Có thể cấp cùng tác phẩm cho nhiều ví. Mỗi cặp tác phẩm–người nhận chỉ có một giấy phép còn hiệu lực.
- Ví đăng ký có thể thu hồi. Sau khi hết hạn hoặc bị thu hồi, cấp lại sẽ tạo giấy phép mới, giữ nguyên lịch sử cũ.
- Giấy phép không chuyển quyền sở hữu tác phẩm và không ngăn sao chép file ngoài ứng dụng.

## 3. Kiến trúc và thay đổi triển khai

### Tận dụng mã nguồn mở

Giữ Next.js, TypeScript, DaisyUI, RainbowKit, Wagmi/Viem, Hardhat và phiên bản dependency đã khóa trong repo. Một contract `WorkRegistry` dùng chung cho cả ba loại file, không xây ba hệ thống riêng.

- **Scaffold-ETH 2:** giữ khung ứng dụng, kết nối ví, hook đọc/ghi, triển khai local, ABI sinh tự động và công cụ debug.
- **OpenZeppelin Contracts:** giữ `Ownable` và `Pausable` hiện có.
- **DaisyUI và thành phần Scaffold:** dùng cho biểu mẫu, bảng, trạng thái và địa chỉ ví.

Phần nhóm tự phát triển gồm dữ liệu tác phẩm, quản lý/cấp/thu hồi giấy phép, tra cứu, giao diện nghiệp vụ và kiểm thử. Báo cáo ghi rõ phần kế thừa và đóng góp; giữ thông báo bản quyền và giấy phép của mã nguồn sử dụng. Không thêm backend, database hoặc dịch vụ bên ngoài.

Nguồn tham chiếu: [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2), [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts), [giao dịch Ethereum](https://ethereum.org/developers/docs/transactions/).

### Smart contract và interface

Mở rộng bản ghi tác phẩm bằng tên, mô tả và `WorkType` gồm `Image`, `Audio`, `Document`; giữ hash làm định danh, cùng ví và thời điểm đăng ký. Tên/mô tả có giới hạn độ dài thống nhất ở giao diện và contract. Bản ghi đăng ký không sửa/xóa trong phiên bản này.

| Interface | Hành vi |
| --- | --- |
| `registerWork(fileHash, title, description, workType)` | Đăng ký hash khác 0 chưa từng tồn tại; lưu thông tin và phát event |
| `works(fileHash)` | Đọc bản ghi; ví bằng địa chỉ rỗng thể hiện chưa đăng ký |
| `grantLicense(fileHash, licensee, expiresAt)` | Chỉ ví đăng ký được cấp; trả về mã giấy phép tăng dần |
| `revokeLicense(licenseId)` | Chỉ ví đăng ký tác phẩm được thu hồi giấy phép chưa bị thu hồi |
| `licenses(licenseId)` | Đọc tác phẩm, người cấp/nhận, thời điểm cấp/hết hạn và trạng thái thu hồi |
| `isLicenseValid(licenseId)` | Trả về true khi giấy phép tồn tại, chưa thu hồi và `block.timestamp < expiresAt` |

Mã giấy phép bắt đầu từ 1. Lưu từng giấy phép theo mã và mã gần nhất theo cặp hash–người nhận để kiểm tra cấp trùng mà không phải duyệt danh sách. Từ chối cấp cho địa chỉ rỗng, chính người đăng ký, tác phẩm chưa tồn tại hoặc thời hạn không nằm trong tương lai. Thu hồi lặp hoặc mã không tồn tại phải bị từ chối.

Giữ event đăng ký với hash, người đăng ký, thời điểm; thêm event cấp và thu hồi, mang mã giấy phép và dữ liệu cần thiết để lọc theo tác phẩm/người nhận. Giao diện lấy danh sách từ event rồi đọc bản ghi hiện tại từ contract. Chỉ quét từ block triển khai contract; hỗ trợ đọc dữ liệu khi chưa kết nối ví. Trạng thái hiệu lực dựa trên thời gian blockchain, không tin riêng đồng hồ máy người dùng.

Quản trị viên chỉ có quyền tạm dừng/mở lại theo chức năng hiện có; không được cấp hay thu hồi thay người đăng ký. Khi tạm dừng, chặn đăng ký và cấp mới; vẫn cho đọc và thu hồi. Dùng trang Debug cho thao tác quản trị trong demo.

Triển khai lại contract và sinh ABI bằng quy trình sẵn có; không cần di chuyển dữ liệu demo cũ. Sau mỗi lần reset node, triển khai lại và chạy script dữ liệu mẫu.

### File lớn và phản hồi giao diện

- Dùng một module cấu hình chung cho định dạng, phân loại và giới hạn file. Kiểm tra phần mở rộng cùng MIME nếu trình duyệt cung cấp; có fallback theo phần mở rộng khi MIME rỗng. Đây là kiểm tra đầu vào ứng dụng, không phải xác minh quyền tác giả hoặc chứng nhận nội dung file.
- Giữ SHA-256 bằng Web Crypto hiện tại. Cách này đọc toàn bộ file vào RAM; với 100 MB phải đo trên máy demo. Không thêm thư viện băm từng phần ở phiên bản đầu.
- Kiểm tra dung lượng trước khi đọc; chỉ xử lý một file, khóa gửi khi đang tính hash hoặc gửi giao dịch. Hiển thị thông báo chờ, không tạo phần trăm tiến độ giả.
- Dùng object URL cho xem trước, giải phóng khi đổi file/rời trang. Audio chỉ tải metadata lúc đầu, không giải mã toàn bộ để băm; PDF mở khi người dùng yêu cầu. Không chuyển file lớn thành chuỗi base64 để xem trước.
- Nếu trình duyệt không phát được bản ghi, thông báo rõ; vẫn cho đăng ký/xác minh hash nếu đọc được file và định dạng đầu vào hợp lệ.
- Dọn trạng thái file, hash và giao dịch khi chọn file khác; kết quả cũ không được ghi đè file đang chọn. Khi đổi ví/mạng, cập nhật quyền thao tác và danh sách tương ứng.
- Tách trạng thái chờ ký, chờ xác nhận, thành công và lỗi. Có thông báo khi sai mạng, thiếu ETH local, người dùng từ chối, node không chạy hoặc contract chưa triển khai. Nếu giao dịch thành công nhưng làm mới dữ liệu lỗi, giữ mã giao dịch và hướng dẫn tải lại, không báo giao dịch thất bại.

Hash SHA-256 luôn dài 32 byte; file lớn không làm dữ liệu on-chain tăng theo dung lượng file gốc. Ảnh hưởng chính là RAM, thời gian đọc/băm và xem trước tại máy người dùng. Tham chiếu: [Web Crypto digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest).

## 4. Tiến độ 14 ngày và phân công

Mục tiêu cuối ngày 8 có toàn bộ luồng nghiệp vụ với cả ba loại file. Từ ngày 9 ngừng thêm tính năng. Dự toán mỗi thành viên dành trung bình 2–3 giờ/ngày; cần báo sớm nếu không đáp ứng để điều chỉnh lịch, giữ nguyên nghiệp vụ cốt lõi.

| Thời gian | Công việc | Đầu ra |
| --- | --- | --- |
| Ngày 1–2 | Chốt giao diện/interface, dựng dữ liệu mẫu ba loại, chuẩn hóa cách chạy local | Cả nhóm chạy được repo; thống nhất mẫu giấy phép và quy tắc file |
| Ngày 3–4 | Contract và test; đồng thời dựng khung màn hình | Contract nghiệp vụ đạt test, giao diện có khung đầy đủ |
| Ngày 5–6 | Hoàn thành đăng ký, danh sách, chi tiết và xác minh với ảnh; thêm audio/PDF và xem trước | Ba loại file đăng ký/xác minh được; đo thử file audio lớn |
| Ngày 7–8 | Tích hợp cấp/thu hồi, giấy phép nhận và lịch sử | Chạy trọn quy trình với nhiều ví và cả ba loại file |
| Ngày 9–10 | Kiểm thử tích hợp, file lớn, sai mạng và lỗi; hoàn thiện khả năng sử dụng | Đạt kịch bản nghiệm thu, chốt giới hạn 100 MB trên máy demo |
| Ngày 11–12 | README, báo cáo, sơ đồ, kết quả kiểm thử, slide, video dự phòng | Bộ tài liệu nộp đầy đủ |
| Ngày 13 | Chạy từ đầu trên máy thành viên khác; tập demo | Quy trình cài/chạy tái lập được, mọi người giải thích được phần mình làm |
| Ngày 14 | Sửa lỗi cuối, đóng gói và đánh dấu Git tag | Bản nộp ổn định |

### Các phần có thể làm song song — nhóm 3 người

Chia theo lớp kỹ thuật và nghiệp vụ. Ảnh, audio và PDF dùng chung module xử lý file và cùng contract. Ba luồng sau có thể bắt đầu từ ngày 1; giao diện dùng dữ liệu mẫu trong lúc contract chưa sẵn sàng.

| Luồng / người phụ trách | Công việc độc lập | Đầu ra để ghép | Phần cần chờ |
| --- | --- | --- | --- |
| **A — Blockchain và kết nối dữ liệu** | Mở rộng contract, viết test quyền/thời hạn, deploy; sau đó làm hook đọc/ghi dùng chung, script seed | Contract đạt test, ABI được sinh, hook đọc tác phẩm/giấy phép và thao tác giao dịch, dữ liệu demo | Cần chốt interface với B/C; không cần chờ giao diện |
| **B — File và tác phẩm** | Kiểm tra ba loại file, hash, xem trước, thử audio lớn; dựng đăng ký, xác minh, danh sách và khung chi tiết | Module file dùng chung, màn hình tác phẩm chạy bằng dữ liệu mẫu rồi dữ liệu thật | Module file/xem trước không cần contract; đăng ký/xác minh thật cần ABI và hook của A |
| **C — Giấy phép và quản lý cá nhân** | Dựng form cấp phép, trạng thái, danh sách giấy phép nhận/đã cấp, lịch sử; soạn ca nghiệm thu và khung báo cáo | Thành phần giấy phép gắn vào trang chi tiết, trang quản lý cá nhân, danh sách ca kiểm thử | Giao diện làm bằng dữ liệu mẫu; cấp/thu hồi và kiểm thử nhiều ví cần contract/hook của A |

**Điểm thống nhất trong ngày 1:** tên/tham số/kiểu trả về của các hàm; cấu trúc tác phẩm/giấy phép; `Image=0`, `Audio=1`, `Document=2`; hash và địa chỉ ở dạng hex; số nguyên blockchain dùng `bigint`, thời gian Unix giây; trạng thái chưa tồn tại/hết hạn/thu hồi; event và dữ liệu giao diện cần đọc. A viết bản thống nhất ngắn, B/C kiểm tra nhu cầu màn hình. Sau đó thay đổi interface phải được thông báo trước khi ghép.

Dữ liệu mẫu cho B/C có đủ ba loại file và các trạng thái: chưa đăng ký, đăng ký thành công, đang chờ giao dịch, lỗi, giấy phép còn hiệu lực/hết hạn/đã thu hồi. B/C giữ component hiển thị tách khỏi hook blockchain để thay dữ liệu mẫu bằng dữ liệu thật tại một chỗ, không viết lại toàn bộ trang. Dữ liệu mẫu chỉ dùng trong quá trình phát triển; lỗi blockchain phải hiển thị đúng, không tự chuyển sang dữ liệu mẫu trong bản nộp.

### Lịch song song và mốc ghép

| Thời gian | A — Blockchain/dữ liệu | B — File/tác phẩm | C — Giấy phép/kiểm thử | Mốc chung |
| --- | --- | --- | --- | --- |
| Ngày 1–2 | Chốt interface; triển khai contract và test đăng ký | Module file/hash/xem trước; khung trang | Component giấy phép với dữ liệu mẫu; ca nghiệm thu | Cuối ngày 2: compile/deploy được ABI các hàm đã thống nhất; UI mock chạy được |
| Ngày 3–4 | Hoàn thiện contract, test, hook đăng ký/đọc | Ghép đăng ký, xác minh; làm danh sách/chi tiết | Form cấp/thu hồi, quản lý cá nhân với dữ liệu mẫu | Cuối ngày 4: đăng ký → xác minh bằng giao dịch thật |
| Ngày 5–6 | Hook giấy phép, lịch sử, seed | Hoàn thiện ba loại file; đo audio 20/50/100 MB | Ghép cấp/thu hồi và giấy phép nhận vào dữ liệu thật | Cuối ngày 6: hai ví cấp và xem giấy phép thật |
| Ngày 7–8 | Sửa lỗi contract/hook và dữ liệu | Sửa giao diện tác phẩm, file và lỗi ví | Kiểm thử luồng đầy đủ, quyền, hết hạn/thu hồi | Cuối ngày 8: toàn bộ nghiệp vụ hoạt động với cả ba loại file |
| Ngày 9–10 | Kiểm tra contract, deploy và reset/seed | Kiểm tra giao diện, file lớn, build | Kiểm thử tích hợp độc lập, báo lỗi và xác nhận sửa | Chốt tính năng, chỉ sửa lỗi |
| Ngày 11–12 | Viết phần blockchain, kết quả test | README giao diện/file, ảnh minh họa | Tổng hợp báo cáo, slide, kịch bản/video | Hoàn tất bộ tài liệu |
| Ngày 13–14 | Cùng chạy lại trên máy khác, tập demo, xử lý lỗi cuối và đóng gói | Cùng chạy lại trên máy khác, tập demo, xử lý lỗi cuối và đóng gói | Cùng chạy lại trên máy khác, tập demo, xử lý lỗi cuối và đóng gói | Bản nộp có Git tag |

### Chia quyền sửa file để giảm xung đột

- A phụ trách contract, deploy/test/seed, hook blockchain dùng chung và ABI sinh tự động. B/C dùng hook, báo yêu cầu bổ sung thay vì tạo lớp gọi contract riêng. ABI chỉ cập nhật bằng quy trình deploy/sinh tự động.
- B phụ trách cấu hình/xử lý file, giao diện dùng chung, Header/điều hướng, trang đăng ký/xác minh/danh sách và file trang chi tiết tác phẩm.
- C phụ trách component giấy phép và trang quản lý cá nhân. Trang chi tiết có vị trí nhúng component giấy phép được B/C thống nhất; B ghép component của C để tránh hai người cùng sửa file trang.
- Chỉ A cập nhật dependency và lockfile khi cần, sau khi thống nhất với nhóm. Mỗi người viết phần tài liệu tương ứng ở bản nháp riêng, C tổng hợp vào báo cáo chung.
- Mỗi người làm trên nhánh riêng; cuối mỗi ngày ghép phần nhỏ đã kiểm tra và báo đầu ra/nghẽn cho ngày tiếp theo. A điều phối nhánh tích hợp; B/C ghép giao diện cùng A tại các mốc ngày 2, 4, 6 và 8.

**Các phụ thuộc phải làm theo thứ tự:** chốt interface → sinh ABI → ghép hook/giao dịch thật; deploy contract → seed dữ liệu on-chain; từng màn hình ghép dữ liệu thật → kiểm thử toàn hệ thống. Đo hash/xem trước file lớn, dựng giao diện với dữ liệu mẫu, chuẩn bị file demo và soạn ca kiểm thử có thể thực hiện sớm, độc lập với chuỗi phụ thuộc này.

### Phương án nhóm 2 người

**A** làm contract, test, hook dữ liệu/giao dịch, seed và phần tích hợp cấp phép. **B** làm module file, toàn bộ màn hình và component giấy phép bằng dữ liệu mẫu, rồi kết nối hook của A. Hai người cùng kiểm thử ở các mốc ngày 4/6/8. A viết phần blockchain/kết quả test, B viết phần giao diện/README và tổng hợp tài liệu; cả hai tập demo. Giữ nguyên mốc cuối ngày 8 hoàn thành luồng và ngày 9 bắt đầu giai đoạn chỉ sửa lỗi.

Nếu chậm tiến độ, giảm trang trí và thông tin thống kê; giữ cả ba loại file, đăng ký, xác minh, cấp phép có hạn và thu hồi. Chỉ thêm Web Worker nếu phép đo cho thấy thao tác giao diện bị nghẽn khi băm; giữ cùng thuật toán/hash. Nếu thiết bị mục tiêu không xử lý ổn định 100 MB, báo kết quả đo trước khi điều chỉnh giới hạn đã thống nhất.

Chuẩn bị lệnh `yarn demo:seed` cho mạng local. Dùng các tài khoản thử nghiệm tách biệt: #0 quản trị, #1 người đăng ký, #2 người nhận, #3 người ngoài. Dữ liệu mẫu có đủ ba loại tác phẩm và giấy phép còn hiệu lực, hết hạn, đã thu hồi. README ghi rõ reset node làm mất dữ liệu và cần deploy/seed lại.

## 5. Kiểm thử, nghiệm thu và bàn giao

### Kiểm thử tự động

- Contract: đăng ký đủ ba loại, đọc đúng dữ liệu, chặn hash rỗng/trùng, tên hoặc loại không hợp lệ; event và timestamp đúng.
- Phân quyền: người nhận, người ngoài và quản trị viên không được cấp/thu hồi thay người đăng ký; kiểm tra pause/unpause và quyền thu hồi khi đang pause.
- Giấy phép: mã không tồn tại, địa chỉ/thời hạn không hợp lệ, cấp trùng còn hiệu lực, thu hồi lặp; cấp lại tạo mã mới và giữ lịch sử.
- Thời gian: trước, đúng và sau mốc hết hạn bằng công cụ thời gian Hardhat; không chờ hết hạn theo thời gian thực trong test.
- Xử lý file: kiểm tra ranh giới đúng giới hạn và vượt một byte cho từng loại, MIME rỗng, định dạng không hỗ trợ; dùng dữ liệu hash đã biết để đối chiếu. Kiểm tra cùng byte nhưng đổi tên vẫn cho cùng hash, đổi byte thì hash khác.
- Chạy test contract, kiểm tra TypeScript hai package, lint và build frontend. Chỉ bổ sung test cho hành vi nghiệp vụ/rủi ro thực tế, không kiểm thử lại chi tiết nội bộ của thư viện.

### Kiểm thử tích hợp và hiệu năng

- Khách chưa kết nối ví tìm và xác minh được tác phẩm; ví A đăng ký từng loại file, tải lại trang vẫn thấy dữ liệu.
- A cấp phép cho B; B xem giấy phép; C không có quyền thao tác thay A. Thu hồi/hết hạn làm trạng thái cập nhật theo blockchain.
- Thử hủy giao dịch, thiếu ETH local, sai mạng, tắt node, chọn lại file và đổi tài khoản; không hiển thị thành công sai hoặc gửi trùng.
- Thử xem trước ảnh, nghe MP3/WAV mẫu và mở PDF. Khi đổi file, xem trước và hash phải cùng thuộc file đang chọn.
- Đo thời gian đọc/băm, khả năng phản hồi giao diện và lỗi bộ nhớ với bản ghi âm thực tế 20/50/100 MB; thêm ca vượt giới hạn. Kiểm tra lại đăng ký/xác minh với cùng file 100 MB trên máy demo, ghi thiết bị và trình duyệt vào báo cáo.
- Demo chính dùng localhost, ví thử nghiệm và ETH local; kiểm tra thao tác từ giao diện nghiệp vụ, không dùng Debug để thay quy trình người dùng.

### Kịch bản demo 5–7 phút

Giới thiệu phạm vi; đăng ký ảnh mới và ký bằng ví A; chọn lại ảnh để xác minh; mở hai bản ghi mẫu audio/PDF; cấp giấy phép ảnh cho B; đổi sang B xem quyền nhận; trở lại A thu hồi; chỉ ra trạng thái hết hiệu lực và lịch sử. Kết thúc bằng kết quả kiểm thử file lớn và giới hạn hệ thống.

### Tiêu chí hoàn thành

- Người mới làm theo README chạy được local và hoàn tất đăng ký → xác minh → cấp phép → kiểm tra → thu hồi.
- Cả ảnh, MP3/WAV và PDF dùng chung nghiệp vụ; ranh giới 20/100 MB được xử lý nhất quán ở đăng ký/xác minh.
- Test, kiểm tra kiểu, lint và build đạt; không còn lỗi chặn luồng demo.
- Bàn giao mã nguồn, file mẫu có quyền sử dụng, script seed, README, báo cáo, sơ đồ kiến trúc/luồng, kết quả test và đo file lớn, slide, video dự phòng và Git tag bản nộp.

**Giới hạn cần ghi rõ trong báo cáo:** hash đối chiếu byte của file, không nhận diện nội dung tương tự; nén/đổi định dạng/chỉnh sửa có thể làm hash thay đổi. Chữ ký xác thực ví thực hiện giao dịch, không xác thực danh tính thật hoặc tự chứng minh người tạo tác phẩm. Mốc thời gian là ghi nhận trên blockchain local phục vụ bài tập. Giấy phép quản lý quyền được ghi nhận trong ứng dụng, không ngăn sao chép file ngoài hệ thống và không thay thế thủ tục pháp lý.
