import grabkit from 'grabkit';
import { requireUserId } from '@/server/route-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const value = raw ? Number(raw) : Number.NaN;
  if (!Number.isFinite(value)) {
    return 5;
  }
  return Math.max(1, Math.min(20, Math.trunc(value)));
}

/** Per-upstream grabkit factory. GitHub is plain JSON, not JSON:API. */
const githubGrab = grabkit('https://api.github.com', { format: 'json' });

/** Built per request: `GITHUB_TOKEN` is read from the environment at call time. */
function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'nota',
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** GET /api/releases?limit= — recent GitHub release notes. Signed-in only. */
export async function GET(request: Request): Promise<Response> {
  const gate = await requireUserId();
  if (gate instanceof Response) {
    return Response.json(
      { error: 'Unauthorized', releases: [] },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const limit = readLimit(url);
  const repo = process.env.NOTA_GITHUB_REPO?.trim() || 'mrlemoos/madrid';

  const [data, error] = await githubGrab<GitHubRelease[]>(
    `GET /repos/${repo}/releases?per_page=${String(limit)}`,
    { headers: githubHeaders() },
  );
  if (error) {
    return Response.json(
      { error: 'Failed to load releases', releases: [] },
      { status: 502 },
    );
  }

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
