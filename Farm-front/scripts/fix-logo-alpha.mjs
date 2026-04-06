import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const inputPath = path.resolve('public/assets/logo.png');

const buf = await fs.readFile(inputPath);
const img = sharp(buf, { failOn: 'none' }).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

// Make near-white background pixels fully transparent.
// This removes the "white box" / checkerboard matte that often appears
// when a screenshot is saved instead of a true transparent PNG.
const out = Buffer.from(data);
for (let i = 0; i < out.length; i += 4) {
  const r = out[i];
  const g = out[i + 1];
  const b = out[i + 2];
  // Conservative threshold: only remove very light pixels.
  if (r >= 235 && g >= 235 && b >= 235) {
    out[i + 3] = 0;
  }
}

await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
  .toFile(inputPath);

// Also write favicon + apple-touch-icon derived from the logo.
await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
  .toFile(path.resolve('public/favicon.png'));

await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
  .toFile(path.resolve('public/apple-touch-icon.png'));

console.log(`Updated ${inputPath}`);
