import { useSyncExternalStore } from 'react'
import {
  detectLowPowerDevice,
  detectSaveData,
  detectWebGL,
} from '@/lib/capabilities'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useMediaQuery } from '@/hooks/useMediaQuery'

/**
 * How rich the visual layer is allowed to be for this visitor.
 *
 *   'full'    — background video plays, WebGL accents mount.
 *   'reduced' — video plays, no WebGL (weak GPU, coarse pointer).
 *   'still'   — poster image only, no video, no WebGL.
 *
 * Every expensive component asks this ONE hook rather than each re-deriving
 * "is it mobile" from its own media query. The site must be complete and
 * usable at 'still'; richer tiers only add atmosphere.
 */
export type VisualTier = 'full' | 'reduced' | 'still'

export interface CanvasPolicy {
  readonly tier: VisualTier
  readonly playVideo: boolean
  readonly mountWebGL: boolean
}

interface Probes {
  readonly webgl: boolean
  readonly saveData: boolean
  readonly lowPower: boolean
}

const SERVER_PROBES: Probes = {
  webgl: false,
  saveData: false,
  lowPower: false,
}

/**
 * Device probes are one-shot and expensive-ish (creating a WebGL context), so
 * they run once per page load and are cached. Caching also keeps the snapshot
 * referentially stable, which `useSyncExternalStore` requires, and stops
 * StrictMode's double render from probing twice.
 */
let cached: Probes | null = null

function getProbes(): Probes {
  if (cached) return cached
  if (typeof window === 'undefined') return SERVER_PROBES
  cached = {
    webgl: detectWebGL(),
    saveData: detectSaveData(),
    lowPower: detectLowPowerDevice(),
  }
  return cached
}

const getServerProbes = () => SERVER_PROBES

// The probe result never changes during a page load, so there is nothing to
// subscribe to.
const subscribeNever = () => () => {}

export function useCanvasPolicy(): CanvasPolicy {
  const reducedMotion = usePrefersReducedMotion()
  const isSmallScreen = useMediaQuery('(max-width: 767px)')
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')
  const probes = useSyncExternalStore(
    subscribeNever,
    getProbes,
    getServerProbes,
  )

  // Reduced motion no longer stops the background video, by explicit and
  // repeated instruction: the brief is that the background IS the video, on
  // every device.
  //
  // This is a real trade and worth naming. `prefers-reduced-motion` is how
  // someone tells their operating system that moving images make them unwell,
  // and an autoplaying loop is squarely the kind of thing it exists to stop.
  // What is kept is the rest of it: no WebGL, and every entrance animation on
  // the site still checks `usePrefersReducedMotion()` for itself, so nothing
  // slides, tilts or fades in. The clip is muted, loops without cuts and
  // carries no motion the eye is drawn to track, which is the mildest end of
  // what the preference covers — but it is not nothing.
  //
  // On Windows this preference is set by Settings → Accessibility → Visual
  // effects → Animation effects, which people switch off for performance
  // without meaning to opt out of video.
  if (reducedMotion) {
    return { tier: 'reduced', playVideo: true, mountWebGL: false }
  }

  // Save-Data no longer stops it either, by the same instruction. The cost is
  // the visitor's: the clip is 876 kB and the single largest asset on the
  // page, and Save-Data is how a browser relays "I am paying for this by the
  // megabyte". WebGL still stays off, which is the part that would cost them
  // battery as well as data.
  //
  // `poster` still does its job — the still frame shows while the video
  // loads, so a slow connection sees the image first rather than a black
  // rectangle, and `preload="metadata"` keeps the initial request small.
  if (probes.saveData) {
    return { tier: 'reduced', playVideo: true, mountWebGL: false }
  }

  // Phones play the video too. It used to stop here on the grounds that the
  // clip reads worse stretched over a tall viewport — that was a judgement
  // about taste, not capability, and the brief is now that the background is
  // the video everywhere. WebGL stays off on small screens: that one is about
  // capability, and the site is specified to be complete without it.
  if (isSmallScreen) {
    return { tier: 'reduced', playVideo: true, mountWebGL: false }
  }

  if (!probes.webgl || probes.lowPower || isCoarsePointer) {
    return { tier: 'reduced', playVideo: true, mountWebGL: false }
  }

  return { tier: 'full', playVideo: true, mountWebGL: true }
}
