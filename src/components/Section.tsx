import type { ReactNode } from 'react'
import { SectionHead } from '@/components/editorial/SectionHead'
import { cn } from '@/lib/cn'
import type { SectionId } from '@/types/content'

interface Props {
  readonly id: SectionId
  readonly eyebrow?: string
  readonly heading: string
  /**
   * Chapter index, e.g. `"03"`. Decorative furniture — see `SectionHead`.
   * Omitted, the section falls back to the plain heading it had before.
   */
  readonly index?: string
  /** One opening paragraph, set larger and off-axis beside the heading. */
  readonly lede?: ReactNode
  /**
   * `content` is the reading measure. `wide` gives a section room to let
   * figures break past the text column — only Projects needs it so far.
   */
  readonly width?: 'content' | 'wide'
  readonly children?: ReactNode
  readonly className?: string
}

/**
 * Shared shell for every top-level section: the anchor target, the vertical
 * rhythm, the max width, and the heading pattern.
 *
 * Sections get their spacing from here so no component invents its own
 * section padding.
 *
 * The heading pattern is now `SectionHead` when an `index` is given. Both
 * forms are supported on purpose: the redesign moves section by section, and
 * a half-migrated page should look deliberate at every commit rather than
 * only at the last one.
 */
export function Section({
  id,
  eyebrow,
  heading,
  index,
  lede,
  width = 'content',
  children,
  className,
}: Props) {
  const headingId = `${id}-heading`

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'mx-auto w-full scroll-mt-24 px-[var(--space-gutter)] py-[var(--space-section)]',
        width === 'wide'
          ? 'max-w-[var(--width-wide)]'
          : 'max-w-[var(--width-content)]',
        className,
      )}
    >
      {index ? (
        <SectionHead
          index={index}
          eyebrow={eyebrow}
          heading={heading}
          headingId={headingId}
          lede={lede}
        />
      ) : (
        <>
          {eyebrow && (
            <p className="mb-[var(--space-sm)] font-mono text-caption uppercase text-gold">
              {eyebrow}
            </p>
          )}
          <h2 id={headingId} className="text-h2 text-ink">
            {heading}
          </h2>
        </>
      )}
      {children}
    </section>
  )
}

/**
 * Placeholder body for sections not yet implemented.
 *
 * Deliberately plain and clearly labelled — a half-styled fake section is
 * harder to reason about than an obvious stub.
 */
export function SectionStub({ note }: { readonly note: string }) {
  return (
    <p className="mt-[var(--space-md)] max-w-[var(--width-prose)] text-body text-muted">
      {note}
    </p>
  )
}
