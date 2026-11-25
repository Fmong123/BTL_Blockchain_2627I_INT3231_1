# Chia sẻ, in giấy phép và đồng bộ hệ thống

## Mục tiêu và phạm vi

Theo yêu cầu tiếp tục từ ngyn_branch, bổ sung QR/liên kết xác minh, bản in giấy phép, kiểm thử API trong CI và rà soát tính nhất quán của hệ thống. Nền là origin/ngyn_branch 426f34a. Triển khai trực tiếp trong phiên này trên nhánh codex/ngyn-system-consistency; không push hoặc merge.

## Lựa chọn

- Dùng trang xác minh hiện có cho chia sẻ tác phẩm, một trang `/licenses/[id]` công khai cho tra cứu/in từng giấy phép. QR dùng qrcode.react đã có; không cài thư viện runtime mới.
- In bằng chức năng trình duyệt thay vì dựng PDF phía server: có thể lưu PDF, giữ cùng dữ liệu và giao diện tra cứu. Bản in có chain ID, contract, mã giấy phép, hash, các ví, thời hạn, trạng thái tại block đã đọc, điều khoản/chấp thuận nếu tải được và QR dẫn về trang cập nhật.
- Giữ WorkRegistry V1. Hiệu lực blockchain và chấp thuận ngoài blockchain hiển thị riêng. Không tự coi giấy phép chưa ký là vô hiệu, không gọi bản in là chứng nhận quyền tác giả.
- CI dùng PostgreSQL service, migration, production Next.js, Hardhat và test:copyright. Dùng script chờ dịch vụ có thời hạn và thông báo lỗi; test DB chỉ dùng local riêng cho kiểm thử.

## Điều kiện hoàn thành

- Chia sẻ/sao chép đúng URL của tác phẩm đang xem, không mang tham số thừa hay phiên ví. QR đọc được trên nền sáng ở cả dark mode.
- Trang giấy phép không cần ví, lấy dữ liệu qua Scaffold hooks, phân biệt ID sai, chưa có giấy phép và lỗi RPC; không in dữ liệu cũ/lỗi như kết quả thành công.
- Bản in xuống dòng hash/địa chỉ dài, ẩn điều hướng và thao tác, ghi rõ thời điểm/block quan sát và cách tra cứu lại. API lỗi không được hiển thị thành chưa chấp thuận/chưa có điều khoản.
- Các thẻ giấy phép đều dẫn cùng trang tra cứu/in; UI và tài liệu thống nhất nhãn, thời gian Việt Nam và giới hạn local.
- Chạy test, typecheck, lint, build; thử API với DB/RPC/app riêng nếu môi trường cho phép; kiểm tra trình duyệt desktop/mobile và in.

## Giới hạn

Localhost chỉ truy cập được trên máy đang chạy app; QR không tự công bố hệ thống hoặc file gốc ra Internet. Không thêm testnet, NFT, thanh toán, IPFS, indexer hay thay contract. Nghiệm thu extension ví thật trên máy thành viên khác vẫn là việc nhóm cần thực hiện.
