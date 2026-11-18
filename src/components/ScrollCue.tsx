import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'

interface Props {
  readonly targetId: string
  /**
   * `floating` centres the cue on the floor of its container — the original
   * behaviour. `inline` makes it an ordinary flex item, for a hero that now
   * has a baseline rail of its own and would otherwise have the cue printed
   * straight through it.
   */
  readonly layout?: 'floating' | 'inline'
}

/**
 * The "there is more below" cue at the bottom of the hero.
 *
 * A real anchor rather than a decorative arrow: it is keyboard reachable and
 * actually navigates, so it is useful and not just ornamental. The gentle
 * bob is CSS-only and stops entirely under reduce-motion, where the cue still
 * reads perfectly as a static mark.
 */
export function ScrollCue({ targetId, layout = 'floating' }: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const inline = layout === 'inline'

  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'flex w-fit items-center text-muted transition-colors duration-fast ease-standard hover:text-gold',
        inline
          ? 'flex-row gap-[var(--space-sm)]'
          : 'absolute inset-x-0 bottom-2 mx-auto flex-col gap-2',
      )}
    >
      <span className="font-mono text-caption uppercase">Scroll</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        style={
          reducedMotion
            ? undefined
            : { animation: 'scroll-cue 2.4s var(--ease-standard) infinite' }
        }
      >
        <path d="M12 4v14M6 13l6 6 6-6" strokeLinecap="round" />
      </svg>
    </a>
  )
}
