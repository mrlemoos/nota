import type { PlatformLinkPreview } from '@getmadrid/link-platform-preview';
import { appApiGrab } from '@getmadrid/data-source/app-api-grab';
import { grabErrorBody } from '@getmadrid/data-source/grab-error';

export type OgPreviewJson = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  platform: PlatformLinkPreview | null;
};

type OgErrorJson = {
  error: string;
};

/**
 * Fetches Open Graph metadata for link previews via the same-origin Next route
 * `GET /api/og-preview` (Clerk session cookie auth). Entitled users only.
 */
export async function fetchOgPreviewForEditor(
  href: string,
): Promise<OgPreviewJson> {
  const q = `url=${encodeURIComponent(href)}`;
  const [data, error] = await appApiGrab()<OgPreviewJson | OgErrorJson>(
    `GET /api/og-preview?${q}`,
  );

  if (error) {
    // The route answers `{ error }` on 400; grabkit parks that body on the error.
    const body = grabErrorBody(error);
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? (body as OgErrorJson).error
        : 'Request failed';
    throw new Error(message);
  }
  if ('error' in data) {
    throw new Error(data.error);
  }
  return data;
}
