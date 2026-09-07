/**
 * Films the marketing hero video against the app's own notes UI.
 *
 * The film is shot on `/hero-stage` (a development-only route in `apps/nota`)
 * which mounts the real `NotesSidebarList`, `TipTapEditor` and `NotesGraphScreen`
 * over an invented vault, so the recording shows the product without ever
 * putting a real note, title, or account on camera.
 *
 * Usage, from the monorepo root, with the notes app running on :3000
 *   pnpm exec nx dev @getmadrid/nota
 *   node apps/nota-marketing/scripts/record-hero.ts
 *
 * Writes public/video/nota-hero.{mp4,webm} and nota-hero-poster.jpg.
 * With `--graph-still` it instead re-shoots src/assets/marketing/note-graph.png
 * from the same invented vault.
 * Requires the root devDependency `playwright-core`, its chromium build
 * (`node node_modules/playwright-core/cli.js install chromium`), and `ffmpeg`.
 */
import { chromium, type Page } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/video');

const STAGE_URL =
  process.env.HERO_STAGE_URL ?? 'http://localhost:3000/hero-stage';

/** Composition size in CSS pixels; doubled by `deviceScaleFactor` when filmed. */
const STAGE = { width: 1440, height: 960 };
const SCALE = 2;
/** Delivery size. Half the filmed resolution, so text downsamples sharp. */
const OUT = { width: 1920, height: 1280 };
const FPS = 30;

declare global {
  interface Window {
    __heroStage?: {
      setDim: (dim: boolean) => void;
      setScene: (scene: 'write' | 'graph') => void;
    };
  }
}

/**
 * The sentence typed on camera. Written for the hero, so it has to read like
 * the product's own voice rather than filler: no feature names, no exclamation.
 */
const OPENING =
  'You copy out the passage that stopped you, then say why it stopped you. ';
const MENTION_QUERY = 'Mont';
const CLOSING = ' kept one for twenty years, and never called it a system.';

