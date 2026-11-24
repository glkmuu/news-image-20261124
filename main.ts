// main.ts — news-image-20261124 entry program.
//
// Copies the repository's entry.png (the 24 November 2026 world-news
// summary image) to the harness output directory, after checking the
// file is a valid PNG or JPEG within the competition's limits:
// at most 1 MiB and at most 1024x1024 pixels. The copy is byte for
// byte identical on every run, so the two grading runs agree.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const SOURCE = new URL("./entry.png", import.meta.url);

function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    return null;
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

const data = readFileSync(SOURCE);
const size = pngSize(data) ?? jpegSize(data);
if (size === null) {
  throw new Error("entry.png is neither a valid PNG nor a valid JPEG");
}
if (data.length > 1048576) {
  throw new Error(`entry.png is ${data.length} bytes, over the 1 MiB limit`);
}
if (size.width > 1024 || size.height > 1024) {
  throw new Error(`entry.png is ${size.width}x${size.height}, over the 1024x1024 limit`);
}
mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(SOURCE, join(OUTPUT_DIR, "entry.png"));
const written = readFileSync(join(OUTPUT_DIR, "entry.png"));
if (!written.equals(data)) {
  throw new Error("copied entry.png does not match the source bytes");
}
console.log(
  `wrote ${join(OUTPUT_DIR, "entry.png")} (${size.width}x${size.height}, ${data.length} bytes)`,
);
