# nota-server (Bun + Express)

Small API for **server-only** operations: Nota Pro entitlement (RevenueCat REST) and related routes. The web and desktop SPAs call this service when `VITE_NOTA_SERVER_API_URL` is set; otherwise they use same-origin `/api/*` on Vercel.

## Run locally

```bash
cd apps/nota-server
cp .env.example .env
# fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REVENUECAT_SECRET_API_KEY
bun install
bun run start
```

Set `NOTA_SERVER_CORS_ORIGINS` to include your production web origin and `http://127.0.0.1:4378` (packaged Electron) / `http://localhost:4200` (Vite dev) if the defaults are not enough.

## Auth

Clients send `Authorization: Bearer <Supabase access_token>`. The server validates the JWT with the Supabase service role client.

## Deploy

Run with Bun (or any Node-compatible runtime that supports the dependencies) behind HTTPS. Set the same environment variables as in `.env.example`. Point `VITE_NOTA_SERVER_API_URL` in the SPA build to this service’s public URL (no trailing slash).
