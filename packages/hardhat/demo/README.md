# File mẫu và tài khoản demo

Chạy `yarn chain`, `yarn deploy`, sau đó `yarn demo:seed` ở root. Script chỉ kết nối `http://127.0.0.1:8545` và từ chối chain ID khác 31337.

Script sinh ảnh PNG 1 pixel, WAV PCM 440 Hz dài 0,25 giây và PDF tối giản. File được tạo bằng code, không lấy tác phẩm của bên thứ ba. Chọn đúng các file này ở màn hình xác minh để đối chiếu hash trong `manifest.json`.

- Tài khoản Hardhat #0: quản trị.
- #1: đăng ký ba tác phẩm, cấp/thu hồi.
- #2: người nhận, có giấy phép ảnh còn hiệu lực, audio đã thu hồi, PDF hết hạn.
- #3: người ngoài, không được cấp/thu hồi thay #1.

Script tăng thời gian blockchain local 61 giây để giấy phép PDF hết hạn ngay. Ngày giờ hiển thị được lấy từ blockchain; không cần chỉnh đồng hồ máy. Đây chỉ là dữ liệu và tài khoản local.

Seed dừng nếu contract đã có giấy phép, tránh tự sửa dữ liệu người dùng. Muốn tạo lại bộ demo: dừng/chạy lại node, deploy lại, seed lại. File/manifest được Git bỏ qua vì địa chỉ contract và timestamp thay đổi sau mỗi lần reset.
