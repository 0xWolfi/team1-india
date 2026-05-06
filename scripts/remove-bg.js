const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function removeBlackBg(inputPath, outputPath, threshold = 30, feather = 12) {
  // 1) Read original RGBA
  const input = sharp(inputPath).ensureAlpha();
  const meta = await input.metadata();
  const { width, height } = meta;

  // 2) Build a luminance buffer (greyscale) — bright pixels = statue, dark = bg
  const grey = await sharp(inputPath).removeAlpha().greyscale().raw().toBuffer();

  // 3) Build alpha channel: 0 where dark (below threshold), full elsewhere with smooth ramp
  const alpha = Buffer.alloc(width * height);
  const upper = threshold + feather;
  for (let i = 0; i < grey.length; i++) {
    const v = grey[i];
    if (v <= threshold) alpha[i] = 0;
    else if (v >= upper) alpha[i] = 255;
    else alpha[i] = Math.round(((v - threshold) / feather) * 255);
  }

  // 4) Compose new RGBA: original RGB + new alpha
  const rgb = await sharp(inputPath).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0, k = 0; i < width * height; i++, j += 3, k += 4) {
    rgba[k] = rgb[j];
    rgba[k + 1] = rgb[j + 1];
    rgba[k + 2] = rgb[j + 2];
    rgba[k + 3] = alpha[i];
  }

  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${width}x${height})`);
}

(async () => {
  const dir = '/Users/0xxavierr/Documents/Team1India/public/speedrun';
  const files = ['hero-statue.png', 'thinker-statue.png'];
  // Backup originals
  for (const f of files) {
    const src = path.join(dir, f);
    const bak = path.join(dir, f.replace('.png', '.original.png'));
    if (!fs.existsSync(bak)) fs.copyFileSync(src, bak);
    await removeBlackBg(bak, src, 28, 14);
  }
})();
