import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Contract, JsonRpcProvider, sha256 } from "ethers";
import type { InterfaceAbi } from "ethers";

const RPC_URL = "http://127.0.0.1:8545";
const DAY_SECONDS = 86_400n;

function createPdf() {
  const stream = "BT /F1 18 Tf 50 760 Td (Ban Quyen So - Tai lieu demo do nhom tao) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

function createWav() {
  const sampleRate = 8000;
  const samples = 2000;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) {
    wav.writeInt16LE(Math.round(1500 * Math.sin((index * 2 * Math.PI * 440) / sampleRate)), 44 + index * 2);
  }
  return wav;
}

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  try {
    if ((await provider.getNetwork()).chainId !== 31337n) {
      throw new Error("Seed chỉ được chạy trên Hardhat local, chain ID 31337.");
    }
    const deploymentPath = join(process.cwd(), "deployments", "default", "WorkRegistry.json");
    if (!existsSync(deploymentPath)) throw new Error("Chưa có deployment local. Chạy yarn deploy trước.");
    const deployment = JSON.parse(readFileSync(deploymentPath, "utf8")) as { address: string; abi: InterfaceAbi };
    if ((await provider.getCode(deployment.address)) === "0x") {
      throw new Error("Contract không có trên node hiện tại. Chạy yarn deploy sau khi reset node.");
    }
    const registrant = await provider.getSigner(1);
    const licensee = await provider.getSigner(2);
    const outsider = await provider.getSigner(3);
    const registry = new Contract(deployment.address, deployment.abi, registrant);
    if ((await registry.licenseCount()) !== 0n) {
      throw new Error(
        "Contract đã có giấy phép. Seed dừng để giữ nguyên dữ liệu. Muốn tạo lại bộ demo: dừng/chạy lại yarn chain, yarn deploy, yarn demo:seed.",
      );
    }
    if (await registry.paused()) throw new Error("Contract đang pause. Mở lại trong Debug trước khi seed.");

    const samples = [
      {
        name: "anh-demo.png",
        title: "Ảnh mẫu của nhóm",
        type: 0,
        bytes: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
          "base64",
        ),
      },
      { name: "am-thanh-demo.wav", title: "Âm thanh mẫu 440 Hz", type: 1, bytes: createWav() },
      { name: "tai-lieu-demo.pdf", title: "Tài liệu mẫu của nhóm", type: 2, bytes: createPdf() },
    ];
    const sampleDirectory = join(process.cwd(), "demo");
    mkdirSync(sampleDirectory, { recursive: true });
    const registrantAddress = await registrant.getAddress();
    const licenseeAddress = await licensee.getAddress();
    const manifest = [];
    for (const sample of samples) {
      const fileHash = sha256(sample.bytes);
      const existing = await registry.works(fileHash);
      if (existing.registrant !== "0x0000000000000000000000000000000000000000") {
        if (existing.registrant.toLowerCase() !== registrantAddress.toLowerCase()) {
          throw new Error(`File mẫu ${sample.name} đã được ví khác đăng ký; reset node để có bộ demo chuẩn.`);
        }
      } else {
        const args = [fileHash, sample.title, "File do script demo tạo, dùng cho bài tập của nhóm.", sample.type];
        const gas = await registry.registerWork.estimateGas(...args);
        await (await registry.registerWork(...args, { gasLimit: (gas * 120n) / 100n })).wait();
      }
      writeFileSync(join(sampleDirectory, sample.name), sample.bytes);
      manifest.push({ name: sample.name, title: sample.title, fileHash });
    }

    const block = await provider.getBlock("latest");
    if (!block) throw new Error("Không đọc được block hiện tại.");
    const now = BigInt(block.timestamp);
    for (const [index, sample] of manifest.entries()) {
      const expiresAt = index === 2 ? now + 60n : now + 30n * DAY_SECONDS;
      const args = [sample.fileHash, licenseeAddress, expiresAt];
      const gas = await registry.grantLicense.estimateGas(...args);
      await (await registry.grantLicense(...args, { gasLimit: (gas * 120n) / 100n })).wait();
    }
    const gas = await registry.revokeLicense.estimateGas(2n);
    await (await registry.revokeLicense(2n, { gasLimit: (gas * 120n) / 100n })).wait();
    // Local-only time travel makes the PDF license expire without a real-time wait.
    await provider.send("evm_increaseTime", [61]);
    await provider.send("evm_mine", []);

    const result = {
      chainId: 31337,
      contract: deployment.address,
      registrant: registrantAddress,
      licensee: licenseeAddress,
      outsider: await outsider.getAddress(),
      samples: manifest,
      licenses: { valid: 1, revoked: 2, expired: 3 },
    };
    writeFileSync(join(sampleDirectory, "manifest.json"), JSON.stringify(result, null, 2) + "\n");
    console.log(JSON.stringify(result, null, 2));
    console.log("Seed xong. File mẫu nằm trong packages/hardhat/demo. Đồng hồ local đã tăng 61 giây.");
  } finally {
    provider.destroy();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
