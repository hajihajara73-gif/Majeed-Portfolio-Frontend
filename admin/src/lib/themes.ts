/**
 * Admin colour themes.
 *
 * HOW THIS WORKS, AND WHY IT IS ONLY A DATA FILE.
 *
 * `styles.css` declares the admin's colours as CSS custom properties inside
 * Tailwind's `@theme` block, so every utility in the app — `text-ink`,
 * `bg-surface-2`, `border-gold` — compiles down to `var(--color-…)`.
 * Re-assigning those variables on `<html>` at runtime therefore restyles the
 * entire admin with no component changes and no rebuild. That is the whole
 * mechanism; there is nothing else to it.
 *
 * ADDING A THEME is adding one object to `THEMES` below. Nothing else needs
 * to change — the picker, persistence and the login screen all read from this
 * array. Keep `id` stable once shipped: it is what gets written to storage.
 *
 * A NOTE ON THE `accent` SLOT. The underlying variable is still called
 * `--color-gold`, because renaming it would mean touching every component
 * that uses `text-gold`. In this file it means "the accent colour", and in
 * most themes it is not gold. Same for `success`, which drives
 * `--color-forest-bright`.
 *
 * CONTRAST IS NOT OPTIONAL. `ink` on `bg` should stay near 15:1, `ink2` near
 * 9:1 and `muted` at least 4.5:1, in every theme. The admin is a tool that
 * gets read for long stretches, and a palette that looks striking in a picker
 * but cannot be read at 15px is a worse admin, not a prettier one. Light
 * themes must also keep `accent` dark enough that `bg`-coloured text sits on
 * it legibly — the primary button is `bg-gold text-bg`.
 */

/** Every colour a theme must define. No partial themes. */
export interface ThemePalette {
  /** Page background. */
  readonly bg: string
  /** Cards and the sidebar. */
  readonly surface: string
  /** Raised or hovered surfaces, and code blocks. */
  readonly surface2: string
  readonly border: string
  readonly borderStrong: string
  /** Primary text. */
  readonly ink: string
  /** Secondary text. */
  readonly ink2: string
  /** Tertiary text — labels, timestamps. Still must clear 4.5:1. */
  readonly muted: string
  /** The accent. Drives `--color-gold`; rarely actually gold. */
  readonly accent: string
  /** A lighter accent, for hover on accent-filled controls. */
  readonly accentSoft: string
  /** Positive state. Drives `--color-forest-bright`. */
  readonly success: string
  readonly danger: string
}

export interface Theme {
  /** Stable storage key. Never change one that has shipped. */
  readonly id: string
  readonly name: string
  /** Groups the picker renders under. */
  readonly group: 'Dark' | 'Light'
  /**
   * Drives the CSS `color-scheme` property, which is what makes native
   * scrollbars, form controls and the caret match the theme. Getting this
   * wrong gives a light page white-on-white scrollbars.
   */
  readonly scheme: 'dark' | 'light'
  readonly palette: ThemePalette
}

/** Hairlines, as a fraction of the foreground. Keeps the themes terse. */
const darkEdges = {
  border: 'rgb(255 255 255 / 0.10)',
  borderStrong: 'rgb(255 255 255 / 0.20)',
} as const
const lightEdges = {
  border: 'rgb(0 0 0 / 0.12)',
  borderStrong: 'rgb(0 0 0 / 0.22)',
} as const

