import { createLicensePdf } from "./licensePdf.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PDFDocument } from "pdf-lib";

const fonts = {
  regular: readFileSync(new URL("../public/fonts/noto-sans/NotoSans-Regular.ttf", import.meta.url)),
  bold: readFileSync(new URL("../public/fonts/noto-sans/NotoSans-Bold.ttf", import.meta.url)),
};
export const sample = {
  id: "3",
  title: "Tài liệu mẫu của nhóm · Quyền sử dụng tác phẩm",
  status: "Hết hạn",
  fileHash: "0x" + "ab".repeat(32),
  licensor: "0x" + "12".repeat(20),
  licensee: "0x" + "34".repeat(20),
  grantedAt: "21:00:41 24/11/2026",
  expiresAt: "21:01:38 24/11/2026",
  observedAt: "21:34:25 24/11/2026",
  blockNumber: "11",
  blockHash: "0x" + "cd".repeat(32),
  txHash: "0x" + "ef".repeat(32),
  chainName: "Hardhat",
  chainId: "31337",
  contract: "0x" + "56".repeat(20),
  verificationUrl:
    "http://localhost:3000/licenses/3?tx=0x" +
    "ef".repeat(32) +
    "&block=0x" +
    "cd".repeat(32) +
    "&contract=0x" +
    "56".repeat(20),
  terms: null,
};

test("PDF exports a Vietnamese title and A4 pages", async () => {
  const bytes = await createLicensePdf(sample, fonts);
  assert.match(Buffer.from(bytes.subarray(0, 8)).toString(), /^%PDF-/);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getTitle(), "Giấy phép sử dụng #3");
  assert.ok(pdf.getPageCount() >= 1 && pdf.getPageCount() <= 3);
  for (const page of pdf.getPages()) {
    assert.ok(Math.abs(page.getWidth() - 595.28) < 1);
    assert.ok(Math.abs(page.getHeight() - 841.89) < 1);
  }
});

test("Long terms paginate across multiple pages", async () => {
  const bytes = await createLicensePdf(
    {
      ...sample,
      terms: {
        version: 2,
        content: Array.from(
          { length: 100 },
          (_, i) => `${i + 1}. Điều khoản sử dụng tác phẩm, phải ghi nguồn và bảo đảm quyền của tác giả.`,
        ).join("\n"),
        termsHash: "0x" + "98".repeat(32),
        acceptedAt: "25/11/2026 00:30:00",
      },
    },
    fonts,
  );
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() > 3);
});
