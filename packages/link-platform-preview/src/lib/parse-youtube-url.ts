export type ParsedYoutubeVideo = {
  kind: 'video';
  videoId: string;
};

export type ParsedYoutubeChannel = {
  kind: 'channel';
};

export type ParsedYoutubeUrl = ParsedYoutubeVideo | ParsedYoutubeChannel;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
]);

function normaliseYoutubeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

function isYoutubeHost(hostname: string): boolean {
  const h = normaliseYoutubeHost(hostname);
  return YOUTUBE_HOSTS.has(h) || h.endsWith('.youtube.com');
}

/**
 * Classifies a YouTube URL as a watchable video or a channel / playlist surface.
 */
export function parseYoutubeUrl(raw: string): ParsedYoutubeUrl | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (!isYoutubeHost(u.hostname)) return null;

  const host = normaliseYoutubeHost(u.hostname);
  const path = u.pathname;

  if (host === 'youtu.be') {
    const videoId = path.replace(/^\//, '').split('/')[0];
    if (videoId) return { kind: 'video', videoId };
    return null;
  }

  if (path === '/watch' || path.startsWith('/watch/')) {
    const v = u.searchParams.get('v');
    if (v) return { kind: 'video', videoId: v };
    return null;
  }

  if (path.startsWith('/shorts/')) {
    const videoId = path.split('/')[2];
    if (videoId) return { kind: 'video', videoId };
    return null;
  }

  if (path.startsWith('/embed/')) {
    const videoId = path.split('/')[2];
    if (videoId) return { kind: 'video', videoId };
    return null;
  }

  if (path.startsWith('/live/')) {
    const videoId = path.split('/')[2];
    if (videoId) return { kind: 'video', videoId };
    return null;
  }

  if (
    path.startsWith('/@') ||
    path.startsWith('/channel/') ||
    path.startsWith('/c/') ||
    path.startsWith('/user/')
  ) {
    return { kind: 'channel' };
  }

  if (
    path.startsWith('/playlist') ||
    path === '/feed' ||
    path.startsWith('/feed/')
  ) {
    return { kind: 'channel' };
  }

  return null;
}

/** Whether the URL is a YouTube link we handle. */
export function isYoutubeUrl(raw: string): boolean {
  return parseYoutubeUrl(raw) !== null;
}