export const THEMES: readonly Theme[] = [
  /* ---------------------------------------------------------------- Dark */
  {
    // The original admin palette, and still the default: it matches the
    // public site's charcoal, forest and gold.
    id: 'forest-gold',
    name: 'Forest & Gold',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#0d1211',
      surface: '#141a18',
      surface2: '#1b2320',
      ...darkEdges,
      ink: '#f2efe7',
      ink2: '#c2bcae',
      muted: '#8b8579',
      accent: '#d9a855',
      accentSoft: '#ebc98d',
      success: '#4e9070',
      danger: '#d97a63',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#0b1020',
      surface: '#121a2e',
      surface2: '#1b2540',
      ...darkEdges,
      ink: '#e8ecf6',
      ink2: '#b2bcd4',
      muted: '#8793ad',
      accent: '#6ea8fe',
      accentSoft: '#a7c9ff',
      success: '#4ec49a',
      danger: '#e2768a',
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#101010',
      surface: '#181818',
      surface2: '#232323',
      ...darkEdges,
      ink: '#f0efed',
      ink2: '#bdbab4',
      muted: '#908d86',
      accent: '#e0a93f',
      accentSoft: '#f0cc85',
      success: '#5aa06f',
      danger: '#d9705e',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#0e1417',
      surface: '#161e22',
      surface2: '#1f2a2f',
      ...darkEdges,
      ink: '#ecf1f3',
      ink2: '#b6c2c8',
      muted: '#8b989f',
      accent: '#4fb6c4',
      accentSoft: '#93d7e0',
      success: '#58ab82',
      danger: '#dd7a70',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#140e0b',
      surface: '#1d1511',
      surface2: '#281d17',
      ...darkEdges,
      ink: '#f6ece4',
      ink2: '#cdb9ab',
      muted: '#a08d81',
      accent: '#e8743c',
      accentSoft: '#f5a878',
      success: '#68a06a',
      danger: '#e4675f',
    },
  },
  {
    id: 'pine',
    name: 'Pine',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#08140f',
      surface: '#0f1e18',
      surface2: '#162a22',
      ...darkEdges,
      ink: '#e7f3ed',
      ink2: '#aec4ba',
      muted: '#849b92',
      accent: '#3fbf92',
      accentSoft: '#86dcbb',
      success: '#4fae84',
      danger: '#df7a6c',
    },
  },
  {
    id: 'plum',
    name: 'Plum',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#120e16',
      surface: '#1a141f',
      surface2: '#241c2b',
      ...darkEdges,
      ink: '#f0eaf3',
      ink2: '#c1b4c9',
      muted: '#978aa1',
      accent: '#b587d6',
      accentSoft: '#d3b4e8',
      success: '#5aa884',
      danger: '#dd7389',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#2e3440',
      surface: '#3b4252',
      surface2: '#434c5e',
      ...darkEdges,
      ink: '#eceff4',
      ink2: '#d8dee9',
      muted: '#a6b1c2',
      accent: '#88c0d0',
      accentSoft: '#a9d4e0',
      success: '#a3be8c',
      danger: '#bf616a',
    },
  },
  {
    id: 'orchid',
    name: 'Orchid',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#1e1f29',
      surface: '#282a36',
      surface2: '#343746',
      ...darkEdges,
      ink: '#f8f8f2',
      ink2: '#c8cad8',
      muted: '#9a9db0',
      accent: '#bd93f9',
      accentSoft: '#d7b9ff',
      success: '#5fc98a',
      danger: '#e46b6b',
    },
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#002b36',
      surface: '#073642',
      surface2: '#0e4654',
      ...darkEdges,
      ink: '#eee8d5',
      ink2: '#93a1a1',
      muted: '#8b9b9b',
      accent: '#cb9b1b',
      accentSoft: '#e0b951',
      success: '#859900',
      danger: '#dc322f',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#130d0f',
      surface: '#1c1316',
      surface2: '#271a1f',
      ...darkEdges,
      ink: '#f5e9ec',
      ink2: '#ccb3ba',
      muted: '#a08a92',
      accent: '#e05d75',
      accentSoft: '#f2909f',
      success: '#5ea57f',
      danger: '#ef8b5f',
    },
  },
  {
    id: 'sandstone',
    name: 'Sandstone',
    group: 'Dark',
    scheme: 'dark',
    palette: {
      bg: '#14110c',
      surface: '#1d1912',
      surface2: '#29231a',
      ...darkEdges,
      ink: '#f4eee2',
      ink2: '#ccc1ab',
      muted: '#9e937f',
      accent: '#d3ab31',
      accentSoft: '#e8cb6d',
      success: '#6fa06a',
      danger: '#d9705e',
    },
  },

  /* --------------------------------------------------------------- Light */
  {
    id: 'paper',
    name: 'Paper',
    group: 'Light',
    scheme: 'light',
    palette: {
      bg: '#faf8f3',
      surface: '#ffffff',
      surface2: '#f1ede4',
      ...lightEdges,
      ink: '#1c1a16',
      ink2: '#4a453c',
      muted: '#6b6558',
      accent: '#8a6d1f',
      accentSoft: '#a98a35',
      success: '#2f6b4a',
      danger: '#a33a28',
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    group: 'Light',
    scheme: 'light',
    palette: {
      bg: '#fdf6e3',
      surface: '#fffdf6',
      surface2: '#eee8d5',
      ...lightEdges,
      ink: '#073642',
      ink2: '#45606a',
      muted: '#5f7780',
      accent: '#96700a',
      accentSoft: '#b58900',
      success: '#5a6b00',
      danger: '#c0392b',
    },
  },
  {
    id: 'frost',
    name: 'Frost',
    group: 'Light',
    scheme: 'light',
    palette: {
      bg: '#f6f9fc',
      surface: '#ffffff',
      surface2: '#e9eff6',
      ...lightEdges,
      ink: '#10232e',
      ink2: '#3f5666',
      muted: '#5e7585',
      accent: '#1d6fa3',
      accentSoft: '#2e8cc4',
      success: '#2c7a5a',
      danger: '#b03f36',
    },
  },
  {
    id: 'linen',
    name: 'Linen',
    group: 'Light',
    scheme: 'light',
    palette: {
      bg: '#f7f3ee',
      surface: '#fffdfa',
      surface2: '#ece5db',
      ...lightEdges,
      ink: '#221c15',
      ink2: '#4f463a',
      muted: '#6f6558',
      accent: '#9a5a28',
      accentSoft: '#bd7540',
      success: '#39704f',
      danger: '#a63a2c',
    },
  },
]

