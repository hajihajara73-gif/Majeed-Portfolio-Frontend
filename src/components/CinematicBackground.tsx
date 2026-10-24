import { lazy, Suspense, useEffect, useRef } from 'react'
import { useCanvasPolicy } from '@/three/canvasPolicy'
import type { BackgroundVideo } from '@/types/content'

// three + R3F are ~230 kB of the bundle. Loading them lazily keeps them out of
// the initial payload entirely for the visitors who will never render them.
const AmbientScene = lazy(() => import('@/three/AmbientScene'))

interface Props {
  readonly background: BackgroundVideo
}

/**
 * The fixed cinematic layer behind all content.
 *
 * Three stacked layers, back to front:
 *   1. poster image  — always present, paints immediately, is the mobile and
 *                      reduced-motion background in its own right
 *   2. video         — only when the policy allows it, fades in over the poster
 *   3. scrim         — measured darkening gradient (see tokens.css)
 *
 * The video never blocks first paint: the poster is the background-image of the
 * container, so there is something correct on screen before any video byte
 * arrives.
 */
export function CinematicBackground({ background }: Props) {
  const policy = useCanvasPolicy()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!policy.playVideo) {
      // Tier dropped (e.g. the visitor turned on reduce-motion). Stop decoding
      // and release the buffered data rather than leaving it paused.
      video.pause()
      video.removeAttribute('src')
      video.load()
      return
    }

    // muted + playsInline satisfies every documented autoplay policy, but not
    // every real one: iOS Low Power Mode refuses regardless, and so do some
    // embedded browsers. A rejection used to be swallowed and left there,
    // which showed the poster forever with nothing to say why.
    //
    // So a refusal arms a one-shot retry on the first interaction of any
    // kind. By then the page has a user gesture and the same call is allowed.
    // The listeners are passive, fire once, and remove themselves whether or
    // not the retry succeeds, so nothing accumulates.
    let cancelled = false
    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll'] as const

    const retry = () => {
      if (cancelled) return
      video.play().catch(() => undefined)
    }
    const arm = () => {
      for (const event of events) {
        window.addEventListener(event, retry, { once: true, passive: true })
      }
    }
    const disarm = () => {
      for (const event of events) {
        window.removeEventListener(event, retry)
      }
    }

    const attempt = video.play()
    if (attempt) attempt.catch(arm)

    return () => {
      cancelled = true
      disarm()
    }
  }, [policy.playVideo])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${background.poster})` }}
      />

      {policy.playVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={background.poster}
          width={background.width}
          height={background.height}
          muted
          loop
          playsInline
          // Never `autoPlay` in markup — the effect above decides, so the
          // decision stays in one place and can be reversed.
          preload="metadata"
          disablePictureInPicture
          tabIndex={-1}
        >
          <source src={background.src} type={background.type} />
        </video>
      )}

      {/* Scrim layer 1 — flat base over everything. Sets the mood without
          killing the sunlight. Small screens get one heavier flat scrim
          instead, since copy there runs the full width. */}
      <div
        className="absolute inset-0 bg-[rgb(var(--scrim-rgb)/var(--overlay-video-flat))] md:bg-[rgb(var(--scrim-rgb)/var(--overlay-video-base))]"
      />

      {/* Scrim layer 2 — extra density banded over the LEFT copy column, where
          the measurements say bare ink is allowed to live. Fades out before
          the sun hotspot so the footage keeps its punch on the right. */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          // Full density across the whole copy column, not just its first
          // third — the headline runs to roughly 63% of the viewport, and the
          // fade previously started under it.
          background: `linear-gradient(
            to right,
            rgb(var(--scrim-rgb) / var(--overlay-video-text)) 0%,
            rgb(var(--scrim-rgb) / var(--overlay-video-text)) 45%,
            transparent 78%
          )`,
        }}
      />

      {/* WebGL bokeh sits ABOVE the scrim — lens artifacts are in front of the
          scene, not behind it. Suspense fallback is nothing: the page is
          already complete without this layer. */}
      {policy.mountWebGL && (
        <Suspense fallback={null}>
          <AmbientScene />
        </Suspense>
      )}

      {/* Vignette: settles the edges and hides the crop when object-fit trims
          the 16:9 source at extreme viewport ratios. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, transparent 40%, rgb(var(--scrim-rgb) / var(--overlay-vignette)) 100%)',
        }}
      />
    </div>
  )
}
