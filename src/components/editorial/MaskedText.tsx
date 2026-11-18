import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'

interface Props {
  readonly text: string
  /** Seconds before the first word moves. */
  readonly delay?: number
  /** Seconds between consecutive words. */
  readonly stagger?: number
  readonly className?: string
  readonly as?: 'h1' | 'p' | 'span'
}

/**
 * The hero text reveal: each word rises out from behind its own mask.
 *
 * MASKED PER WORD, NOT PER LINE. Masking by line is the usual way to do this
 * and it needs the line breaks known in advance — which here they are not, as
 * the name is content and the heading is fluid down to 375px. Per word, the
 * effect survives any wrap, any name length and any viewport.
 *
 * THE CLIPPING PROBLEM. `overflow: hidden` on a tight inline-block cuts the
 * descenders off a typeface like Fraunces — the "j" in "Majeed" loses its
 * tail. The mask therefore carries bottom padding and cancels it again with
 * an equal negative margin, so there is room to hide the word without the
 * leading changing by a pixel.
 *
 * ACCESSIBILITY. The whole string stays in the accessibility tree as one
 * readable node; the per-word spans are `aria-hidden`, so a screen reader
 * announces "Mohammed Majeed J", not three fragments.
 *
 * Under reduce-motion no motion component is mounted at all — plain text,
 * no transform, nothing that can be left part-way.
 */
export function MaskedText({
  text,
  delay = 0,
  stagger = 0.07,
  className,
  as: Tag = 'span',
}: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const words = text.split(/\s+/).filter(Boolean)

  if (reducedMotion || words.length === 0) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>

      <span aria-hidden="true">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className={cn(
              // The mask. `pb`/`-mb` pair buys descender room without
              // changing where the baseline sits.
              'inline-block overflow-hidden pb-[0.14em] align-bottom',
              '-mb-[0.14em]',
            )}
          >
            <motion.span
              className="inline-block will-change-transform"
              initial={{ y: '115%' }}
              animate={{ y: '0%' }}
              transition={{
                duration: 0.9,
                delay: delay + i * stagger,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 && ' '}
          </span>
        ))}
      </span>
    </Tag>
  )
}
