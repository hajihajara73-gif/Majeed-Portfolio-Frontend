import type { ReactNode } from 'react'
import { Reveal } from '@/components/Reveal'
import { cn } from '@/lib/cn'

interface Props {
  /** Two-digit chapter index. Decorative — hidden from assistive tech. */
  readonly index: string
  readonly eyebrow?: string
  readonly heading: string
  readonly headingId: string
  /** One paragraph. Sits in its own column, deliberately off-axis. */
  readonly lede?: ReactNode
  readonly className?: string
}

/**
 * The editorial section header.
 *
 * Replaces the pattern the whole page used before — a gold eyebrow stacked on
 * an `h2`, identical in all seven sections, which made every section announce
 * itself the same way regardless of what followed.
 *
 * Three things changed, and all three are structural rather than decorative:
 *
 *   1. A chapter index sits in a left rail, so the page reads as a sequence
 *      rather than as a stack of equal blocks. It is `aria-hidden`: the number
 *      is a visual cue to a sighted reader scanning, and a screen-reader user
 *      already has the heading.
 *   2. The rule runs from the index to the right edge, which is what ties the
 *      rail to the content and makes the asymmetry deliberate rather than
 *      accidental.
 *   3. The lede occupies its own column instead of sitting under the title at
 *      body size. A section opener is a different kind of sentence from body
 *      copy, and it now has a size that says so.
 *
 * On a narrow viewport the rail collapses to zero (`--space-rail` floors at
 * 0rem) and the columns stack — the asymmetry is a desktop idea and does not
 * survive a 375px screen, so it does not try to.
 */
export function SectionHead({
  index,
  eyebrow,
  heading,
  headingId,
  lede,
  className,
}: Props) {
  return (
    <header className={cn('relative', className)}>
      <div className="flex items-start gap-[var(--space-md)]">
        <span
          aria-hidden="true"
          className="shrink-0 font-mono text-caption tabular-nums text-faint"
        >
          {index}
        </span>
        <hr className="rule-lit mt-[0.6em] w-full" />
      </div>

      <div className="grid gap-x-[var(--space-xl)] gap-y-[var(--space-md)] pt-[var(--space-lg)] lg:grid-cols-12">
        <div className="lg:col-span-7 lg:col-start-2">
          {eyebrow && (
            <Reveal>
              <p className="font-mono text-caption uppercase text-gold">
                {eyebrow}
              </p>
            </Reveal>
          )}
          <Reveal index={1}>
            <h2
              id={headingId}
              className="mt-[var(--space-sm)] text-h1 text-ink"
            >
              {heading}
            </h2>
          </Reveal>
        </div>

        {lede && (
          <Reveal index={2} className="lg:col-span-4 lg:self-end">
            <p className="text-lede text-ink-secondary">{lede}</p>
          </Reveal>
        )}
      </div>
    </header>
  )
}
