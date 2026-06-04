import Constants from 'expo-constants';

function normaliseBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

/**
 * Metro / Expo dev host (e.g. `192.168.1.192` from `hostUri`), used to reach the Mac
 * from a physical device. Simulator can use loopback; devices cannot use `127.0.0.1`.
 */
function getDevMachineHost(): string | null {
  const raw =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost;
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  const withoutScheme = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const hostPort = withoutScheme.split('/')[0] ?? '';
  const host = hostPort.split(':')[0] ?? '';
  if (!host || host === 'localhost') {
    return null;
  }
  return host;
}

/**
 * Resolves `EXPO_PUBLIC_NOTA_SERVER_API_URL` for the current runtime.
 * In dev, rewrites loopback hosts to the Metro machine IP when available (physical device).
 */
export function resolveNotaServerBaseUrl(
  envUrl: string | undefined,
): string | undefined {
  if (typeof envUrl !== 'string' || !envUrl.trim()) {
    return undefined;
  }

  const base = normaliseBaseUrl(envUrl);

  if (!__DEV__) {
    return base;
  }

  try {
    const parsed = new URL(base);
    const isLoopback =
      parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
    const devHost = getDevMachineHost();

    if (
      isLoopback &&
      devHost &&
      devHost !== parsed.hostname &&
      devHost !== '127.0.0.1' &&
      devHost !== 'localhost'
    ) {
      parsed.hostname = devHost;
      return normaliseBaseUrl(parsed.toString());
    }
  } catch {
    return base;
  }

  return base;
}
