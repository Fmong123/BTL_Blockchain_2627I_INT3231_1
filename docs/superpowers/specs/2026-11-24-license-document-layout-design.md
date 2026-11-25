# Trang giấy phép: bố cục và thao tác tài liệu

Yêu cầu: chia thông tin thành khung gọn gàng, điều khoản dễ đọc, sửa tải lại và gom thao tác tài liệu; thống nhất chữ, khoảng cách và icon có chọn lọc.

- Một thanh chức năng chung chứa Tải lại dữ liệu và In / Lưu PDF. PDF dùng hộp thoại in của trình duyệt, chọn đích Save as PDF; không thêm một nút tải xuống trùng chức năng.
- Các khung: tác phẩm; bên cấp/bên nhận; thời hạn; điều khoản/chấp thuận; đối chiếu blockchain; QR kiểm tra lại. Desktop có hai cột ở những nhóm phù hợp, mobile một cột.
- Cấp chữ: tiêu đề tài liệu 24px, tiêu đề khung 15px, nội dung 14px, nhãn 12px; mã dài dùng monospace và tự xuống dòng.
- Tách rõ hiệu lực blockchain và chữ ký chấp thuận. Nội dung điều khoản lưu nguyên văn, trình bày thành từng mục, metadata và trạng thái ở vùng riêng. Không thay đổi nội dung đã ký.
- Mỗi lần tải lại lấy block mới, đọc bản ghi và sự kiện tại đúng block đó, xác nhận hash block, rồi tải lại điều khoản. Có trạng thái bận/thành công/lỗi. Nếu kiểm tra deployment ban đầu thất bại, tải lại trang để kiểm tra lại kết nối contract.
- In cũng đối chiếu lại dữ liệu trước khi mở hộp thoại. Bản in A4 giữ khung, điều khoản, QR và định danh giao dịch; ẩn thanh chức năng.

Chọn tiếp tục với React, DaisyUI, Heroicons và CSS in sẵn có. Một giao diện tài liệu riêng hoặc thư viện xuất PDF mới sẽ tăng sự khác biệt giữa trang hiển thị và bản in, chưa cần cho phạm vi này.

Kiểm tra: regression snapshot mới/đổi block/sai sự kiện, TypeScript/lint/build, browser desktop/mobile/dark, tải lại với block mới và API lỗi, thao tác print, PDF giữ toàn bộ nội dung.
