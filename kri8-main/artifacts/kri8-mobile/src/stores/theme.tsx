import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createStorage } from '@/lib/kv';
import { getTheme, type Theme } from '@/themes';
import type { ThemeName } from '@/types';

// ── Persistent storage ────────────────────────────────────────
const storage = createStorage('kri8-theme');
const THEME_KEY = 'theme';

function getPersistedTheme(): ThemeName {
  const stored = storage.getString(THEME_KEY);
  return (stored as ThemeName | undefined) ?? 'midnight';
}

// ── Context ───────────────────────────────────────────────────
interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>(
    getPersistedTheme,
  );

  const setTheme = useCallback((name: ThemeName) => {
    storage.set(THEME_KEY, name);
    setThemeNameState(name);
  }, []);

  const theme = getTheme(themeName);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}

/** Convenience hook — just returns the active Theme object. */
export function useActiveTheme(): Theme {
  return useTheme().theme;
}
