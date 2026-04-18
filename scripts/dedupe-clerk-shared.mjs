/**
 * `@clerk/elements` depends on `@clerk/shared@^3` while `@clerk/react` v6 uses `@clerk/shared@^4`.
 * npm installs nested copies under `@clerk/*`, so `@clerk/shared/react` and `ClerkProvider`
 * use different React contexts. Removing those installs makes resolution fall through to the
 * hoisted v4 package (same intent as `npm overrides`, which does not always collapse the tree).
 */
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nestedSharedPaths = [
  'node_modules/@clerk/elements/node_modules/@clerk/shared',
  'node_modules/@clerk/clerk-react/node_modules/@clerk/shared',
  'node_modules/@clerk/types/node_modules/@clerk/shared',
];
for (const rel of nestedSharedPaths) {
  const nested = path.join(root, rel);
  if (existsSync(nested)) {
    rmSync(nested, { recursive: true, force: true });
  }
}
