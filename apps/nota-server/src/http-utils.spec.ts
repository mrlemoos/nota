import { describe, it, expect } from 'bun:test';
import { expressToWebRequest } from './http-utils.ts';

describe('expressToWebRequest', () => {
  it('builds a Request from Express-like fields', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/nota-pro-entitled',
      url: '/api/nota-pro-entitled',
      headers: {
        host: '127.0.0.1:8787',
        authorization: 'Bearer test-token',
      },
    };
    const r = expressToWebRequest(req as never);
    expect(r.url).toBe('http://127.0.0.1:8787/api/nota-pro-entitled');
    expect(r.headers.get('authorization')).toBe('Bearer test-token');
  });
});
