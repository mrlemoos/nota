import * as dns from 'node:dns/promises';
import * as net from 'node:net';
import { z } from 'zod';

const urlSchema = z.string().url();

const MAX_BODY_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 8_000;
/** Maximum redirect responses to follow (each hop re-validates URL + resolved IPs). */
const MAX_OG_FETCH_REDIRECTS = 8;

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export type OgPreviewResult = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
};

function isBlockedIpv4(hostname: string): boolean {
  const m = hostname.match(IPV4_RE);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  // CGNAT 100.64.0.0/10
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

/**
 * Blocks common private / non-public IPv6 literals (loopback, link-local, ULA).
 */
function isBlockedIpv6(ip: string): boolean {
  const s = ip.split('%')[0].toLowerCase();
  if (s === '::1') return true;
  // IPv4-mapped: ::ffff:127.0.0.1
  const idx = s.lastIndexOf('::ffff:');
  if (idx !== -1) {
    const v4 = s.slice(idx + '::ffff:'.length);
    if (net.isIPv4(v4)) return isBlockedIpv4(v4);
  }
  // fe80::/10 link-local
  if (/^fe[89ab][0-9a-f]{2}:/i.test(s)) return true;
  // fc00::/7 unique local (fc.. and fd..)
  if (/^f[cd][0-9a-f]{2}:/i.test(s)) return true;
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost') return true;
  if (h.endsWith('.local')) return true;

  if (net.isIPv4(h)) {
    return isBlockedIpv4(h);
  }
  if (net.isIPv6(h)) {
    return isBlockedIpv6(h);
  }

  const m = h.match(IPV4_RE);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

/**
 * Validates URL for server-side OG fetch (SSRF-hardening baseline).
 */
export function assertUrlSafeForOgFetch(raw: string): URL {
  const parsed = urlSchema.parse(raw);
  const u = new URL(parsed);

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed');
  }

  if (isBlockedHostname(u.hostname)) {
    throw new Error('This URL is not allowed');
  }

  return u;
}

function isBlockedResolvedAddress(address: string): boolean {
  if (net.isIPv4(address)) return isBlockedIpv4(address);
  if (net.isIPv6(address)) return isBlockedIpv6(address);
  return true;
}

/**
 * Rejects hostnames whose DNS (or literal IP) resolves to private/link-local/metadata-style ranges.
 * Call after {@link assertUrlSafeForOgFetch} passes for the same URL.
 */
export async function assertResolvedAddressesSafeForOgFetch(
  hostname: string,
): Promise<void> {
  const h = hostname.replace(/^\[|\]$/g, '');
  try {
    const results = await dns.lookup(h, { all: true, verbatim: true });
    for (const { address } of results) {
      if (isBlockedResolvedAddress(address)) {
        throw new Error('This URL is not allowed');
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'This URL is not allowed') throw e;
    throw new Error('Could not resolve host');
  }
}

function decodeMetaContent(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function matchOgOrMeta(html: string, property: string): string | null {
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const propFirst = new RegExp(
    `<meta[^>]*\\bproperty=["']${esc}["'][^>]*\\bcontent=["']([^"']*)["']`,
    'i',
  );
  const m1 = html.match(propFirst);
  if (m1?.[1]) return decodeMetaContent(m1[1].trim());

  const contentFirst = new RegExp(
    `<meta[^>]*\\bcontent=["']([^"']*)["'][^>]*\\bproperty=["']${esc}["']`,
    'i',
  );
  const m2 = html.match(contentFirst);
  if (m2?.[1]) return decodeMetaContent(m2[1].trim());

  return null;
}

function matchNameDescription(html: string): string | null {
  const re =
    /<meta[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["']/i;
  const m = html.match(re);
  if (m?.[1]) return decodeMetaContent(m[1].trim());
  const re2 =
    /<meta[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']description["']/i;
  const m2 = html.match(re2);
  if (m2?.[1]) return decodeMetaContent(m2[1].trim());
  return null;
}

function matchTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]{1,500})<\/title>/i);
  if (m?.[1]) return decodeMetaContent(m[1].trim());
  return null;
}

/** Only http(s) images are returned to clients (defence in depth for `<img src>`). */
export function sanitizeOgImageUrl(
  resolved: string,
  pageUrl: string,
): string | null {
  try {
    const abs = new URL(resolved, pageUrl).href;
    const u = new URL(abs);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return null;
    }
    return abs;
  } catch {
    return null;
  }
}

export function parseOgFromHtml(
  html: string,
  pageUrl: string,
): OgPreviewResult {
  const title = matchOgOrMeta(html, 'og:title') ?? matchTitleTag(html) ?? null;
  const description =
    matchOgOrMeta(html, 'og:description') ?? matchNameDescription(html) ?? null;
  let image = matchOgOrMeta(html, 'og:image');

  if (image) {
    image = sanitizeOgImageUrl(image, pageUrl);
  }

  return {
    url: pageUrl,
    title,
    description,
    image,
  };
}

async function readBodyWithCap(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return '';
  }

  const decoder = new TextDecoder();
  let total = 0;
  const chunks: Uint8Array[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > maxBytes) {
      const keep = value.length - (total - maxBytes);
      if (keep > 0) {
        chunks.push(value.slice(0, keep));
      }
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }

  reader.releaseLock?.();

  let out = '';
  for (const c of chunks) {
    out += decoder.decode(c, { stream: true });
  }
  out += decoder.decode();
  return out;
}

async function drainResponseBody(response: Response): Promise<void> {
  await response.body?.cancel();
}

export async function fetchOgPreview(rawUrl: string): Promise<OgPreviewResult> {
  let current = assertUrlSafeForOgFetch(rawUrl).href;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const fetchOpts = {
    signal: controller.signal,
    redirect: 'manual' as RequestRedirect,
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent':
        'NotaOgPreview/1.0 (+https://nota; link preview for signed-in users)',
    },
  };

  try {
    let redirectsFollowed = 0;

    for (;;) {
      const host = new URL(current).hostname;
      await assertResolvedAddressesSafeForOgFetch(host);

      const response = await fetch(current, fetchOpts);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        await drainResponseBody(response);
        if (!location) {
          throw new Error('Redirect without Location');
        }
        if (redirectsFollowed >= MAX_OG_FETCH_REDIRECTS) {
          throw new Error('Too many redirects');
        }
        const next = new URL(location, response.url);
        assertUrlSafeForOgFetch(next.href);
        current = next.href;
        redirectsFollowed += 1;
        continue;
      }

      if (!response.ok) {
        await drainResponseBody(response);
        throw new Error(`Fetch failed: ${response.status}`);
      }

      const ct = response.headers.get('content-type') ?? '';
      if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
        await drainResponseBody(response);
        return {
          url: current,
          title: null,
          description: null,
          image: null,
        };
      }

      const html = await readBodyWithCap(response, MAX_BODY_BYTES);
      return parseOgFromHtml(html, current);
    }
  } finally {
    clearTimeout(timer);
  }
}
