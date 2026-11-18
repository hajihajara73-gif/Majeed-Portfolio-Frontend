import { cn } from '@/lib/cn'

interface Props {
  readonly items: readonly string[]
  readonly label: string
  readonly className?: string
}

/**
 * The technology list, as a list rather than as fifteen pills.
 *
 * The PhD project genuinely uses fifteen technologies. Rendered as individual
 * bordered pills that became a grey brick two rows deep — the single noisiest
 * element on the old page, repeated four times, and it buried the project
 * description above it.
 *
 * Set as separated mono text it occupies one or two quiet lines, stays
 * completely readable, and reads the way a colophon reads. The separator is a
 * real character in its own `span` rather than a CSS `::after`, so it is in
 * the accessibility tree and the list does not run together when read aloud.
 */
export function TechList({ items, label, className }: Props) {
  if (items.length === 0) return null

  return (
    <div className={className}>
      <h4 className="font-mono text-caption uppercase text-faint">{label}</h4>
      <ul className="mt-[var(--space-xs)] flex flex-wrap font-mono text-caption normal-case leading-relaxed text-ink-secondary">
        {items.map((item, i) => (
          <li key={item}>
            {item}
            {i < items.length - 1 && (
              <span aria-hidden="true" className={cn('px-2 text-faint')}>
                ·
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
