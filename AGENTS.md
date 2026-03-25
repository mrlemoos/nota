# Agent memory (nota.app)

## Workspace and stack

- Primary app is `apps/nota.app`: React Router 7 (SSR), Vite, React 19, Nx monorepo; UI primitives from `@/components/ui/*` (Base UI–backed shadcn-style) and semantic theme tokens (`bg-background`, `muted`, `foreground`, etc.)—avoid hard-coded light neutrals on `/notes` routes.
- Notes use Supabase Postgres with RLS; session auth via `@supabase/ssr` and HTTP cookies; data access through typed helpers in `app/models/notes.ts` rather than ad hoc queries in UI.
- TipTap edits run client-only; note body is stored as ProseMirror JSON in a `jsonb` column. The editor sync effect compares the `content` prop to the live document with ProseMirror `Node.fromJSON` + `doc.eq` (not `JSON.stringify`), since `jsonb` can reorder keys and a false diff would call `setContent` and move the caret. Also avoid pushing stale `content` into parent state after `updateNote`: the `.select()` row can lag local edits (typing during an in-flight body save, or a title save before the body debounce flushes), so merge the latest local body snapshot into the note passed to `onNoteUpdated` instead of trusting the returned row’s `content` alone.
- Public env for the app: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (anon key only); reference `apps/nota.app/.env.example`. SQL migrations live under `supabase/migrations/` at the repo root.

## TypeScript and generated types

- `apps/nota.app/tsconfig.app.json` uses `rootDir` `app` and includes patterns under `app/**`; files outside `app/` (e.g. `apps/nota.app/types/`) are not part of that project and break imports.
- Keep Supabase-generated `database.types.ts` at `apps/nota.app/app/types/database.types.ts` and aim `supabase gen types` output there.

## Supabase SSR server client

- `createServerClient` has a deprecated overload; implement the current cookie API: `getAll` / `setAll` typed as `CookieMethodsServer`, normalize `parseCookieHeader` entries so `value` is always a string (e.g. `value ?? ''`), and set cookies with `serializeCookieHeader` from `@supabase/ssr` instead of hand-rolled `Set-Cookie` strings.

## Notes UI and client state

- `/notes` uses a parent layout route with nested index and `:noteId` child routes.
- Sidebar open/closed is Zustand with `persist` to localStorage under the key `nota-notes-sidebar`.
- The `/notes` layout row fills the viewport (`h-dvh` with `min-h-0` on the shell, `aside`, and `main`); only `main` scrolls the document, and the sidebar note list scrolls inside its own `flex-1 min-h-0 overflow-y-auto` region so the window does not grow with note height. In Electron (`titleBarStyle: 'hiddenInset'` in `apps/nota-electron`), `useIsElectron()` (detects preload `window.nota` or UA; modern Electron often omits the Electron token from the UA) drives traffic-light clearance on `/notes`: sidebar header uses `pl-20` and safe-area top padding; when the sidebar is collapsed the expand control is `position: fixed` in a `min-h-[52px]` `items-center` strip (`pl-20`, safe-area `pt`) with `pointer-events-none` on the wrapper and `pointer-events-auto` on the button. `main` uses the same top padding whether the sidebar is open or closed so toggling does not shift scroll layout.
- There is no global top nav. My Notes, theme toggle, account email, and Sign Out live in the notes sidebar footer (`routes/notes.tsx`). When the inline document title scrolls out of the notes layout `main` (`overflow-auto`, not the window), a read-only centered title appears as a fixed overlay at the top of the viewport (`routes/notes.tsx`) driven by `app/context/sticky-doc-title.tsx` and an `IntersectionObserver` rooted on that `main`.
- `useStickyDocTitle` must not throw when `StickyDocTitleProvider` is missing (e.g. Vitest `createRoutesStub` without root `Layout`); use a no-op fallback so partial trees still render.
- Note list sidebar heading and the `/notes` empty-state title use serif (`font-serif` / Instrument Serif) with `tracking-normal`; the open note’s document title field stays sans.
- Note editor is a centered document column (no bordered card around TipTap); the inline title is a debounced, wrapping textarea with auto height (saved to DB `title`); empty display label matches `persistedDisplayTitle` in `app/lib/note-title.ts` (“Untitled Note”). Body autosave must update `content` only and must not overwrite `title` from the first paragraph of the editor.
- After successful client-side saves from `NoteEditor`, the note detail route should call React Router `revalidate()` (e.g. `useRevalidator`) so the parent `notes` layout loader refreshes sidebar titles and dates.
- Delete note: POST `/notes/:noteId` from the trash control on each sidebar row (with confirm) and from the Command Palette when that route is active—not from a control beside the document title.
- Command palette (`app/components/command-palette.tsx`) mounts from `app/signed-in-command-palette.tsx` in the root layout when a user session exists. Cmd/Ctrl+K opens it except when focus is in TipTap or other editable fields; it lists notes from the `/notes` layout loader to open one (navigate to `/notes/:noteId`), POSTs to `/notes` to create a note, to `/notes/:noteId` to delete the open note, and to `/logout` for sign out.
</think>


<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
TodoWrite

## Auth forms

- Login and signup server actions validate with Zod; shared schemas live under `app/lib/validation/auth.ts`.

## Testing

- Vitest for `nota.app` can use `apps/nota.app/tests/setup.ts` to set mock Supabase-related env for tests.
- Unit tests in `**/*.{spec,test}.{ts,tsx}` should follow the AAA pattern described in `.cursor/rules/aaa-testing-pattern.mdc`.
- `tests/og-preview.server.spec.ts` covers Open Graph HTML parsing and URL allowlisting for the link-preview endpoint.

## Learned User Preferences

- PDF attachments should live inline in the TipTap document (insert at the cursor as a `notePdf` block) rather than only in a separate footer panel.

## Learned Workspace Facts

- Per-note PDFs use Supabase Storage bucket `note-pdfs`, `note_attachments` rows, and a TipTap `notePdf` atom block in `notes.content` JSON (`attachmentId`, `filename`); RLS allows owners to update `note_attachments.filename` for display-name renames (double-click the label in the node view). Upload/rollback helpers live in `app/lib/pdf-attachment-client.ts`. Modal preview uses PDF.js in a lazy-loaded chunk (`pdf-js-modal-preview.tsx`); keep PDF.js off the eager import path for `note-pdf-extension.tsx` (use `React.lazy` and `Suspense`) or the extension can fail to load and `notePdf` nodes vanish from the document. Render the preview `<dialog>` with `createPortal` to `document.body`. `app/lib/pdf-preview-url.ts` adds `#toolbar=0&navpanes=0` for iframe fallback only when PDF.js fails.
- Link previews use an authenticated `GET /og-preview?url=` resource route and `app/lib/og-preview.server.ts` for server-side fetch and Open Graph parsing; the editor exposes a TipTap `linkPreview` block and debounced conversion of link-only paragraphs via `app/components/tiptap/link-preview-scan.ts`. If OG fetch fails or returns no usable title/description/image, revert to a normal paragraph with a link; the link mark uses `skipLinkPreview` so the scanner does not immediately re-promote the same URL and loop.
