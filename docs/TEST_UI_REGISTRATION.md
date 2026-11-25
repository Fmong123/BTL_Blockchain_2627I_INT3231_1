# Kiểm tra giao diện và đăng ký

Chạy `yarn.cmd db:migrate` sau cập nhật mã. Nếu server đã chạy thì mở trình duyệt, không chạy thêm `chain`/`deploy` hoặc seed trên node đang dùng. Giữ terminal blockchain mở.

## Trang cần kiểm tra

1. `/works`: tìm kiếm, bộ lọc, ba thẻ demo và làm mới như trước; thử màn hình điện thoại, tên dài.
2. `/works/register`: trước kết nối ví, chưa được chọn tệp. Sau kết nối đúng mạng, chọn tệp khác bộ demo để không bị trùng; xem trước rồi tiếp tục. Nhập tóm tắt, ngày hoàn thành, người sáng tác và chủ sở hữu (cùng người thì hai dòng), căn cứ quyền. Các mục tùy chọn có nhãn rõ.
3. Bấm **Kiểm tra hồ sơ**: đối chiếu toàn bộ, **Sửa thông tin** quay lại không mất dữ liệu. Chưa xác nhận hai ô hoặc chưa đăng nhập SIWE thì không được ký. Đồng ý → lưu nháp chuẩn bị → ký giao dịch → đối chiếu và lưu hồ sơ; chỉ hoàn tất khi receipt thành công và hồ sơ đã lưu. Mở chi tiết để thấy đủ thông tin đã khai ngay.
4. `/works/verify`: chọn tệp hoặc nhập hash, không cần ví. Kết quả gồm khung blockchain, hồ sơ tự khai, chia sẻ và giấy phép. Không suy ra chưa có hồ sơ/chưa ký khi API bị lỗi.
5. `/my/profile`: đăng nhập, chọn cá nhân / tổ chức, kiểm tra thông tin đại diện và công khai, lưu. Thử công khai tắt/bật từ ví khác.
6. Trang chi tiết, ví đăng ký: điền ví nhận, thời hạn → đăng nhập → **Kiểm tra giấy phép** → kiểm tra thông tin, xác nhận thẩm quyền → ký. Ví nhận đọc và đánh dấu đồng ý rồi ký chấp thuận. Thu hồi vẫn có bước xác nhận riêng.
7. `/my`: tác phẩm của đúng ví; tab giấy phép nhận giữ trạng thái blockchain và chấp thuận riêng.
8. `/licenses/1`, `/licenses/2`, `/licenses/3`: khung thông tin, tải lại, điều khoản và QR. **In / Tải PDF** mở hai lựa chọn: **In giấy phép** mở hộp thoại in; **Tải PDF về máy** tải trực tiếp `giay-phep-<id>.pdf`. Mở file để kiểm tra tiếng Việt, trạng thái, điều khoản và QR. Mã demo tương ứng còn hạn, đã thu hồi, hết hạn.

## Các lỗi cần thử trên môi trường kiểm thử riêng

- Thiếu tên/tóm tắt/tác giả/chủ quyền/ngày; ngày tương lai hoặc công bố trước hoàn thành; link YouTube/Spotify sai: chặn trước gửi.
- API/DB chưa sẵn sàng trước ký: không gửi giao dịch. Hủy trong ví: không báo hoàn tất.
- Giao dịch xác nhận nhưng API lưu lỗi: không gửi lại đăng ký, chỉ thử hoàn tất hồ sơ. Reload vẫn thấy mã chờ xử lý; có thể nhập lại mã giao dịch, hash và `preparationId` ở mục khôi phục.
- Hai tab chuẩn bị cùng file nhưng khác hồ sơ: mỗi nội dung có `preparationId` riêng; hoàn tất dùng nội dung của mã đã chọn và đối chiếu metadata với giao dịch. Khôi phục không có mã chỉ tự chọn khi có đúng một nháp phù hợp; nhiều nháp phải yêu cầu mã cụ thể. Sau khi một bản đã hoàn tất, tab khác/retry trả lại bản đã lưu, không ghi đè. Thử sửa hồ sơ rồi đối chiếu lại giao dịch cũ: nội dung đã sửa phải được giữ.
- Tăng tốc giao dịch: lưu và dùng mã giao dịch thay thế đã xác nhận.
- Đổi ví/mạng: không tiếp tục hồ sơ hoặc quyền phiên của ví cũ. Kết nối trước chọn tệp để tránh mất thông tin khi đăng nhập.
- Bộ lệnh tự động: `yarn.cmd test:frontend`, `yarn.cmd next:check-types`, `yarn.cmd next:lint`, `yarn.cmd next:build`. `test:copyright` có ghi dữ liệu: chỉ chạy với app, database và blockchain localhost kiểm thử riêng.

## Phạm vi pháp lý

Ghi nhận này không nộp hồ sơ hành chính, không cấp Giấy chứng nhận đăng ký quyền tác giả, không xác minh pháp nhân hay thay thế toàn bộ hợp đồng sử dụng quyền tác giả. Giao diện liên kết hướng dẫn chính thức và không yêu cầu công khai CCCD/giấy tờ riêng.

Nguồn đối chiếu ngày 24/11/2026: [Luật SHTT, Điều 6, 47–51](https://congbao.chinhphu.vn/van-ban/van-ban-hop-nhat-so-160-2026-vbhn-lq-vpqh-470657.htm); [hướng dẫn thủ tục của Cục](https://cov.gov.vn/quyen-tac-gia-quyen-lien-quan/bo-tai-lieu-huong-dan-thu-tuc-hanh-chinh-ve-dang-ky-quyen-tac-gia-quyen-lien-quan-171084.html).
