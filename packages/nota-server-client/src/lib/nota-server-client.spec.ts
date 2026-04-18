import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchNotaProEntitled, postNotaProInvalidate } from './nota-server-client.js';

describe('@nota.app/nota-server-client', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetchNotaProEntitled returns 401 and does not fetch when base URL is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const res = await fetchNotaProEntitled('', null);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
      entitled: false,
    });
    fetchSpy.mockRestore();
  });

  it('postNotaProInvalidate returns 401 and does not fetch when base URL is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const res = await postNotaProInvalidate(undefined, 't');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false });
    fetchSpy.mockRestore();
  });

  it('fetchNotaProEntitled calls nota-server with Bearer when base and token are set', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ entitled: true })));

    await fetchNotaProEntitled('https://ns.example', 'session-jwt');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://ns.example/api/nota-pro-entitled',
      expect.objectContaining({
        headers: { Authorization: 'Bearer session-jwt' },
      }),
    );
    fetchSpy.mockRestore();
  });

  it('postNotaProInvalidate POSTs to nota-server with Bearer and strips trailing slash on base', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })));

    await postNotaProInvalidate('https://ns.example/', 't');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://ns.example/api/nota-pro-invalidate',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer t' },
      }),
    );
    fetchSpy.mockRestore();
  });

  it('fetchNotaProEntitled returns 401 without fetch when token is null', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const res = await fetchNotaProEntitled('https://ns.example', null);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: 'Unauthorized',
      entitled: false,
    });
    fetchSpy.mockRestore();
  });
});
