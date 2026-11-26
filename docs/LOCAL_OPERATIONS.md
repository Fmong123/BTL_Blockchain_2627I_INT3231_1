# Vận hành Bản Quyền Số trên máy nhóm

## Kiểm tra dịch vụ

1. Mở trang Tác phẩm ở URL thực tế Next.js đang phục vụ. Ví kết nối phải chọn chain được cấu hình. Chỉ khi đọc được blockchain, danh sách mới xác nhận có hay chưa có tác phẩm.
2. Mở đường dẫn /api/copyright/health ở cùng URL. blockchain báo ready, wrong-chain, missing-contract hoặc rpc-unavailable. profiles báo ready, unconfigured hoặc unavailable. API chỉ trả trạng thái, không trả URL kết nối hay bí mật.
3. Nếu DB lỗi, kiểm tra dịch vụ PostgreSQL và chạy yarn.cmd db:migrate từ thư mục gốc sau khi sao lưu. Nếu RPC lỗi, kiểm tra đúng cổng và node. Nếu thiếu contract, chỉ deploy khi đã xác nhận đó là node mới dành riêng.
4. Khi xem log, đối chiếu thời điểm lỗi giữa Next.js, PostgreSQL và RPC. Không chia sẻ nội dung .env.local, mật khẩu hay khóa ví. Kiểm tra dung lượng trống của ổ đĩa chứa PostgreSQL và ổ đĩa chứa bản backup bằng Get-Volume trên Windows.

## Sao lưu và phục hồi PostgreSQL

Dùng pg_dump và pg_restore tương thích với phiên bản PostgreSQL đang chạy. Đổi tên DB, user và cổng theo cấu hình máy nhóm. Đặt bản sao ở ngoài repo.

~~~~powershell
pg_dump -h 127.0.0.1 -p 5432 -U postgres -W -Fc -f D:\backup\banquyenso.dump banquyenso
createdb -h 127.0.0.1 -p 5432 -U postgres -W -E UTF8 banquyenso_restore
pg_restore -h 127.0.0.1 -p 5432 -U postgres -W --exit-on-error -d banquyenso_restore D:\backup\banquyenso.dump
~~~~

Mở bản phục hồi bằng cấu hình PostgreSQL riêng. Kiểm tra cùng chain ID, địa chỉ contract và block đăng ký trước khi đối chiếu hồ sơ và giấy phép. Trên Hardhat chạy theo phiên, bản dump PostgreSQL không lưu dữ liệu blockchain. Kiểm tra bản sao bằng cách khôi phục thử trước khi thay đổi DB đang dùng.

Migration 0003 thêm bảng lịch sử và trigger ghi phiên bản trong cùng giao dịch cập nhật hồ sơ. Bản ghi cũ bắt đầu lịch sử ở lần sửa đầu tiên và giữ bản trước đó với thời điểm chưa xác định. Lịch sử chỉ hiện với ví đăng ký đã đăng nhập. Khi cần quay về bản trước migration, kiểm tra trên DB riêng và phục hồi bản sao đã tạo trước lúc nâng cấp.

## Phục hồi thao tác trên web

- Bản nháp đang nhập lưu theo tab, ví, mạng và contract. Khi tải lại trang, chọn lại tệp có đúng SHA-256 rồi tiếp tục. Đối chiếu lại hồ sơ và hai ô xác nhận trước khi ký.
- Khi thẻ giấy phép báo đã cấp và chờ lưu điều khoản, mở thẻ bằng ví cấp rồi chọn Lưu điều khoản của lần cấp này. Nút chỉ lưu lại dữ liệu theo giao dịch đã có.
- PDF có thể dùng để tra cứu. Ví cấp và ví nhận có thể đăng nhập để tải JSON chứa danh tính lần cấp, nội dung, hash, thông điệp đã ký và chữ ký nếu đã được chấp thuận. Có thể tính lại Keccak-256 của nội dung UTF-8 và xác minh chữ ký trên thông điệp nguyên văn với ví nhận.
