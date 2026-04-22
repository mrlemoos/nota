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
    // Arrange
    const html = `
      <html><head>
        <meta property="og:title" content="Hello &amp; world" />
        <meta property="og:description" content="Desc" />
        <meta property="og:image" content="/pic.png" />
      </head></html>
    `;
    const pageUrl = 'https://example.com/page';

    // Act
    const r = parseOgFromHtml(html, pageUrl);

    // Assert
    expect(r.title).toBe('Hello & world');
    expect(r.description).toBe('Desc');
    expect(r.image).toBe('https://example.com/pic.png');
  });

  it('falls back to title tag and meta description', () => {
    // Arrange
    const html =
      '<html><head><title>  Plain title  </title>' +
      '<meta name="description" content="From name" /></head></html>';
    const pageUrl = 'https://x.test/';

    // Act
    const r = parseOgFromHtml(html, pageUrl);

    // Assert
    expect(r.title).toBe('Plain title');
    expect(r.description).toBe('From name');
  });

  it('drops og:image when resolved URL is not http(s)', () => {
    // Arrange
    const html = `
      <html><head>
        <meta property="og:image" content="javascript:alert(1)" />
      </head></html>
    `;
    const pageUrl = 'https://example.com/page';

    // Act
    const r = parseOgFromHtml(html, pageUrl);

    // Assert
    expect(r.image).toBeNull();
  });

  it('keeps https og:image absolute URLs', () => {
    // Arrange
    const html = `
      <html><head>
        <meta property="og:image" content="https://cdn.example.com/x.png" />
      </head></html>
    `;
    const pageUrl = 'https://example.com/page';

    // Act
    const r = parseOgFromHtml(html, pageUrl);

    // Assert
    expect(r.image).toBe('https://cdn.example.com/x.png');
  });
});

describe('sanitizeOgImageUrl', () => {
  it('returns null for javascript: URLs', () => {
    // Arrange
    const raw = 'javascript:alert(1)';
    const base = 'https://a.com/';

    // Act
    const result = sanitizeOgImageUrl(raw, base);

    // Assert
    expect(result).toBeNull();
  });
});

describe('assertUrlSafeForOgFetch', () => {
  it('accepts public https URLs', () => {
    // Arrange
    const url = 'https://example.com/path?q=1';

    // Act
    const u = assertUrlSafeForOgFetch(url);

    // Assert
    expect(u.hostname).toBe('example.com');
  });

  it('rejects localhost', () => {
    // Arrange
    const url = 'http://localhost:3000/';

    // Act
    const act = () => assertUrlSafeForOgFetch(url);

    // Assert
    expect(act).toThrow();
  });
});

describe('assertResolvedAddressesSafeForOgFetch', () => {
  it('rejects loopback IPv4 literals', async () => {
    // Arrange
    const host = '127.0.0.1';

    // Act
    const promise = assertResolvedAddressesSafeForOgFetch(host);

    // Assert
    await expect(promise).rejects.toThrow('This URL is not allowed');
  });

  it('rejects loopback IPv6 literals', async () => {
    // Arrange
    const host = '::1';

    // Act
    const promise = assertResolvedAddressesSafeForOgFetch(host);

    // Assert
    await expect(promise).rejects.toThrow('This URL is not allowed');
  });

  it('rejects when DNS resolves to a private address', async () => {
    // Arrange
    const spy = spyOn(dns, 'lookup').mockImplementation(
      async () => [{ address: '10.0.0.1', family: 4 }],
    );
    const host = 'example.com';

    try {
      // Act
      const promise = assertResolvedAddressesSafeForOgFetch(host);

      // Assert
      await expect(promise).rejects.toThrow('This URL is not allowed');
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
    // Arrange
    const orig = globalThis.fetch;
    const startUrl = 'https://example.com/start';
    globalThis.fetch = async () =>
      new Response(null, {
        status: 302,
        headers: { Location: 'http://127.0.0.1/secret' },
      });

    try {
      // Act
      const promise = fetchOgPreview(startUrl);

      // Assert
      await expect(promise).rejects.toThrow('This URL is not allowed');
    } finally {
      globalThis.fetch = orig;
    }
  });

  it('stops after max redirects', async () => {
    // Arrange
    const orig = globalThis.fetch;
    const startUrl = 'https://example.com/start';
    let n = 0;
    globalThis.fetch = async () => {
      n += 1;
      return new Response(null, {
        status: 302,
        headers: { Location: `https://hop${n}.example/next` },
      });
    };

    try {
      // Act
      const promise = fetchOgPreview(startUrl);

      // Assert
      await expect(promise).rejects.toThrow('Too many redirects');
    } finally {
      globalThis.fetch = orig;
    }
  });
});
