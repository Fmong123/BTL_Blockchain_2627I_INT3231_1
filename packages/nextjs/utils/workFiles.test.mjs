import { hashFile } from "./hashFile.ts";
import { WorkType, getWorkMetadataError, parseFileHash, validateWorkFile } from "./workFiles.ts";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

const MB = 1024 * 1024;

test("All supported formats are classified, including common audio MIME aliases", () => {
  for (const [name, type, expected] of [
    ["photo.JPG", "image/jpeg", WorkType.Image],
    ["photo.png", "image/png", WorkType.Image],
    ["photo.webp", "image/webp", WorkType.Image],
    ["song.mp3", "audio/mpeg", WorkType.Audio],
    ["song.mp3", "audio/mp3", WorkType.Audio],
    ["record.wav", "audio/x-wav", WorkType.Audio],
    ["record.wav", "audio/vnd.wave", WorkType.Audio],
    ["book.pdf", "application/pdf", WorkType.Document],
  ])
    assert.equal(validateWorkFile({ name, type, size: 1 }), expected);
});

test("File size boundaries accept exactly the limit and reject one byte over", () => {
  for (const [name, type, limit] of [
    ["photo.png", "image/png", 20 * MB],
    ["book.pdf", "application/pdf", 20 * MB],
    ["song.mp3", "audio/mpeg", 100 * MB],
    ["record.wav", "audio/wav", 100 * MB],
  ]) {
    assert.doesNotThrow(() => validateWorkFile({ name, type, size: limit }));
    assert.throws(() => validateWorkFile({ name, type, size: limit + 1 }), /vượt giới hạn/);
  }
});

test("Empty, unsupported and mismatched files are rejected; missing/generic MIME falls back to extension", () => {
  assert.throws(() => validateWorkFile({ name: "empty.pdf", type: "application/pdf", size: 0 }), /trống/);
  for (const name of ["movie.mp4", "file", "photo.svg", "png", "__proto__"]) {
    assert.throws(() => validateWorkFile({ name, type: "", size: 1 }), /Hãy chọn/);
  }
  assert.throws(() => validateWorkFile({ name: "photo.png", type: "application/pdf", size: 1 }), /không khớp/);
  assert.equal(validateWorkFile({ name: "song.wav", type: "", size: 1 }), WorkType.Audio);
  assert.equal(validateWorkFile({ name: "file.pdf", type: "application/octet-stream", size: 1 }), WorkType.Document);
});

test("Hash lookup normalizes whitespace/case/prefix and rejects malformed values", () => {
  const hex = "AB".repeat(32);
  assert.equal(parseFileHash(`  0X${hex}  `), `0x${hex.toLowerCase()}`);
  assert.equal(parseFileHash(hex), `0x${hex.toLowerCase()}`);
  for (const input of [
    "",
    "abc",
    "g".repeat(64),
    "a".repeat(65),
    `0x${"a".repeat(63)}`,
    `0x${"a".repeat(32)} ${"a".repeat(32)}`,
  ]) {
    assert.throws(() => parseFileHash(input), /64 ký tự/);
  }
});

test("Metadata validation follows UTF-8 limits, including Vietnamese and optional description", () => {
  assert.ok(getWorkMetadataError("   ", ""));
  assert.equal(getWorkMetadataError("ấ".repeat(85) + "a", "đ".repeat(1024)), undefined);
  assert.ok(getWorkMetadataError("ấ".repeat(86), ""));
  assert.ok(getWorkMetadataError("Ảnh", "đ".repeat(1025)));
  assert.equal(getWorkMetadataError("Tác phẩm", ""), undefined);
});

test("SHA-256 matches a reference digest, ignores filename and changes when file bytes change", async () => {
  const content = "abc";
  const first = await hashFile(new File([content], "first.pdf"));
  assert.equal(first, "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(first, await hashFile(new File([content], "renamed.mp3")));
  assert.notEqual(first, await hashFile(new File(["abd"], "first.pdf")));
  const bytes = new Uint8Array(1024 * 1024).fill(19);
  assert.equal(
    await hashFile(new File([bytes], "sample.wav")),
    `0x${createHash("sha256").update(bytes).digest("hex")}`,
  );
});
