import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_THEME_ID,
  applyTheme,
  isHexColour,
  themeById,
  type Theme,
} from '@/lib/themes'

/**
 * Theme state.
 *
 * Stored in `localStorage`, not on the server, for two reasons. It has to work
 * on the LOGIN screen, where there is no session to hang a preference on. And
 * it is a per-device preference — the same person on a laptop and a phone may
 * reasonably want different ones. Nothing here is content, so none of it
 * belongs in the CMS database.
 *
 * Every storage access is wrapped: `localStorage` throws outright in some
 * privacy modes, and a colour preference must never be the thing that stops
 * the admin loading.
 */

const THEME_KEY = 'mj-admin-theme'
const ACCENT_KEY = 'mj-admin-accent'

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null): void => {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // A preference that cannot be saved is a preference that lasts one
    // session. That is an acceptable outcome; throwing here is not.
  }
}

const storedThemeId = (): string => read(THEME_KEY) ?? DEFAULT_THEME_ID
const storedAccent = (): string | null => {
  const value = read(ACCENT_KEY)
  return value && isHexColour(value) ? value : null
}

/**
 * Paint the stored theme before React mounts.
 *
 * Called from `main.tsx`. Without it the app renders one frame in the CSS
 * file's default palette and then snaps to the stored one — a visible flash
 * on every load for anyone not using the default.
 */
export function initTheme(): void {
  applyTheme(themeById(storedThemeId()), storedAccent())
}

interface ThemeState {
  theme: Theme
  /** The custom accent overriding the theme's own, or null. */
  accent: string | null
  setThemeId: (id: string) => void
  setAccent: (hex: string | null) => void
  reset: () => void
}

const ThemeContext = createContext<ThemeState | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(storedThemeId)
  const [accent, setAccentState] = useState<string | null>(storedAccent)

  const theme = useMemo(() => themeById(themeId), [themeId])

  useEffect(() => {
    applyTheme(theme, accent)
  }, [theme, accent])

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id)
    write(THEME_KEY, id)
  }, [])

  const setAccent = useCallback((hex: string | null) => {
    const next = hex && isHexColour(hex) ? hex : null
    setAccentState(next)
    write(ACCENT_KEY, next)
  }, [])

  const reset = useCallback(() => {
    setThemeIdState(DEFAULT_THEME_ID)
    setAccentState(null)
    write(THEME_KEY, null)
    write(ACCENT_KEY, null)
  }, [])

  const value = useMemo(
    () => ({ theme, accent, setThemeId, setAccent, reset }),
    [theme, accent, setThemeId, setAccent, reset],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeState {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
