import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme'
import { THEMES, type Theme } from '@/lib/themes'
import { Button, cn } from '@/components/ui'

/**
 * Theme switcher.
 *
 * Used in two places with no session between them — the admin sidebar and the
 * login screen — so it depends on nothing but `useTheme`, which is backed by
 * `localStorage` rather than the API.
 *
 * Each swatch previews itself with inline styles taken from its own palette
 * rather than from the active theme's CSS variables. That is deliberate: a
 * swatch has to show the theme it *offers*, not the one currently applied.
 * It is the one place in the admin where a literal colour in a component is
 * correct, because here the colour IS the content.
 */

function Swatch({ theme, active }: { theme: Theme; active: boolean }) {
  const { bg, surface, accent, ink } = theme.palette
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border',
        active ? 'border-gold' : 'border-border-strong',
      )}
      style={{ backgroundColor: bg }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-[3px]"
        style={{ backgroundColor: surface }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 0 1px ${ink}22` }}
        />
      </span>
    </span>
  )
}

export function ThemePicker({
  align = 'left',
  placement = 'top',
}: {
  align?: 'left' | 'right'
  /**
   * Which way the popover opens. `top` suits the sidebar, where the trigger
   * sits at the bottom of the viewport; `bottom` suits the login screen,
   * where opening upward would cover the form the person came to fill in.
   */
  placement?: 'top' | 'bottom'
}) {
  const { theme, accent, setThemeId, setAccent, reset } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click and on Escape — the two things a popover must do.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const groups = ['Dark', 'Light'] as const

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={`Theme: ${theme.name}`}
        className={cn(
          'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
          'text-ink-2 hover:bg-surface-2 hover:text-ink',
        )}
      >
        {/* Paint-roller/palette glyph. Inline SVG so it inherits the theme's
            own text colour instead of shipping a coloured asset. */}
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="9.5" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9.5" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="9.5" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
          <path d="M14.5 13.5c2 0 3.2 1 3.2 2.4 0 1.5-1.6 2.6-3.4 2.6" />
        </svg>
        <span className="min-w-0 flex-1 truncate text-left">{theme.name}</span>
        <Swatch theme={theme} active={false} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a theme"
          className={cn(
            'card absolute z-50 w-72 p-3 shadow-lg',
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">
            Theme
          </p>

          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {groups.map((group) => (
              <div key={group}>
                <p className="mb-1 text-[0.6875rem] uppercase tracking-wide text-muted">
                  {group}
                </p>
                <ul className="space-y-0.5">
                  {THEMES.filter((item) => item.group === group).map((item) => {
                    const active = item.id === theme.id
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setThemeId(item.id)}
                          aria-current={active}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                            active
                              ? 'bg-surface-2 text-gold'
                              : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                          )}
                        >
                          <Swatch theme={item} active={active} />
                          <span className="min-w-0 flex-1 truncate">
                            {item.name}
                          </span>
                          {active && <span aria-hidden>✓</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Custom accent. Lets a new colour be added without a code change,
              on top of whichever theme is selected. */}
          <div className="mt-3 border-t border-border pt-3">
            <label
              htmlFor="theme-accent"
              className="mb-1 block text-[0.6875rem] uppercase tracking-wide text-muted"
            >
              Custom accent
            </label>
            <div className="flex items-center gap-2">
              <input
                id="theme-accent"
                type="color"
                value={accent ?? theme.palette.accent}
                onChange={(event) => setAccent(event.target.value)}
                className="h-8 w-10 shrink-0 cursor-pointer rounded-sm border border-border bg-bg p-0.5"
              />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted">
                {accent ?? `${theme.palette.accent} (theme)`}
              </span>
              {accent && (
                <Button variant="ghost" onClick={() => setAccent(null)}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 flex justify-between border-t border-border pt-3">
            <Button variant="ghost" onClick={reset}>
              Reset to default
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
