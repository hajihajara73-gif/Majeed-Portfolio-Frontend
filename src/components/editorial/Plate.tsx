import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'
import { resolved, type ImageAsset } from '@/types/content'

interface Props {
  readonly image: ImageAsset
  readonly caption?: string
  /** Frame proportion. `wide` is 16/10, `tall` suits a portrait capture. */
  readonly ratio?: 'wide' | 'tall' | 'natural'
  /** Drift distance in pixels across the whole scroll pass. 0 disables it. */
  readonly parallax?: number
  readonly className?: string
  readonly priority?: boolean
}

const RATIO: Record<NonNullable<Props['ratio']>, string> = {
  wide: 'aspect-[16/10]',
  tall: 'aspect-[4/5]',
  natural: '',
}

/**
 * A mounted screenshot.
 *
 * The old project blocks put every image in the same rounded card at the same
 * size on the same side, which is most of why four genuinely different
 * projects looked like four instances of one template. A plate is the opposite
 * idea: the frame is quiet — a hairline and a warm shadow — and the picture is
 * allowed to be large and to sit where the composition wants it.
 *
 * The parallax is 24px by default, not 200. It exists so an image feels
 * mounted on a surface slightly behind the text rather than glued to it; at
 * the magnitudes usually used for "parallax" it would instead announce itself,
 * which the brief rules out. `overflow-hidden` plus a scaled inner image means
 * the drift never exposes an edge.
 *
 * With reduce-motion set, no motion component is mounted at all — the image is
 * a plain `img`, and `useScroll` never runs.
 */
export function Plate({
  image,
  caption,
  ratio = 'wide',
  parallax = 24,
  className,
  priority = false,
}: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [parallax, -parallax])

  const src = resolved(image.src)
  if (!src) return null

  const drifts = !reducedMotion && parallax > 0

  const picture = (
    <img
      src={src}
      srcSet={image.srcSet}
      sizes={image.sizes}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn(
        'h-full w-full object-cover object-top',
        // Scaled up by exactly enough to cover the drift at both extremes.
        drifts && 'scale-[1.06]',
      )}
    />
  )

  return (
    <figure className={cn('group', className)}>
      <div ref={ref} className={cn('plate', RATIO[ratio])}>
        {drifts ? (
          <motion.div style={{ y }} className="h-full w-full will-change-transform">
            {picture}
          </motion.div>
        ) : (
          picture
        )}
      </div>

      {caption && (
        <figcaption className="mt-[var(--space-sm)] font-mono text-caption normal-case text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