export const DEFAULT_THEME_ID = 'forest-gold'

export const themeById = (id: string): Theme =>
  THEMES.find((theme) => theme.id === id) ??
  THEMES.find((theme) => theme.id === DEFAULT_THEME_ID)!

/**
 * The palette-to-variable mapping.
 *
 * The only place that knows which palette key feeds which CSS variable. The
 * variable names come from `styles.css` and must match it exactly.
 */
const VARIABLES: ReadonlyArray<readonly [keyof ThemePalette, string]> = [
  ['bg', '--color-bg'],
  ['surface', '--color-surface'],
  ['surface2', '--color-surface-2'],
  ['border', '--color-border'],
  ['borderStrong', '--color-border-strong'],
  ['ink', '--color-ink'],
  ['ink2', '--color-ink-2'],
  ['muted', '--color-muted'],
  ['accent', '--color-gold'],
  ['accentSoft', '--color-gold-soft'],
  ['success', '--color-forest-bright'],
  ['success', '--color-forest'],
  ['danger', '--color-danger'],
]

/** A six-digit hex colour. Anything else is rejected rather than injected. */
export const isHexColour = (value: string): boolean =>
  /^#[0-9a-fA-F]{6}$/.test(value)

/**
 * Paint a theme onto the document.
 *
 * `accentOverride` is the custom-colour feature: any theme can have its
 * accent replaced without becoming a separate theme. It is validated as a hex
 * colour first — the value reaches `style.setProperty`, and unvalidated input
 * in a CSS property is not somewhere to be relaxed about.
 */
export function applyTheme(theme: Theme, accentOverride?: string | null): void {
  const root = document.documentElement
  const accent =
    accentOverride && isHexColour(accentOverride) ? accentOverride : null

  for (const [key, variable] of VARIABLES) {
    const value =
      accent && (key === 'accent' || key === 'accentSoft')
        ? // The soft accent is only used for hover, so reusing the override
          // for both is a flat hover rather than a wrong colour.
          accent
        : theme.palette[key]
    root.style.setProperty(variable, value)
  }

  root.style.colorScheme = theme.scheme
  root.dataset.theme = theme.id
}
