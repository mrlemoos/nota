export type ParsedRedditPost = {
  kind: 'post';
  subreddit: string;
  postId: string;
};

export type ParsedRedditSubreddit = {
  kind: 'subreddit';
  subreddit: string;
};

export type ParsedRedditUrl = ParsedRedditPost | ParsedRedditSubreddit;

const REDDIT_HOSTS = new Set([
  'reddit.com',
  'www.reddit.com',
  'old.reddit.com',
  'new.reddit.com',
  'redd.it',
]);

function normaliseRedditHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

/**
 * Classifies a Reddit URL as a post, subreddit homepage, or unsupported.
 */
export function parseRedditUrl(raw: string): ParsedRedditUrl | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = normaliseRedditHost(u.hostname);
  const isRedditHost =
    REDDIT_HOSTS.has(host) || u.hostname.toLowerCase().endsWith('.reddit.com');
  if (!isRedditHost) return null;

  if (host === 'redd.it') {
    const postId = u.pathname.replace(/^\//, '').split('/')[0];
    if (!postId) return null;
    return { kind: 'post', subreddit: '', postId };
  }

  const segments = u.pathname.split('/').filter(Boolean);
  if (segments[0] !== 'r' || !segments[1]) return null;

  const subreddit = segments[1];
  if (segments[2] === 'comments' && segments[3]) {
    const postId = segments[3];
    return { kind: 'post', subreddit, postId };
  }

  if (segments.length === 2) {
    return { kind: 'subreddit', subreddit };
  }

  if (segments[2] && segments[2] !== 'comments') {
    return { kind: 'subreddit', subreddit };
  }

  return null;
}

/** Canonical `.json` URL for a Reddit post (www host). */
export function redditPostJsonUrl(subreddit: string, postId: string): string {
  if (subreddit) {
    return `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/comments/${encodeURIComponent(postId)}.json?raw_json=1&limit=1`;
  }
  return `https://www.reddit.com/comments/${encodeURIComponent(postId)}.json?raw_json=1&limit=1`;
}

/** Whether the URL is any reddit.com / redd.it link we handle. */
export function isRedditUrl(raw: string): boolean {
  return parseRedditUrl(raw) !== null;
}
