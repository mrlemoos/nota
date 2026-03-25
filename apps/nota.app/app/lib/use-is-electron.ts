import { useLayoutEffect, useState } from 'react';

export function useIsElectron() {
  const [isElectron, setIsElectron] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    // Prefer the Nota preload bridge; recent Electron builds often omit "Electron" from the UA.
    const hasShellBridge = typeof window.nota !== 'undefined';
    const uaSaysElectron = navigator.userAgent
      .toLowerCase()
      .includes('electron');
    setIsElectron(hasShellBridge || uaSaysElectron);
  }, []);

  return isElectron;
}
