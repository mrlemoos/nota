// Regenerates derived brand assets from source SVG/PNG files.
//
// Usage (repo root): `pnpm run generate:nota-icons`
//
// Inputs:
// - `public/favicon.svg` (light dock / .icns source)
// - `../nota-electron/buildResources/icon-dark.svg` (dark dock raster source)
// - `public/apple-touch-icon.png`
//
// Outputs:
// - `../nota-electron/buildResources/icon.png` (light dock / .icns source)
// - `../nota-electron/buildResources/icon.icns` (macOS only, via iconutil)
// - `../nota-electron/buildResources/icon-dark.png` (1024; Electron dock via nativeTheme)
//
// Optional (`NOTA_REGENERATE_EMBEDDED_FAVICON=1`): overwrite `public/favicon.svg` with a PNG
// embedding of `apple-touch-icon.png`. The committed favicon is hand-authored; default is skip.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTA_APP_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(NOTA_APP_ROOT, 'public');
const ELECTRON_BUILD_RESOURCES = path.resolve(
  NOTA_APP_ROOT,
  '..',
  'nota-electron',
  'buildResources',
);

const ICON_PNG_PATH = path.join(ELECTRON_BUILD_RESOURCES, 'icon.png');
const ICON_DARK_SVG_PATH = path.join(ELECTRON_BUILD_RESOURCES, 'icon-dark.svg');
const ICON_DARK_PNG_PATH = path.join(ELECTRON_BUILD_RESOURCES, 'icon-dark.png');
const APPLE_TOUCH_ICON_PATH = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
const FAVICON_SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');
const ELECTRON_ICON_SIZE_PX = 1024;
const ELECTRON_ICON_VISIBLE_SCALE = 0.82;

const ICONSET_SIZES = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
];

async function renderPaddedIconPng(inputPath, outputPath, label) {
  if (!fs.existsSync(inputPath)) {
    console.warn(`Skipping ${label} (missing ${inputPath})`);
    return;
  }

  const innerSize = Math.round(
    ELECTRON_ICON_SIZE_PX * ELECTRON_ICON_VISIBLE_SCALE,
  );
  const inset = Math.floor((ELECTRON_ICON_SIZE_PX - innerSize) / 2);
  const icon = await sharp(inputPath)
    .resize(innerSize, innerSize, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: ELECTRON_ICON_SIZE_PX,
      height: ELECTRON_ICON_SIZE_PX,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: icon, left: inset, top: inset }])
    .png()
    .toFile(outputPath);

  console.log('Wrote', outputPath);
}

async function writeIconPng() {
  await renderPaddedIconPng(FAVICON_SVG_PATH, ICON_PNG_PATH, 'icon.png');
}

async function writeIconDarkPng() {
  await renderPaddedIconPng(
    ICON_DARK_SVG_PATH,
    ICON_DARK_PNG_PATH,
    'icon-dark.png',
  );
}

async function writeIcns() {
  if (process.platform !== 'darwin') {
    console.warn(
      'Skipping icon.icns (iconutil requires macOS). Run this script on a Mac to refresh Electron icons.',
    );
    return;
  }

  const iconsetDir = path.join(
    os.tmpdir(),
    `nota-brand-${Date.now()}-${process.pid}.iconset`,
  );
  fs.mkdirSync(iconsetDir, { recursive: true });

  try {
    for (const [filename, size] of ICONSET_SIZES) {
      const outPath = path.join(iconsetDir, filename);
      await sharp(ICON_PNG_PATH).resize(size, size).png().toFile(outPath);
    }

    const icnsOut = path.join(ELECTRON_BUILD_RESOURCES, 'icon.icns');
    execFileSync('iconutil', ['-c', 'icns', iconsetDir, '-o', icnsOut], {
      stdio: 'inherit',
    });
    console.log('Wrote', icnsOut);
  } finally {
    fs.rmSync(iconsetDir, { recursive: true, force: true });
  }
}

async function writeFaviconSvg() {
  const pngBuf = fs.readFileSync(APPLE_TOUCH_ICON_PATH);
  const b64 = pngBuf.toString('base64');
  const { width, height } = await sharp(APPLE_TOUCH_ICON_PATH).metadata();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${b64}"/>
</svg>
`;
  fs.writeFileSync(FAVICON_SVG_PATH, svg);
  console.log('Wrote public/favicon.svg');
}

await writeIconPng();
await writeIconDarkPng();
await writeIcns();
if (process.env.NOTA_REGENERATE_EMBEDDED_FAVICON === '1') {
  await writeFaviconSvg();
} else {
  console.log(
    'Skipping public/favicon.svg (set NOTA_REGENERATE_EMBEDDED_FAVICON=1 to embed apple-touch-icon).',
  );
}
