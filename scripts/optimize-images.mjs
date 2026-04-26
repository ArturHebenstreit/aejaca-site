import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

const QUALITY = { webp: 80, jpg: 80 };
const MAX_WIDTH = 1200;
const CALC_MAX_WIDTH = 512;
const SKIP = ["favicon", "apple-touch-icon", "logo.png", "brand-sign.png"];

function shouldSkip(filePath) {
  const name = path.basename(filePath);
  return SKIP.some((s) => name.includes(s));
}

function getMaxWidth(filePath) {
  if (filePath.includes("/img/calc/")) return CALC_MAX_WIDTH;
  return MAX_WIDTH;
}

async function processFile(filePath) {
  if (shouldSkip(filePath)) return null;

  const ext = path.extname(filePath).toLowerCase();
  const isJpg = ext === ".jpg" || ext === ".jpeg";
  const isPng = ext === ".png";
  if (!isJpg && !isPng) return null;

  const stat = fs.statSync(filePath);
  const originalSize = stat.size;
  const maxW = getMaxWidth(filePath);

  try {
    const img = sharp(filePath);
    const meta = await img.metadata();
    const needsResize = meta.width > maxW;

    let pipeline = sharp(filePath);
    if (needsResize) {
      pipeline = pipeline.resize(maxW, null, { withoutEnlargement: true });
    }

    // Generate WebP version
    const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, ".webp");
    const webpBuffer = await pipeline.clone().webp({ quality: QUALITY.webp }).toBuffer();
    fs.writeFileSync(webpPath, webpBuffer);

    // Optimize original in-place
    let optimizedBuffer;
    if (isJpg) {
      optimizedBuffer = await pipeline.jpeg({ quality: QUALITY.jpg, mozjpeg: true }).toBuffer();
    } else {
      optimizedBuffer = await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer();
    }
    fs.writeFileSync(filePath, optimizedBuffer);

    const newSize = fs.statSync(filePath).size;
    const webpSize = webpBuffer.length;
    const saved = originalSize - newSize;
    const webpSaved = originalSize - webpSize;

    return {
      file: path.relative(publicDir, filePath),
      original: originalSize,
      optimized: newSize,
      webp: webpSize,
      saved,
      webpSaved,
      resized: needsResize,
    };
  } catch (err) {
    console.error(`  Error: ${path.relative(publicDir, filePath)}: ${err.message}`);
    return null;
  }
}

function findImages(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findImages(full));
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

console.log("Optimizing images...\n");
const images = findImages(publicDir);
let totalOriginal = 0;
let totalOptimized = 0;
let totalWebp = 0;
let count = 0;

for (const img of images) {
  const result = await processFile(img);
  if (result) {
    count++;
    totalOriginal += result.original;
    totalOptimized += result.optimized;
    totalWebp += result.webp;
    const pct = ((result.saved / result.original) * 100).toFixed(0);
    const webpPct = ((result.webpSaved / result.original) * 100).toFixed(0);
    console.log(`  ${result.resized ? "↓" : "✓"} ${result.file} — ${(result.original / 1024).toFixed(0)}KB → ${(result.optimized / 1024).toFixed(0)}KB (${pct}%) | WebP: ${(result.webp / 1024).toFixed(0)}KB (${webpPct}%)`);
  }
}

console.log(`\n--- Summary ---`);
console.log(`Files: ${count}`);
console.log(`Original:  ${(totalOriginal / 1024 / 1024).toFixed(1)} MB`);
console.log(`Optimized: ${(totalOptimized / 1024 / 1024).toFixed(1)} MB (${((1 - totalOptimized / totalOriginal) * 100).toFixed(0)}% saved)`);
console.log(`WebP:      ${(totalWebp / 1024 / 1024).toFixed(1)} MB (${((1 - totalWebp / totalOriginal) * 100).toFixed(0)}% saved)`);
