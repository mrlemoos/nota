# Nota iPhone (mobile)

This is the React Native / Expo app for Nota on iPhone. **platform:mobile** — only platform:shared packages + RN/Clerk Expo glue.

## Auth (wired)

- ClerkProvider + Expo Router (`expo-router/entry`)
- Custom `tokenCache` implemented with `expo-secure-store` (AFTER_FIRST_UNLOCK, keychain)
- Minimal custom sign-in / sign-up screens (email+pw + Google SSO via `useSSO` + `useSignIn`/`useSignUp`; **no heavy Clerk UI components**)
- Deep links:
  - Auth callbacks: `nota://oauth-callback`
  - Internal notes: `nota://notes/:uuid` (powered by `@nota/internal-note-link`)
- Entitlement check on launch (and refresh) using `@nota/nota-server-client` → `fetchNotaProEntitled(base, Clerk JWT)`
- `MobileSessionProvider` + `useMobileSession()` provides unified state (see shape below)
- Protected routes + paywall:
  - Signed-out → `(auth)` group
  - Signed-in + entitled → `(main)` full vault (editor + future sync)
  - Signed-in + not entitled → `/paywall` (CTA opens web checkout in browser)

## Environment

Use `EXPO_PUBLIC_*` (never VITE\_\*):

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_NOTA_SERVER_API_URL=http://127.0.0.1:8787
```

Add to `.env` (Expo auto-loads `EXPO_PUBLIC_` vars) and to EAS / TestFlight config.

Clerk Dashboard must include `nota://oauth-callback` (and production scheme) in Allowed Redirects.

## Setup (after changes)

```bash
# From repo root
pnpm install

cd apps/nota-mobile
pnpm nx run @nota/nota-mobile:expo:start -- --ios --clear
```

Assets referenced in `app.json` (icon/splash) must exist for full builds (current skeleton only).

## Auth State Shape (MobileSessionContextValue)

```ts
{
  isLoaded: boolean;              // Clerk restored from SecureStore?
  isSignedIn: boolean;
  userId: string | null;
  user: { id: string; email: string | null } | null;

  notaProEntitled: boolean | null;  // null=undetermined; false=paywall; true=full vault
  isCheckingEntitlement: boolean;
  entitlementError: string | null;

  getAccessToken: () => Promise<string | null>;  // for nota-server-client
  refreshEntitlement: () => Promise<boolean>;
  signOut: () => Promise<void>;
}
```

On launch the provider automatically calls the server entitlement endpoint once a session is restored.

## Files added/changed for auth

(See final agent report for exhaustive list.)

## Platform

This app is **iOS + Android only** (no react-native-web / web support).

## Next (post auth)

- Real notes list + offline-core storage adapter for mobile
- Full editor parity in @nota/mobile-editor
- Sync drain using notes-offline-core + server client
- Push notifications (future skill)

See:

- `packages/mobile-editor/ARCHITECTURE.md`
- `.agents/skills/clerk-expo-patterns/`
- AGENTS.md (portable imports + EXPO*PUBLIC*\* rule)

## Running the app (monorepo)

Install from the **repo root** (hoisted `node_modules` + pnpm Metro overrides):

```bash
pnpm install
```

Then start the app:

```bash
cd apps/nota-mobile
pnpm dev
# or from the repo root:
pnpm exec nx dev @nota/nota-mobile
```

Do not run `npx expo` from the monorepo root — always use the app directory or Nx targets above.

If you change `polyfills.js` or `index.js`, restart Metro with `--clear` so the entry bundle is rebuilt.
