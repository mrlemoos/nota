# Nota marketing site (Astro)

Static marketing pages: download links (GitHub Releases), pricing copy, and product screenshots. Screenshots live in [`src/assets/marketing/`](src/assets/marketing/) and are rendered with [`Image` from `astro:assets`](https://docs.astro.build/en/guides/images/) so the build emits optimised formats (e.g. WebP).

## Vercel

Create a **separate** project from the main app. Set **Root Directory** to `apps/nota-marketing`. The included `vercel.json` runs `npm ci` from the monorepo root and builds with Nx so workspace dependencies resolve. **Output directory:** `dist` (relative to the app root).

Requires **Node.js 22+** (see root `package.json` `engines`).

## Local

From the repository root:

```bash
npm install
npx nx run @nota.app/nota-marketing:dev
```

Or `npm run dev:marketing`.
