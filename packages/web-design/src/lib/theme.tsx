import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useOrThrow } from '@nota/helper-hooks';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  /** The children to render. */
  children: ReactNode;
  /**
   * The default theme to use if no theme is stored in localStorage (default: 'system').
   * @default 'system'
   */
  defaultTheme?: Theme;
  /**
   * The key to store the theme in localStorage (default: 'nota-ui-theme').
   * @default 'nota-ui-theme'
   */
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/** The context for the ThemeProvider. */
const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

/** The default key to store the theme in localStorage. */
const DEFAULT_STORAGE_KEY = 'nota-ui-theme';
/** The default theme to use if no theme is stored in localStorage. */
const DEFAULT_THEME = 'system' as const;

/**
 * A React component which provides the theme to the entire app.
 * There should be only **one** ThemeProvider in the app in the component tree.
 *
 * ## Usage
 *
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = DEFAULT_STORAGE_KEY,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeProviderContext
      {...props}
      value={useMemo(
        () => ({
          theme,
          setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
          },
        }),
        [theme, setTheme, storageKey],
      )}
    >
      {children}
    </ThemeProviderContext>
  );
}

export function useTheme() {
  return useOrThrow(
    ThemeProviderContext,
    'useTheme must be used within a ThemeProvider',
  );
}
