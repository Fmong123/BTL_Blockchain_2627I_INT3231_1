# License Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Hoàn thiện nghiệp vụ giấy phép và đồng bộ cấu trúc trên code Scaffold-ETH 2 hiện tại.

**Architecture:** Mở rộng WorkRegistry, không thêm server/database. Các hook nghiệp vụ dùng Scaffold hooks; giữ route xác minh làm chi tiết và thêm /my. Sinh ABI bằng deploy.

**Tech Stack:** Solidity/OpenZeppelin 5, Hardhat 3, Next.js 16, React 19, Wagmi/Viem, DaisyUI 5; giữ yarn.lock.

**Spec:** docs/superpowers/specs/2026-11-19-license-management-design.md

## Global Constraints

- Giữ nguyên Work và registerWork, tuple works hiện tại.
- License tuple: fileHash, licensor, licensee, grantedAt, expiresAt, revoked; mã bắt đầu 1.
- Ảnh/PDF 20 MiB, audio 100 MiB; không thêm video, backend, IPFS, token, thanh toán.
- Dùng Scaffold hooks, Address/AddressInput và DaisyUI; ABI tự sinh.
- Chỉ registrant cấp/thu hồi; pause vẫn cho đọc/thu hồi; hiệu lực block.timestamp < expiresAt.
- Dữ liệu blockchain thật; không fallback sang dữ liệu mẫu khi đọc lỗi.

## Review Focus

- Đổi ví/tác phẩm khi transaction đang chờ: không gắn kết quả vào danh tính mới.
- Hết hạn chính xác tại timestamp và hiển thị giờ Việt Nam không phụ thuộc timezone máy.
- Tìm/lọc toàn tập trước phân trang, không chỉ 10 mục hiện tại.
- RPC lỗi và contract chưa deploy: báo lỗi có đường thử lại, không hiện danh sách rỗng thành công.
- Cấp lại/thu hồi lúc pause và admin cố thao tác thay registrant: contract quyết định quyền.

### Task 1: Contract giấy phép

**Files:** contracts/WorkRegistry.sol và test/WorkLicenses.ts trong packages/hardhat.
**Interfaces:** getter licenses, licenseCount, latestLicenseId; grantLicense/revokeLicense/isLicenseValid và event theo spec.

- [x] Viết và chạy test thất bại cho cấp/đọc/event, phân quyền, đầu vào, trùng, cấp lại, ranh giới hết hạn và pause.
- [x] Đọc Ownable/Pausable đã cài; triển khai mapping + custom errors, không vòng lặp unbounded.
- [x] Chạy hardhat test và check-types.

### Task 2: Dữ liệu và giao diện

**Files:** hooks/works, hooks/licenses, components/works, components/licenses, utils/licenses.ts và test, app/works, app/my, Header/Footer/layout/styles.
**Interfaces:** tiêu thụ ABI Task 1 và tuple spec, tái sử dụng WorkFilePicker/WorkRecord, Scaffold hooks.

- [x] Viết test trước cho quy đổi thời gian Việt Nam, hiệu lực, tìm/lọc/phân trang.
- [x] Bổ sung hook đọc danh sách/tác phẩm/giấy phép và thao tác cấp/thu hồi; lỗi/loading/refresh, receipt thành công.
- [x] Hoàn thiện /works, /works/verify?hash= và /my, form cấp/thu hồi, lịch sử và điều khoản cố định.
- [x] Tách logic để page mỏng; giữ đăng ký/xác minh và style DaisyUI theo layout hiện tại.
- [x] Chạy test frontend, typecheck, lint và build sau khi sinh ABI.

### Task 3: Seed, cấu trúc và tài liệu

**Files:** hardhat/scripts/seed_demo.ts, mẫu trong hardhat/demo; package.json hai cấp; .github/workflows/lint.yaml; README.md; KE_HOACH_DU_AN.md; docs/ARCHITECTURE.md.

- [x] Dọn YourContract contract/deploy/test sau kiểm tra phụ thuộc; giữ Scaffold tooling.
- [x] Tạo seed guard chain 31337, đọc deployment, tạo file mẫu và trạng thái giấy phép, tái chạy an toàn hoặc báo cách reset rõ ràng.
- [x] Cập nhật script test/seed và CI chờ RPC rồi deploy, test, typecheck/lint/build.
- [x] Đồng bộ README/kế hoạch/kiến trúc với trạng thái triển khai và lệnh thực tế.

### Task 4: Kiểm chứng và rà soát toàn hệ thống

- [x] Chạy test + typecheck hai package + lint + build, đọc kết quả.
- [x] Chạy local chain/deploy/seed, thử browser đăng ký/xác minh/cấp/thu hồi/đổi ví/mobile.
- [x] Review độc lập thay đổi theo spec và AGENTS, sửa lỗi có chứng cứ, kiểm tra lại phần liên quan.
- [x] Ghi kết quả, giới hạn còn lại và đề xuất cải tiến theo ưu tiên; không tự triển khai ngoài phạm vi.
