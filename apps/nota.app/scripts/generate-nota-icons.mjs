/**
 * Regenerates raster brand assets from the stacked-sheet SVG geometry
 * (keep in sync with `app/components/nota-logo.tsx` and `public/favicon.svg`).
 *
 * Usage (repo root): `pnpm run generate:nota-icons`
 *
 * Outputs:
 * - `public/apple-touch-icon.png` (180×180, light background)
 * - `../nota-electron/buildResources/icon.icns` (macOS only, via iconutil)
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTA_APP_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(NOTA_APP_ROOT, 'public');
const FAVICON_SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');
const ELECTRON_BUILD_RESOURCES = path.resolve(
  NOTA_APP_ROOT,
  '..',
  'nota-electron',
  'buildResources',
);

function pngFromMark(size) {
  return sharp(FAVICON_SVG_PATH, { density: 1024 }).resize(size, size).png();
}

async function writeAppleTouchIcon() {
  const markSize = 140;
  const markBuf = await pngFromMark(markSize).toBuffer();
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: markBuf, gravity: 'centre' }])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('Wrote public/apple-touch-icon.png');
}

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
      await pngFromMark(size).toFile(outPath);
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

await writeAppleTouchIcon();
await writeIcns();
