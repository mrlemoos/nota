import {
  ENTITLEMENT_NOTA_PRO,
  ENTITLEMENT_NOTA_PRO_REST_ID,
  NOTA_PRO_WEB_PRODUCT_IDS,
} from './constants';

const REVENUECAT_V1_BASE = 'https://api.revenuecat.com/v1';

const entitlementCache = new Map<
  string,
  { expiresAtMs: number; entitled: boolean }
>();

/** Default TTL; cleared on explicit invalidation after purchase. */
const CACHE_TTL_MS = 60_000;

export function getRevenueCatSecretApiKey(): string | undefined {
  const k = process.env.REVENUECAT_SECRET_API_KEY;
  return typeof k === 'string' && k.trim().length > 0 ? k.trim() : undefined;
}

type RcEntitlementEntry = {
  expires_date?: string | null;
  product_identifier?: string | null;
};

type RcSubscriptionEntry = {
  expires_date?: string | null;
};

type RcSubscriberJson = {
  subscriber?: {
    entitlements?: Record<string, RcEntitlementEntry>;
    subscriptions?: Record<string, RcSubscriptionEntry>;
  };
};

const notaProProductIdSet = new Set(
  NOTA_PRO_WEB_PRODUCT_IDS.map((id) => id.toLowerCase()),
);

function notaProProductMatch(id: string | null | undefined): boolean {
  if (typeof id !== 'string' || !id.trim()) {
    return false;
  }
  return notaProProductIdSet.has(id.trim().toLowerCase());
}

function subscriberHasActiveNotaProSubscription(
  subscriptions: Record<string, RcSubscriptionEntry> | undefined,
): boolean {
  if (!subscriptions) {
    return false;
  }
  for (const [productId, entry] of Object.entries(subscriptions)) {
    if (!notaProProductMatch(productId)) {
      continue;
    }
    if (isRcEntitlementEntryActive(entry)) {
      return true;
    }
  }
  return false;
}

/** Handles renamed entitlement identifiers if `product_identifier` still matches a Nota Pro web product. */
function subscriberHasActiveNotaProEntitlementByProduct(
  entitlements: Record<string, RcEntitlementEntry> | undefined,
): boolean {
  if (!entitlements) {
    return false;
  }
  for (const entry of Object.values(entitlements)) {
    if (!notaProProductMatch(entry?.product_identifier ?? undefined)) {
      continue;
    }
    if (isRcEntitlementEntryActive(entry)) {
      return true;
    }
  }
  return false;
}

function pickNotaProEntitlementEntry(
  entitlements: Record<string, RcEntitlementEntry> | undefined,
): RcEntitlementEntry | undefined {
  if (!entitlements) {
    return undefined;
  }
  return (
    entitlements[ENTITLEMENT_NOTA_PRO_REST_ID] ??
    entitlements[ENTITLEMENT_NOTA_PRO]
  );
}

/**
 * Parses RevenueCat REST v1 `GET /v1/subscribers/{app_user_id}` JSON.
 * @see https://www.revenuecat.com/docs/api-v1#get-subscriber
 */
export function subscriberJsonHasActiveNotaPro(json: unknown): boolean {
  if (!json || typeof json !== 'object') {
    return false;
  }
  const subscriber = (json as RcSubscriberJson).subscriber;
  const entitlements = subscriber?.entitlements;
  const entry = pickNotaProEntitlementEntry(entitlements);
  if (entry && isRcEntitlementEntryActive(entry)) {
    return true;
  }
  if (subscriberHasActiveNotaProEntitlementByProduct(entitlements)) {
    return true;
  }
  if (subscriberHasActiveNotaProSubscription(subscriber?.subscriptions)) {
    return true;
  }
  return false;
}

function isRcEntitlementEntryActive(
  entry: RcEntitlementEntry | RcSubscriptionEntry,
): boolean {
  const raw = entry.expires_date;
  if (raw === null || raw === undefined) {
    return true;
  }
  if (typeof raw !== 'string') {
    return false;
  }
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'none') {
    return true;
  }
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) {
    return false;
  }
  return ms > Date.now();
}

export function invalidateServerNotaProCache(appUserId: string): void {
  entitlementCache.delete(appUserId);
}

/**
 * Whether the subscriber has an active Nota Pro entitlement (server truth).
 * Fail closed if the secret is missing, the request fails, or RevenueCat returns an error.
 */
export async function getServerNotaProEntitled(
  appUserId: string,
): Promise<boolean> {
  const secret = getRevenueCatSecretApiKey();
  if (!secret) {
    return false;
  }

  const now = Date.now();
  const cached = entitlementCache.get(appUserId);
  if (cached && cached.expiresAtMs > now) {
    return cached.entitled;
  }

  const url = `${REVENUECAT_V1_BASE}/subscribers/${encodeURIComponent(appUserId)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: 'application/json',
      },
    });
  } catch {
    return false;
  }

  if (res.status === 404) {
    entitlementCache.set(appUserId, {
      expiresAtMs: now + CACHE_TTL_MS,
      entitled: false,
    });
    return false;
  }

  if (!res.ok) {
    return false;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return false;
  }

  const entitled = subscriberJsonHasActiveNotaPro(json);
  entitlementCache.set(appUserId, {
    expiresAtMs: now + CACHE_TTL_MS,
    entitled,
  });
  return entitled;
}
