export type ParsedWikipediaArticle = {
  kind: 'article';
  lang: string;
  /** Path segment after `/wiki/` (may include percent-encoding). */
  titleSlug: string;
};

const WIKIPEDIA_ROOT_HOSTS = new Set(['wikipedia.org', 'www.wikipedia.org']);

const NON_ARTICLE_TITLE_PREFIXES = [
  'Special:',
  'Talk:',
  'User:',
  'User_talk:',
  'Wikipedia:',
  'Wikipedia_talk:',
  'File:',
  'File_talk:',
  'MediaWiki:',
  'MediaWiki_talk:',
  'Template:',
  'Template_talk:',
  'Help:',
  'Help_talk:',
  'Category:',
  'Category_talk:',
  'Portal:',
  'Portal_talk:',
  'Draft:',
  'Draft_talk:',
  'Book:',
  'Book_talk:',
  'Module:',
  'Module_talk:',
];

function normaliseHost(hostname: string): string {
  return hostname.toLowerCase();
}

function parseWikipediaLang(hostname: string): string | null {
  const h = normaliseHost(hostname);
  if (WIKIPEDIA_ROOT_HOSTS.has(h)) {
    return 'en';
  }

  const match = h.match(/^([a-z-]+)(?:\.m)?\.wikipedia\.org$/);
  return match?.[1] ?? null;
}

function isNonArticleTitle(titleSlug: string): boolean {
  let decoded = titleSlug;
  try {
    decoded = decodeURIComponent(titleSlug);
  } catch {
    decoded = titleSlug;
  }
  decoded = decoded.replace(/_/g, ' ');
  return NON_ARTICLE_TITLE_PREFIXES.some((prefix) =>
    decoded.startsWith(prefix),
  );
}

function titleSlugFromIndexTitle(title: string): string {
  return title.trim().replace(/ /g, '_');
}

function extractArticleTitleSlug(u: URL): string | null {
  if (u.pathname.startsWith('/wiki/')) {
    const slug = u.pathname.slice('/wiki/'.length).split('/')[0];
    if (!slug || isNonArticleTitle(slug)) return null;
    return slug;
  }

  if (u.pathname === '/w/index.php' || u.pathname.endsWith('/w/index.php')) {
    const title = u.searchParams.get('title');
    if (!title?.trim()) return null;
    const slug = titleSlugFromIndexTitle(title);
    if (isNonArticleTitle(slug)) return null;
    return slug;
  }

  return null;
}

/**
 * Classifies a Wikipedia URL as an article page we can preview.
 */
export function parseWikipediaUrl(raw: string): ParsedWikipediaArticle | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  const lang = parseWikipediaLang(u.hostname);
  if (!lang) return null;

  const titleSlug = extractArticleTitleSlug(u);
  if (!titleSlug) return null;

  return { kind: 'article', lang, titleSlug };
}

/** Human-readable article title from a Wikipedia URL slug. */
export function wikipediaTitleFromSlug(titleSlug: string): string {
  let decoded = titleSlug;
  try {
    decoded = decodeURIComponent(titleSlug);
  } catch {
    decoded = titleSlug;
  }
  return decoded.replace(/_/g, ' ').trim();
}

/** Canonical REST summary URL for a Wikipedia article. */
export function wikipediaSummaryApiUrl(
  lang: string,
  titleSlug: string,
): string {
  const slug = titleSlug.split('/')[0];
  return `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`;
}

/** Whether the URL is a Wikipedia article link we handle. */
export function isWikipediaArticleUrl(raw: string): boolean {
  return parseWikipediaUrl(raw) !== null;
}
