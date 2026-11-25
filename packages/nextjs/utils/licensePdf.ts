import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFString, rgb } from "pdf-lib";
import type { PDFFont } from "pdf-lib";
import QRCode from "qrcode";

export type LicensePdfData = {
  id: string;
  title: string;
  status: string;
  fileHash: string;
  licensor: string;
  licensee: string;
  grantedAt: string;
  expiresAt: string;
  observedAt: string;
  blockNumber: string;
  blockHash: string;
  txHash: string;
  grantBlockHash?: string;
  chainName: string;
  chainId: string;
  contract: string;
  verificationUrl: string;
  referenceTerms?: string;
  terms: { version: number; content: string; termsHash: string; acceptedAt: string | null } | null;
};

export function wrapPdfText(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.normalize("NFC").replace(/\r\n?/g, "\n").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      // Hashes and URLs have no word boundaries: wrap without losing characters.
      for (const char of Array.from(word)) {
        if (line && font.widthOfTextAtSize(line + char, size) > width) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function createLicensePdf(data: LicensePdfData, fonts: { regular: Uint8Array; bold: Uint8Array }) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(fonts.regular, { subset: true });
  const bold = await pdf.embedFont(fonts.bold, { subset: true });
  pdf.setTitle("Giấy phép sử dụng #" + data.id);
  pdf.setAuthor("Bản Quyền Số");
  pdf.setSubject("Bản tra cứu công khai tại block #" + data.blockNumber);
  const W = 595.28,
    H = 841.89,
    margin = 42,
    width = W - 2 * margin;
  const ink = rgb(0.12, 0.13, 0.19),
    muted = rgb(0.38, 0.39, 0.46),
    purple = rgb(0.4, 0.28, 0.72);
  let page = pdf.addPage([W, H]);
  let y = H - margin;
  function header() {
    page.drawText("BẢN QUYỀN SỐ · BẢN TRA CỨU CÔNG KHAI", {
      x: margin,
      y: H - margin,
      font: bold,
      size: 9,
      color: purple,
    });
    y = H - margin - 27;
  }
  header();
  function ensure(height: number) {
    if (y - height >= 48) return;
    page = pdf.addPage([W, H]);
    header();
  }
  function text(value: string, size = 10, font = regular, color = ink, lineHeight = 15) {
    for (const line of wrapPdfText(value, font, size, width)) {
      ensure(lineHeight);
      if (line) page.drawText(line, { x: margin, y: y - size, font, size, color });
      y -= lineHeight;
    }
  }
  function section(title: string) {
    ensure(72);
    y -= 8;
    page.drawRectangle({
      x: margin,
      y: y - 26,
      width,
      height: 26,
      color: rgb(0.96, 0.95, 0.99),
      borderWidth: 0.5,
      borderColor: rgb(0.87, 0.85, 0.93),
    });
    page.drawText(title, { x: margin + 10, y: y - 17, font: bold, size: 11, color: purple });
    y -= 38;
  }
  function field(label: string, value: string, compact = false) {
    ensure(35);
    text(label, 8.5, regular, muted, 13);
    text(value, compact ? 8.5 : 10, regular, ink, compact ? 13 : 15);
    y -= 7;
  }
  text("Giấy phép sử dụng #" + data.id, 21, bold, ink, 29);
  text("Đối chiếu dữ liệu blockchain và điều khoản tại một thời điểm xác định.", 9, regular, muted, 15);
  section("Tác phẩm và hiệu lực");
  field("Tên tác phẩm", data.title);
  field("Hiệu lực trên blockchain tại thời điểm đối chiếu", data.status);
  field("Mã tác phẩm · SHA-256", data.fileHash, true);
  section("Bên cấp và bên nhận");
  field("Ví bên cấp", data.licensor);
  field("Ví bên nhận", data.licensee);
  section("Thời hạn · Giờ Việt Nam (UTC+7)");
  field("Được cấp", data.grantedAt);
  field("Hết hạn", data.expiresAt);
  field("Đối chiếu tại block #" + data.blockNumber, data.observedAt);
  section("Điều khoản sử dụng và chấp thuận");
  text(
    "Hiệu lực trên blockchain và chấp thuận điều khoản là hai trạng thái riêng. Điều khoản và chữ ký được lưu ngoài blockchain.",
    9,
    regular,
    muted,
    14,
  );
  y -= 10;
  if (data.terms) {
    field("Phiên bản điều khoản được lưu", String(data.terms.version));
    data.terms.content
      .split(/\n+/)
      .filter(line => line.trim())
      .forEach(line => {
        text(line);
        y -= 7;
      });
    field(
      "Chấp thuận",
      data.terms.acceptedAt
        ? "Đã chấp thuận bằng chữ ký ví · " + data.terms.acceptedAt
        : "Chưa ghi nhận chữ ký chấp thuận",
    );
    field("Mã đối chiếu điều khoản · Keccak-256", data.terms.termsHash, true);
  } else {
    text("Giấy phép chưa có bản điều khoản được lưu; chưa có ghi nhận chấp thuận.", 10);
    y -= 8;
    field("Điều kiện tham chiếu V1 · không phải bản đã ký", data.referenceTerms || "Không có nội dung tham chiếu.");
  }
  section("Thông tin đối chiếu blockchain");
  field("Mạng / Chain ID", `${data.chainName} / ${data.chainId}`);
  field("Contract", data.contract, true);
  field("Hash block đối chiếu", data.blockHash, true);
  field("Giao dịch cấp", data.txHash, true);
  if (data.grantBlockHash) field("Hash block giao dịch cấp", data.grantBlockHash, true);
  // Keep QR and its heading together; explanatory text may flow to the next page.
  ensure(210);
  section("Kiểm tra lại giấy phép");
  const qr = await pdf.embedPng(
    await QRCode.toDataURL(data.verificationUrl, { width: 512, margin: 4, errorCorrectionLevel: "M" }),
  );
  page.drawImage(qr, { x: margin, y: y - 128, width: 128, height: 128 });
  const annotation = pdf.context.register(
    pdf.context.obj({
      Type: PDFName.of("Annot"),
      Subtype: PDFName.of("Link"),
      Rect: [margin, y - 128, margin + 128, y],
      Border: [0, 0, 0],
      A: { Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(data.verificationUrl) },
    }),
  );
  page.node.addAnnot(annotation);
  y -= 140;
  text(
    "Quét QR hoặc bấm mã để mở trạng thái hiện tại. Giấy phép có thể hết hạn hoặc bị thu hồi sau khi xuất PDF.",
    9,
    regular,
    muted,
    14,
  );
  y -= 6;
  text(data.verificationUrl, 8, regular, ink, 12);
  if (["localhost", "127.0.0.1", "[::1]"].includes(new URL(data.verificationUrl).hostname)) {
    y -= 8;
    text("Liên kết localhost chỉ mở được trên máy đang chạy ứng dụng.", 9, regular, muted, 14);
  }
  y -= 14;
  text(
    "Bản tra cứu phản ánh dữ liệu tại block đối chiếu; không phải Giấy chứng nhận đăng ký quyền tác giả hoặc xác minh danh tính pháp lý.",
    9,
    regular,
    muted,
    14,
  );
  const pages = pdf.getPages();
  pages.forEach((item, i) => {
    item.drawLine({
      start: { x: margin, y: 33 },
      end: { x: W - margin, y: 33 },
      color: rgb(0.87, 0.87, 0.9),
      thickness: 0.5,
    });
    item.drawText(`Bản Quyền Số · Giấy phép #${data.id}`, { x: margin, y: 20, font: regular, size: 8, color: muted });
    const number = `${i + 1} / ${pages.length}`;
    item.drawText(number, {
      x: W - margin - regular.widthOfTextAtSize(number, 8),
      y: 20,
      font: regular,
      size: 8,
      color: muted,
    });
  });
  return pdf.save();
}
