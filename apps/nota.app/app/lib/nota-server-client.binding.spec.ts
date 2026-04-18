import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./clerk-token-ref', () => ({
  getClerkAccessToken: vi.fn(),
}));

vi.mock('@nota.app/nota-server-client', () => ({
  fetchNotaProEntitled: vi.fn(),
  postNotaProInvalidate: vi.fn(),
}));

describe('nota-server-client app binding', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('forwards env + Clerk token to package fetchNotaProEntitled', async () => {
    vi.stubEnv('VITE_NOTA_SERVER_API_URL', 'https://ns.example');
    vi.resetModules();
    const { getClerkAccessToken } = await import('./clerk-token-ref');
    const pkg = await import('@nota.app/nota-server-client');
    vi.mocked(getClerkAccessToken).mockResolvedValue('jwt');
    vi.mocked(pkg.fetchNotaProEntitled).mockResolvedValue(new Response());

    const { fetchNotaProEntitled } = await import('./nota-server-client');
    await fetchNotaProEntitled();

    expect(pkg.fetchNotaProEntitled).toHaveBeenCalledWith(
      'https://ns.example',
      'jwt',
    );
  });
});
