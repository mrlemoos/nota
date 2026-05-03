import { getUserIdFromBearer } from '../auth.ts';

type GitHubRelease = {
  tag_name?: string;
  name?: string | null;
  html_url?: string;
  body?: string | null;
  published_at?: string | null;
  draft?: boolean;
  prerelease?: boolean;
};

function readLimit(url: URL): number {
  const raw = url.searchParams.get('limit');
  if (!raw) {
    return 5;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return 5;
  }
  return Math.max(1, Math.min(20, Math.trunc(value)));
}

function githubRepo(): string {
  const raw = process.env.NOTA_GITHUB_REPO?.trim();
  if (!raw) {
    return 'mrlemoos/nota';
  }
  return raw;
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'nota-server',
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function releasesHandler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const userId = await getUserIdFromBearer(request);
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized', releases: [] },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const limit = readLimit(url);
  const repo = githubRepo();
  const ghUrl = `https://api.github.com/repos/${repo}/releases?per_page=${limit}`;

  const ghRes = await fetch(ghUrl, {
    method: 'GET',
    headers: githubHeaders(),
  });

  if (!ghRes.ok) {
    return Response.json(
      { error: 'Failed to load releases', releases: [] },
      { status: 502 },
    );
  }

  const data = (await ghRes.json()) as GitHubRelease[];
  const releases = data
    .filter((r) => !r.draft)
    .slice(0, limit)
    .map((r) => ({
      tagName: r.tag_name ?? '',
      title: r.name ?? r.tag_name ?? '',
      url: r.html_url ?? '',
      notes: r.body ?? '',
      publishedAt: r.published_at ?? null,
      prerelease: Boolean(r.prerelease),
    }));

  return Response.json({ releases });
}
