export {};

declare global {
  interface Window {
    /** Present when running inside the Nota Electron shell (preload). */
    nota?: Record<string, never>;
  }
}
