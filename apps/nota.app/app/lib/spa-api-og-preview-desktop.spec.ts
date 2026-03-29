import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spaApiOgPreviewDesktop } from './spa-api-og-preview-desktop';

vi.mock('./supabase/auth', () => ({
  getAuthUser: vi.fn(),
}));

vi.mock('./og-preview.server', () => ({
  fetchOgPreview: vi.fn(async () => ({
    url: 'https://example.com',
    title: 'Example',
    description: null,
    image: null,
  })),
}));

import { getAuthUser } from './supabase/auth';

describe('spaApiOgPreviewDesktop', () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockReset();
  });

  it('returns 401 when there is no signed-in user', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const r = await spaApiOgPreviewDesktop(
      new Request(
        'http://localhost/api/og-preview?url=https%3A%2F%2Fexample.com',
      ),
    );
    expect(r.status).toBe(401);
  });

  it('returns 400 when url query is missing', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'u1' } as never);
    const r = await spaApiOgPreviewDesktop(
      new Request('http://localhost/api/og-preview'),
    );
    expect(r.status).toBe(400);
  });

  it('returns 200 with preview JSON when signed in', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'u1' } as never);
    const r = await spaApiOgPreviewDesktop(
      new Request(
        'http://localhost/api/og-preview?url=https%3A%2F%2Fexample.com',
      ),
    );
    expect(r.status).toBe(200);
    const j = (await r.json()) as { title: string };
    expect(j.title).toBe('Example');
  });
});
