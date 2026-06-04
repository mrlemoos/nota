import { useAuth, useUser, useClerk } from '@clerk/expo';
import { fetchNotaProEntitled } from '@nota/nota-server-client';
import { formatEntitlementNetworkError } from './entitlement-network-error';
import { resolveNotaServerBaseUrl } from './resolve-nota-server-base-url';
import {
  bindSupabaseAccessToken,
  resetSupabaseClient,
} from './supabase-client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface MobileUser {
  id: string;
  email: string | null;
}

export interface MobileSessionContextValue {
  /** Clerk has finished initial session restore from token cache. */
  isLoaded: boolean;
  /** Active signed-in session. */
  isSignedIn: boolean;
  /** Clerk user ID (when signed in). */
  userId: string | null;
  /** Minimal user profile (id + primary email). */
  user: MobileUser | null;

  /**
   * Nota Pro entitlement from server (via fetchNotaProEntitled + Clerk JWT).
   * null while determining (initial load or signed-in but check in flight).
   * false = paywall path; true = full offline vault + sync enabled.
   */
  notaProEntitled: boolean | null;

  /** True while actively calling the server entitlement endpoint. */
  isCheckingEntitlement: boolean;

  /** Last error message from entitlement fetch (cleared on success / signout). */
  entitlementError: string | null;

  /**
   * Returns a fresh Clerk session JWT (Bearer token) for @nota/nota-server-client calls.
   * Safe to call from anywhere under the provider.
   */
  getAccessToken: () => Promise<string | null>;

  /**
   * Force re-check of entitlement (e.g. after returning from web checkout).
   * Returns the new entitled value (or false on failure).
   */
  refreshEntitlement: () => Promise<boolean>;

  /** Sign out current user (clears session + entitlement state). */
  signOut: () => Promise<void>;
}

const MobileSessionContext = createContext<MobileSessionContextValue | null>(
  null,
);

const NOTA_SERVER_BASE_URL = resolveNotaServerBaseUrl(
  process.env.EXPO_PUBLIC_NOTA_SERVER_API_URL,
);

export interface MobileSessionProviderProps {
  children: ReactNode;
}

export function MobileSessionProvider({
  children,
}: MobileSessionProviderProps) {
  const { isLoaded: clerkLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const [notaProEntitled, setNotaProEntitled] = useState<boolean | null>(null);
  const [isCheckingEntitlement, setIsCheckingEntitlement] = useState(false);
  const [entitlementError, setEntitlementError] = useState<string | null>(null);

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      // Clerk getToken() returns the session JWT when signed in
      return await getTokenRef.current();
    } catch {
      return null;
    }
  }, []);

  const checkEntitlement = useCallback(async (): Promise<boolean> => {
    if (!isSignedIn || !userId) {
      setNotaProEntitled(null);
      setEntitlementError(null);
      return false;
    }

    const baseUrl = NOTA_SERVER_BASE_URL;
    if (!baseUrl) {
      // No server configured → treat as not entitled (drive to web)
      setNotaProEntitled(false);
      setEntitlementError('Nota server URL not configured');
      return false;
    }

    setIsCheckingEntitlement(true);
    setEntitlementError(null);

    try {
      const token = await getAccessToken();
      const response = await fetchNotaProEntitled(baseUrl, token);

      if (!response.ok) {
        // 401 etc → not entitled (or transient); surface false for paywall
        setNotaProEntitled(false);
        setEntitlementError('Entitlement check failed');
        return false;
      }

      const json = (await response.json()) as { entitled?: boolean };
      const entitled = json.entitled === true;

      setNotaProEntitled(entitled);
      return entitled;
    } catch (err) {
      setEntitlementError(formatEntitlementNetworkError(baseUrl, err));
      setNotaProEntitled(false);
      return false;
    } finally {
      setIsCheckingEntitlement(false);
    }
  }, [isSignedIn, userId, getAccessToken]);

  const refreshEntitlement = useCallback(async (): Promise<boolean> => {
    return checkEntitlement();
  }, [checkEntitlement]);

  const signOut = useCallback(async () => {
    setNotaProEntitled(null);
    setEntitlementError(null);
    setIsCheckingEntitlement(false);
    await clerkSignOut();
  }, [clerkSignOut]);

  useEffect(() => {
    if (isSignedIn && userId) {
      bindSupabaseAccessToken(getAccessToken);
    } else {
      resetSupabaseClient();
    }
  }, [isSignedIn, userId, getAccessToken]);

  // Primary effect: on Clerk session change, (re)check entitlement
  useEffect(() => {
    if (!clerkLoaded) {
      setNotaProEntitled(null);
      setIsCheckingEntitlement(false);
      setEntitlementError(null);
      return;
    }

    if (!isSignedIn || !userId) {
      setNotaProEntitled(null);
      setIsCheckingEntitlement(false);
      setEntitlementError(null);
      return;
    }

    // Signed in: kick off entitlement check (fire and forget is ok; state updated inside)
    void checkEntitlement();
  }, [clerkLoaded, isSignedIn, userId, checkEntitlement]);

  const memoUser = useMemo<MobileUser | null>(() => {
    if (!isSignedIn || !userId || !user) return null;
    const primaryEmail =
      user.primaryEmailAddress.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      null;
    return { id: userId, email: primaryEmail };
  }, [isSignedIn, userId, user]);

  const value = useMemo<MobileSessionContextValue>(
    () => ({
      isLoaded: clerkLoaded,
      isSignedIn: !!isSignedIn,
      userId: userId ?? null,
      user: memoUser,
      notaProEntitled,
      isCheckingEntitlement,
      entitlementError,
      getAccessToken,
      refreshEntitlement,
      signOut,
    }),
    [
      clerkLoaded,
      isSignedIn,
      userId,
      memoUser,
      notaProEntitled,
      isCheckingEntitlement,
      entitlementError,
      getAccessToken,
      refreshEntitlement,
      signOut,
    ],
  );

  return (
    <MobileSessionContext.Provider value={value}>
      {children}
    </MobileSessionContext.Provider>
  );
}

export function useMobileSession(): MobileSessionContextValue {
  const ctx = useContext(MobileSessionContext);
  if (!ctx) {
    throw new Error(
      'useMobileSession must be used within a MobileSessionProvider',
    );
  }
  return ctx;
}
