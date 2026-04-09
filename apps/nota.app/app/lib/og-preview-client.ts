import { getClerkAccessToken } from './clerk-token-ref';

export type OgPreviewJson = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
};

type OgErrorJson = {
  error: string;
};

function notaServerBase(): string | undefined {
  const b = import.meta.env.VITE_NOTA_SERVER_API_URL;
  if (typeof b !== 'string' || !b.trim()) {
    return undefined;
  }
  return b.replace(/\/$/, '');
}

/**
 * Fetches Open Graph metadata for link previews. Uses nota-server when
 * `VITE_NOTA_SERVER_API_URL` is set (Bearer auth); otherwise same-origin
 * `/api/og-preview` (Vite dev middleware or Electron bundle).
 */
export async function fetchOgPreviewForEditor(
  href: string,
): Promise<OgPreviewJson> {
  const q = `url=${encodeURIComponent(href)}`;
  const base = notaServerBase();

  let res: Response;
  if (base) {
    const token = await getClerkAccessToken();
    if (!token) {
      throw new Error('Unauthorized');
    }
    res = await fetch(`${base}/api/og-preview?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } else {
    res = await fetch(`/api/og-preview?${q}`, { credentials: 'same-origin' });
  }

  const data = (await res.json()) as OgPreviewJson | OgErrorJson;
  if (!res.ok) {
    const err = 'error' in data ? data.error : 'Request failed';
    throw new Error(err);
  }
  if ('error' in data) {
    throw new Error(data.error);
  }
  return data;
}
