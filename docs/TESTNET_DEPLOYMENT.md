# Chạy chung cho nhóm: Sepolia + Vercel + PostgreSQL cloud

Trạng thái: mã đã có chế độ Sepolia; chỉ có website dùng chung sau khi contract được deploy và tài khoản Vercel/database được kết nối. Không dùng tài khoản Hardhat công khai làm ví deploy. Tài liệu cũ trên node local đã mất không tự xuất hiện trên Sepolia; cần đăng ký lại bằng ví của người đăng ký.

## 1. Tạo ví deploy riêng

Tại root dự án:

```powershell
yarn generate
```

Nhập và xác nhận mật khẩu tại terminal. Lệnh hiện có lưu khóa đã mã hóa trong `packages/hardhat/.env` (Git bỏ qua); ghi lại địa chỉ ví công khai. Giữ mật khẩu để chạy lệnh deploy. Không gửi private key hoặc mật khẩu vào chat và không đưa vào Vercel.

Nhận ETH Sepolia vào địa chỉ này qua faucet, chẳng hạn [MetaMask faucet](https://support.metamask.com/develop/blockchain-networks/testnets/using-the-testnet-faucet/). ETH testnet dùng để trả gas thử nghiệm. Nhóm dùng MetaMask trên mạng Sepolia, chain ID **11155111**; mỗi ví đăng ký/cấp/thu hồi cũng cần ETH Sepolia.

## 2. Deploy WorkRegistry một lần

Thêm `SEPOLIA_RPC_URL=https://…` vào `packages/hardhat/.env` bằng trình soạn thảo. URL phải trả chain ID 11155111. Có thể dùng RPC Sepolia của nhà cung cấp nhóm lựa chọn; không trỏ tới localhost.

```powershell
yarn deploy --network sepolia
yarn testnet:export
```

Lệnh deploy yêu cầu mật khẩu ví đã mã hóa tại terminal. Lệnh export chỉ in bốn giá trị công khai từ deployment đã xác nhận: mạng, địa chỉ contract, block deploy và hash giao dịch deploy. Lưu lại deployment trong `packages/hardhat/deployments/sepolia/` và ABI tự sinh. Không deploy contract mới mỗi lần chạy website; địa chỉ contract là danh tính của bộ dữ liệu chung.

## 3. Tạo PostgreSQL cloud riêng

Tạo một dự án PostgreSQL trên [Neon](https://neon.com/), chọn khu vực phù hợp nơi đặt server Vercel. Trong **Connect**, lấy hai chuỗi kết nối TLS của cùng database:

- Pooled URL (hostname có `-pooler`) dùng làm `DATABASE_URL` cho website.
- Direct URL dùng chạy migration. Giữ `sslmode=require` hoặc chế độ xác minh TLS tương ứng nhà cung cấp.

Không seed hồ sơ mẫu hoặc chạy integration test vào database của nhóm. Theo [hướng dẫn kết nối Neon](https://neon.com/docs/get-started-with-neon/connect-neon), nên dùng pooled connection cho ứng dụng nhiều kết nối và direct connection cho migration.

Tạo file riêng `packages/nextjs/.env.sepolia.local` bằng mẫu `.env.sepolia.example`. File này được Git bỏ qua và không được Next.js tự động tải; không ghi đè `.env.local` đang phục vụ local. Điền đầy đủ biến testnet và tạm dùng **direct URL** cho `DATABASE_URL` để chạy migration từ root:

```powershell
node --env-file=packages/nextjs/.env.sepolia.local .yarn/releases/yarn-4.13.0.cjs db:migrate
```

Sau migration, đổi `DATABASE_URL` trong file riêng sang pooled URL. Khi sao lưu, giữ cả dữ liệu PostgreSQL, deployment contract, cấu hình domain và quyền quản lý ví deploy.

## 4. Tạo website Vercel

Đăng nhập [Vercel](https://vercel.com/) bằng tài khoản nhóm. Có thể import repo Git sau khi đã push nhánh chứa thay đổi, hoặc dùng CLI để tải mã local lên. Không deploy một nhánh Git chưa chứa các file chuyển đổi testnet.

Trong dự án Vercel, cấu hình:

| Mục | Giá trị |
| --- | --- |
| Framework | Next.js |
| Root Directory | `packages/nextjs` |
| Include source files outside Root Directory | Bật để nhận cấu hình Yarn workspace ở root |
| Node.js | 24.x |
| Install Command | `corepack yarn install --immutable` |
| Build Command | `yarn build` |
| Output Directory | Mặc định Next.js, `.next` |

Không dùng static export/IPFS: các API và cookie đăng nhập cần server Next.js. Không bật `NEXT_PUBLIC_IGNORE_BUILD_ERROR`. Xem [hướng dẫn monorepo Vercel](https://vercel.com/docs/monorepos).

## 5. Nhập biến môi trường

Nhập ở **Settings → Environment Variables** của Vercel. Các giá trị `NEXT_PUBLIC_…` phải có khi build và cần redeploy nếu thay đổi.

| Biến | Giá trị |
| --- | --- |
| `NEXT_PUBLIC_COPYRIGHT_NETWORK` | `sepolia` |
| `NEXT_PUBLIC_WORK_REGISTRY_ADDRESS` | Địa chỉ từ `yarn testnet:export` |
| `NEXT_PUBLIC_WORK_REGISTRY_DEPLOYMENT_BLOCK` | Block deploy từ export, dạng số thập phân |
| `NEXT_PUBLIC_COPYRIGHT_RPC_URL` | HTTPS RPC Sepolia dùng được từ trình duyệt |
| `COPYRIGHT_RPC_URL` | HTTPS RPC Sepolia cho API, cùng chain/contract với frontend |
| `DATABASE_URL` | Pooled PostgreSQL cloud URL có TLS |
| `IRON_SESSION_SECRET` | Chuỗi ngẫu nhiên tối thiểu 32 ký tự, chỉ ở server |
| `SIWE_ORIGIN` | Domain HTTPS chính xác, ví dụ `https://ten-du-an.vercel.app`; không có path/query |
| `WORK_REGISTRY_DEPLOYMENT_TX` | Hash deploy từ export, phục vụ preflight |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Project ID riêng của nhóm nếu dùng WalletConnect/mobile |

Sinh session secret trong terminal bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`, dán trực tiếp vào nơi cấu hình rồi giữ kín. Không có private key deploy trong các biến website.

Chọn domain production ổn định. Nếu Vercel chỉ cấp domain sau lần deploy đầu, cập nhật `SIWE_ORIGIN` đúng domain đó và **Redeploy**. Các URL preview ngẫu nhiên không tự có quyền đăng nhập của domain production; cấu hình origin riêng cho môi trường preview nếu cần.

## 6. Kiểm tra cấu hình trước nghiệm thu

Điền cùng các biến production vào `.env.sepolia.local`, gồm origin thật. Chạy từ root:

```powershell
node --env-file=packages/nextjs/.env.sepolia.local .yarn/releases/yarn-4.13.0.cjs testnet:check
```

Preflight chỉ đọc: kiểm tra chain ID của cả hai RPC, code contract, receipt deploy khớp address/block, database đủ bảng, HTTPS origin và session secret. Không in connection string hay mật khẩu. Chỉ kết luận cấu hình đạt khi lệnh trả exit code 0. Kiểm tra này không thay thế việc thử đăng nhập bằng ví trên domain thật.

## 7. Nghiệm thu trên hai máy

1. Máy A mở domain Vercel, kết nối ví A trên Sepolia, đăng nhập và đăng ký một PDF mới.
2. Máy B mở cùng URL, tra cứu được cùng hash/tác phẩm mà không chạy `yarn chain` hoặc PostgreSQL local.
3. Ví A lưu hồ sơ tác phẩm, cấp giấy phép cho ví B; ví B đăng nhập và ký chấp thuận.
4. Mở trang giấy phép, kiểm tra Etherscan, QR và In / Lưu PDF.
5. Tắt frontend/node local và khởi động lại máy A. Máy B vẫn xem được bản ghi; hồ sơ và điều khoản vẫn đọc từ cloud PostgreSQL.
6. Ví A thu hồi, máy B tải lại thấy đã thu hồi; chấp thuận cũ vẫn được giữ.

Tắt máy cá nhân không xóa blockchain testnet hoặc database cloud. Tuy vậy testnet phục vụ kiểm thử, có thể bị ngừng/di chuyển trong tương lai; giữ backup và không coi đây là nơi lưu chứng cứ pháp lý vĩnh viễn.

## Môi trường kiểm thử riêng

`yarn test` dùng EVM test riêng. `yarn test:copyright` chỉ chấp nhận mạng Hardhat và app/database/RPC localhost, từ chối cấu hình Sepolia/cloud. CI chạy PostgreSQL và blockchain riêng. Không reset hoặc seed dữ liệu nhóm để thử một thay đổi giao diện.
