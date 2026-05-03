// Regenerates derived brand assets from source PNGs.
//
// Usage (repo root): `pnpm run generate:nota-icons`
//
// Inputs:
// - `../nota-electron/buildResources/icon.png`
// - `public/apple-touch-icon.png`
//
// Outputs:
// - `../nota-electron/buildResources/icon.icns` (macOS only, via iconutil)
// - `public/favicon.svg` (SVG wrapper embedding apple-touch-icon.png)

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
const APPLE_TOUCH_ICON_PATH = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
const FAVICON_SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');

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

await writeIcns();
await writeFaviconSvg();