/** Deterministic jitter, so two runs of the script type identically. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const rng = makeRng(20260907);

/** Types with a human-ish cadence: a beat after punctuation, jitter elsewhere. */
async function typeLikeAPerson(page: Page, value: string): Promise<void> {
  for (const char of value) {
    await page.keyboard.type(char);
    let delay = 26 + rng() * 34;
    if (char === ' ') delay += 18;
    if (',;:'.includes(char)) delay += 90;
    if ('.'.includes(char)) delay += 180;
    await page.waitForTimeout(delay);
  }
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    child.on('error', (error) => {
      reject(error);
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${cmd} exited ${String(code)}\n${stderr.slice(-4000)}`),
        );
    });
  });
}

/**
 * Re-shoots the note-graph product shot off the same invented vault.
 *
 * The committed screenshot was taken against a real vault and carried real note
 * titles (including account-recovery notes) into a public page.
 */
async function captureGraphStill() {
  const target = path.join(__dirname, '../src/assets/marketing/note-graph.png');
  const browser = await chromium.launch({ channel: 'chromium' });
  const page = await browser.newPage({
    viewport: STAGE,
    deviceScaleFactor: SCALE,
    locale: 'en-GB',
    timezoneId: 'Europe/Madrid',
  });
  await page.goto(STAGE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.addStyleTag({
    content: `
      nextjs-portal { display: none !important; }
      * { scrollbar-width: none !important; }
      ::-webkit-scrollbar { display: none !important; }
    `,
  });
  await page.waitForFunction(() => Boolean(window.__heroStage), null, {
    timeout: 120_000,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    window.__heroStage?.setDim(false);
    window.__heroStage?.setScene('graph');
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: target });
  await browser.close();
  console.log(`${path.basename(target)} re-shot from the demo vault`);
}

async function main() {
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nota-hero-'));
  const browser = await chromium.launch({ channel: 'chromium' });
  const page = await browser.newPage({
    viewport: STAGE,
    deviceScaleFactor: SCALE,
    // Fixed so `toLocaleDateString`-style output never drifts between runs.
    locale: 'en-GB',
    timezoneId: 'Europe/Madrid',
    reducedMotion: 'no-preference',
  });

  page.on('pageerror', (error) => {
    console.error('[stage]', error.message);
  });

  await page.goto(STAGE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.addStyleTag({
    content: `
      nextjs-portal { display: none !important; }
      * { scrollbar-width: none !important; }
      ::-webkit-scrollbar { display: none !important; }
      /* The caret is the only thing on screen that must not be interpolated away. */
      .ProseMirror { caret-color: currentColor; }
    `,
  });
  await page.waitForFunction(() => Boolean(window.__heroStage), null, {
    timeout: 120_000,
  });
  // Fonts and the editor both settle late; filming early bakes a reflow into frame 1.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector('.ProseMirror', { timeout: 60_000 });
  await page.waitForTimeout(1500);

  const frames: Array<{ file: string; timestamp: number }> = [];
  const client = await page.context().newCDPSession(page);
  client.on('Page.screencastFrame', ({ data, sessionId, metadata }) => {
    const file = path.join(
      frameDir,
      `f${String(frames.length).padStart(5, '0')}.jpg`,
    );
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, timestamp: metadata.timestamp });
    void client.send('Page.screencastFrameAck', { sessionId }).catch(() => {
      // The cast is already stopped; the remaining acks are noise.
    });
  });

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 100,
    maxWidth: STAGE.width * SCALE,
    maxHeight: STAGE.height * SCALE,
    everyNthFrame: 1,
  });

  // --- the take -------------------------------------------------------------
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__heroStage?.setDim(false)); // fade the window up
  await page.waitForTimeout(1100);

  await page.focus('.ProseMirror');
  await page.waitForTimeout(500);

  await typeLikeAPerson(page, OPENING);

  // The `@` menu is the product's whole linking story, so it plays at full speed.
  await page.keyboard.type('@');
  await page.waitForSelector('[role="listbox"]', { timeout: 10_000 });
  await page.waitForTimeout(420);
  await typeLikeAPerson(page, MENTION_QUERY);
  await page.waitForTimeout(650);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);

  await typeLikeAPerson(page, CLOSING);
  await page.waitForTimeout(1600);

  await page.evaluate(() => window.__heroStage?.setScene('graph'));
  await page.waitForTimeout(3800);

  await page.evaluate(() => window.__heroStage?.setDim(true)); // fade back out to loop
  await page.waitForTimeout(900);
  // --- end of take ----------------------------------------------------------

  await client.send('Page.stopScreencast');
  await page.waitForTimeout(300);
  await browser.close();

  if (frames.length < 30) {
    throw new Error(
      `Only ${String(frames.length)} frames captured; the take did not run.`,
    );
  }

  // Screencast only emits on paint, so each frame carries its own duration.
  const listPath = path.join(frameDir, 'frames.txt');
  const lines = [];
  for (let i = 0; i < frames.length; i += 1) {
    const duration =
      i < frames.length - 1
        ? Math.max(1 / FPS, frames[i + 1].timestamp - frames[i].timestamp)
        : 1 / FPS;
    lines.push(`file '${frames[i].file}'`, `duration ${duration.toFixed(4)}`);
  }
  // concat demuxer drops the last entry's duration unless the file repeats.
  lines.push(`file '${frames[frames.length - 1].file}'`);
  fs.writeFileSync(listPath, lines.join('\n'));

  fs.mkdirSync(outDir, { recursive: true });
  const mp4 = path.join(outDir, 'nota-hero.mp4');
  const webm = path.join(outDir, 'nota-hero.webm');
  const poster = path.join(outDir, 'nota-hero-poster.jpg');
  const scale = `scale=${String(OUT.width)}:${String(OUT.height)}:flags=lanczos`;
  const input = ['-f', 'concat', '-safe', '0', '-i', listPath];

  console.log(`Encoding ${String(frames.length)} frames…`);
  await run('ffmpeg', [
    '-y',
    ...input,
    '-vf',
    `fps=${String(FPS)},${scale},format=yuv420p`,
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '20',
    '-movflags',
    '+faststart',
    '-an',
    mp4,
  ]);
  await run('ffmpeg', [
    '-y',
    ...input,
    '-vf',
    `fps=${String(FPS)},${scale}`,
    '-c:v',
    'libvpx-vp9',
    '-crf',
    '32',
    '-b:v',
    '0',
    '-row-mt',
    '1',
    '-pix_fmt',
    'yuv420p',
    '-an',
    webm,
  ]);
  // Poster = the finished note, so the still before playback is the payoff frame
  // rather than an empty document.
  await run('ffmpeg', [
    '-y',
    '-i',
    mp4,
    '-ss',
    '13',
    '-frames:v',
    '1',
    '-vf',
    scale,
    '-q:v',
    '3',
    poster,
  ]);

  fs.rmSync(frameDir, { recursive: true, force: true });

  for (const file of [mp4, webm, poster]) {
    console.log(
      `${path.basename(file)}  ${(fs.statSync(file).size / 1024 / 1024).toFixed(2)} MB`,
    );
  }
}

if (process.argv.includes('--graph-still')) {
  await captureGraphStill();
} else {
  await main();
}
