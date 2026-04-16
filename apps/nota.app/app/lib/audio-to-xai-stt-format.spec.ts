import { describe, expect, it } from 'vitest';
import {
  audioBufferToWav,
  shouldPassThroughToXaiStt,
} from './audio-to-xai-stt-format';

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

describe('shouldPassThroughToXaiStt', () => {
  it('allows only wav and mp3 family', () => {
    expect(shouldPassThroughToXaiStt('audio/wav')).toBe(true);
    expect(shouldPassThroughToXaiStt('audio/mpeg')).toBe(true);
    expect(shouldPassThroughToXaiStt('audio/mp3')).toBe(true);
  });

  it('does not pass through Ogg/Opus from MediaRecorder (transcode to WAV)', () => {
    expect(shouldPassThroughToXaiStt('audio/ogg;codecs=opus')).toBe(false);
    expect(shouldPassThroughToXaiStt('audio/ogg')).toBe(false);
    expect(shouldPassThroughToXaiStt('audio/webm;codecs=opus')).toBe(false);
    expect(shouldPassThroughToXaiStt('audio/mp4')).toBe(false);
  });
});

describe('audioBufferToWav', () => {
  it('produces audio/wav with RIFF header', async () => {
    const ch0 = new Float32Array(8).fill(0);
    const buf = {
      length: 8,
      numberOfChannels: 1,
      sampleRate: 48_000,
      getChannelData: (c: number): Float32Array => {
        if (c !== 0) {
          throw new Error('unexpected channel');
        }
        return ch0;
      },
    } as unknown as AudioBuffer;
    const blob = audioBufferToWav(buf);
    expect(blob.type).toBe('audio/wav');
    const ab = await blobToArrayBuffer(blob);
    expect(new TextDecoder().decode(ab.slice(0, 4))).toBe('RIFF');
    expect(new TextDecoder().decode(ab.slice(8, 12))).toBe('WAVE');
  });
});
