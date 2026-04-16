import { describe, expect, it } from 'vitest';
import { safeOgImageSrcForPreview } from './og-image-url';

describe('safeOgImageSrcForPreview', () => {
  it('accepts http and https URLs', () => {
    expect(safeOgImageSrcForPreview('https://cdn.example.com/a.png')).toBe(
      'https://cdn.example.com/a.png',
    );
    expect(safeOgImageSrcForPreview('http://cdn.example.com/a.png')).toBe(
      'http://cdn.example.com/a.png',
    );
  });

  it('rejects non-http(s) schemes', () => {
    expect(safeOgImageSrcForPreview('javascript:alert(1)')).toBeNull();
    expect(safeOgImageSrcForPreview('data:image/png;base64,abc')).toBeNull();
  });

  it('returns null for empty or invalid input', () => {
    expect(safeOgImageSrcForPreview('')).toBeNull();
    expect(safeOgImageSrcForPreview('   ')).toBeNull();
    expect(safeOgImageSrcForPreview('not a url')).toBeNull();
  });
});
