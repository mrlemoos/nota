/**
 * Creates a confirmed auth user for local / browser testing.
 *
 * Usage (from repo root):
 *   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret"
 *   npx tsx apps/nota.app/scripts/bootstrap-dev-user.ts [email] [password]
 *
 * Loads `VITE_SUPABASE_URL` from `apps/nota.app/.env` if present. Service role key must
 * be exported in the shell (never commit it). Dashboard → Project Settings → API.
 */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Database } from '../app/types/database.types';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));

function loadDotEnvFile(path: string) {
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    /* no .env */
  }
}

const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/nota.app/.env'),
  resolve(scriptDir, '../.env'),
];
for (const p of envCandidates) {
  if (existsSync(p)) {
    loadDotEnvFile(p);
    break;
  }
}

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email =
  process.argv[2] ?? `nota-dev-${Date.now()}@localhost.local`;
const password = process.argv[3] ?? 'DevBrowserVerify123!';

async function main() {
  if (!url) {
    console.error(
      'Missing VITE_SUPABASE_URL (add apps/nota.app/.env or export it).',
    );
    process.exit(1);
  }
  if (!serviceKey) {
    console.error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Export the service role key from Supabase Dashboard → Settings → API (server only), then re-run.',
    );
    process.exit(1);
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error('createUser failed:', error.message);
    process.exit(1);
  }

  console.log('Created confirmed user:');
  console.log('  email:', data.user?.email);
  console.log('  password:', password);
  console.log('\nSign in at http://localhost:4200/login with these credentials.');
}

main();
