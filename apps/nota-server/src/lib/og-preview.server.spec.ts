import * as dns from 'node:dns/promises';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
} from 'bun:test';
import {
  assertResolvedAddressesSafeForOgFetch,
  assertUrlSafeForOgFetch,
  fetchOgPreview,
  parseOgFromHtml,
  sanitizeOgImageUrl,
} from './og-preview.server.ts';

describe('parseOgFromHtml', () => {
  it('extracts og tags and resolves relative image', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Hello &amp; world" />
        <meta property="og:description" content="Desc" />
        <meta property="og:image" content="/pic.png" />
      </head></html>
    `;
    const r = parseOgFromHtml(html, 'https://example.com/page');
    expect(r.title).toBe('Hello & world');
    expect(r.description).toBe('Desc');
    expect(r.image).toBe('https://example.com/pic.png');
  });

  it('falls back to title tag and meta description', () => {
    const html =
      '<html><head><title>  Plain title  </title>' +
      '<meta name="description" content="From name" /></head></html>';
    const r = parseOgFromHtml(html, 'https://x.test/');
    expect(r.title).toBe('Plain title');
    expect(r.description).toBe('From name');
  });

  it('drops og:image when resolved URL is not http(s)', () => {
    const html = `
      <html><head>
        <meta property="og:image" content="javascript:alert(1)" />
      </head></html>
    `;
    const r = parseOgFromHtml(html, 'https://example.com/page');
    expect(r.image).toBeNull();
  });

  it('keeps https og:image absolute URLs', () => {
    const html = `
      <html><head>
        <meta property="og:image" content="https://cdn.example.com/x.png" />
      </head></html>
    `;
    const r = parseOgFromHtml(html, 'https://example.com/page');
    expect(r.image).toBe('https://cdn.example.com/x.png');
  });
});

describe('sanitizeOgImageUrl', () => {
  it('returns null for javascript: URLs', () => {
    expect(sanitizeOgImageUrl('javascript:alert(1)', 'https://a.com/')).toBeNull();
  });
});

describe('assertUrlSafeForOgFetch', () => {
  it('accepts public https URLs', () => {
    const u = assertUrlSafeForOgFetch('https://example.com/path?q=1');
    expect(u.hostname).toBe('example.com');
  });

  it('rejects localhost', () => {
    expect(() => assertUrlSafeForOgFetch('http://localhost:3000/')).toThrow();
  });
});

describe('assertResolvedAddressesSafeForOgFetch', () => {
  it('rejects loopback IPv4 literals', async () => {
    await expect(assertResolvedAddressesSafeForOgFetch('127.0.0.1')).rejects.toThrow(
      'This URL is not allowed',
    );
  });

  it('rejects loopback IPv6 literals', async () => {
    await expect(assertResolvedAddressesSafeForOgFetch('::1')).rejects.toThrow(
      'This URL is not allowed',
    );
  });

  it('rejects when DNS resolves to a private address', async () => {
    const spy = spyOn(dns, 'lookup').mockImplementation(
      async () => [{ address: '10.0.0.1', family: 4 }],
    );
    try {
      await expect(
        assertResolvedAddressesSafeForOgFetch('example.com'),
      ).rejects.toThrow('This URL is not allowed');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('fetchOgPreview', () => {
  let lookupSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    lookupSpy = spyOn(dns, 'lookup').mockImplementation(
      async () => [{ address: '8.8.8.8', family: 4 }],
    );
  });

  afterEach(() => {
    lookupSpy.mockRestore();
  });

  it('does not follow a redirect to a blocked host (SSRF hardening)', async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(null, {
        status: 302,
        headers: { Location: 'http://127.0.0.1/secret' },
      });
    try {
      await expect(fetchOgPreview('https://example.com/start')).rejects.toThrow(
        'This URL is not allowed',
      );
    } finally {
      globalThis.fetch = orig;
    }
  });

  it('stops after max redirects', async () => {
    const orig = globalThis.fetch;
    let n = 0;
    globalThis.fetch = async () => {
      n += 1;
      return new Response(null, {
        status: 302,
        headers: { Location: `https://hop${n}.example/next` },
      });
    };
    try {
      await expect(fetchOgPreview('https://example.com/start')).rejects.toThrow(
        'Too many redirects',
      );
    } finally {
      globalThis.fetch = orig;
    }
  });
});
