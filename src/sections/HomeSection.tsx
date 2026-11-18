import { motion } from 'framer-motion'
import { useState } from 'react'
import { ResumeViewer } from '@/components/ResumeViewer'
import { ScrollCue } from '@/components/ScrollCue'
import { SocialLinks } from '@/components/SocialLinks'
import { MaskedText } from '@/components/editorial/MaskedText'
import { home, site } from '@/content'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { resolved } from '@/types/content'

/**
 * Hero — and only the hero.
 *
 * Home is deliberately one screen: greeting, name, headline, roles, a short
 * introduction, two actions and the social links. Nothing else.
 *
 * The featured project cards, technology list, music player and notes panel
 * used to sit below the fold here. They were removed because they turned the
 * opening into a dashboard and duplicated what Projects and Skills already say
 * properly further down. The first screen introduces a person; the sections
 * after it do the explaining.
 *
 * The copy column is constrained to the left on desktop because that is the
 * only zone of the footage with enough contrast headroom for bare ink; see
 * docs/SPEC.md §3.
 *
 * REDESIGN NOTES. The content is unchanged — every string still comes from
 * the content layer. What changed is the composition:
 *
 *   • The name arrives word by word from behind a mask rather than fading in
 *     with everything else. It is the one piece of real animation on the first
 *     screen, and everything after it is held back far enough to read as a
 *     consequence of it rather than as a separate effect.
 *
 *   • The roles left the copy column and became a baseline rail across the
 *     foot of the screen. Stacked under the paragraph they were a fourth line
 *     of small text competing with the introduction; on the baseline they
 *     frame the composition, give the hero a bottom edge, and fill a screen
 *     that was previously weighted entirely to the top-left.
 *
 *   • A hairline under the name ties the two halves together, which is what
 *     makes the asymmetry look chosen.
 */
export function HomeSection() {
  const resumeHref = resolved(home.resume.href)
  const [resumeOpen, setResumeOpen] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  // Everything that is not the name waits for the name. Under reduce-motion
  // the whole schedule collapses to zero and nothing animates at all.
  const after = (seconds: number) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.7,
            delay: seconds,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        }

  return (
    <section
      id="home"
      aria-labelledby="home-heading"
      className="relative mx-auto flex min-h-[100svh] w-full max-w-[var(--width-content)] flex-col justify-between px-[var(--space-gutter)] pb-[var(--space-2xl)] pt-32"
    >
      <div className="flex flex-1 flex-col justify-center">
        <div className="md:max-w-[62%]">
          <motion.p
            {...after(0.1)}
            className="font-mono text-caption uppercase text-gold"
          >
            {home.greeting}
          </motion.p>

          <MaskedText
            as="h1"
            text={site.name}
            delay={0.22}
            stagger={0.09}
            className="mt-[var(--space-md)] text-display text-ink"
          />

          {/* The rule is the hinge of the layout: it closes the name and opens
              everything that explains it. */}
          <motion.hr
            aria-hidden="true"
            {...(reducedMotion
              ? {}
              : {
                  initial: { scaleX: 0 },
                  animate: { scaleX: 1 },
                  transition: {
                    duration: 0.9,
                    delay: 0.5,
                    ease: [0.22, 1, 0.36, 1] as const,
                  },
                })}
            className="rule-lit mt-[var(--space-lg)] w-full origin-left"
          />

          <motion.p
            {...after(0.62)}
            className="mt-[var(--space-lg)] text-lede text-ink"
          >
            {home.headline}
          </motion.p>

          <motion.p
            {...after(0.72)}
            className="mt-[var(--space-md)] max-w-[var(--width-prose)] text-body text-ink-secondary"
          >
            {home.introduction}
          </motion.p>

          {/* The resume is the primary action. It opens a preview with a
              download beside it rather than navigating away, so the page is
              not lost to a PDF viewer. The button only exists once there is a
              resume to show. */}
          <motion.div
            {...after(0.82)}
            className="mt-[var(--space-xl)] flex flex-wrap items-center gap-x-[var(--space-xl)] gap-y-[var(--space-md)]"
          >
            {resumeHref && (
              <button
                type="button"
                onClick={() => setResumeOpen(true)}
                className="rounded-pill bg-gold px-[var(--space-lg)] py-[var(--space-sm)] font-mono text-caption font-medium uppercase text-bg-deep transition-colors duration-fast ease-standard hover:bg-gold-soft"
              >
                {home.resume.label}
              </button>
            )}

            <SocialLinks label="Social profiles" />
          </motion.div>
        </div>
      </div>

      {/* Baseline rail. Sits on the floor of the first screen, which is what
          gives the hero a composed bottom edge instead of trailing off. */}
      <motion.div
        {...after(0.95)}
        className="relative hidden pt-[var(--space-lg)] md:block"
      >
        <hr aria-hidden="true" className="w-full border-0 border-t border-border" />
        <div className="mt-[var(--space-md)] flex items-center justify-between gap-[var(--space-lg)]">
          <ul className="flex flex-wrap items-center">
            {home.roles.map((role, i) => (
              <li
                key={role}
                className="font-mono text-caption uppercase text-ink-secondary"
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="px-[var(--space-md)] text-faint"
                  >
                    /
                  </span>
                )}
                {role}
              </li>
            ))}
          </ul>
          {/* Inline, at the end of the rail. Floating, its default, would
              print the cue straight through the rule and the roles. */}
          <ScrollCue targetId="about" layout="inline" />
        </div>
      </motion.div>

      {/* Narrow screens get the roles without the rail: there is no room for a
          baseline composition, and a cramped one reads as a mistake. */}
      <ul className="mt-[var(--space-lg)] flex flex-wrap gap-x-[var(--space-md)] gap-y-[var(--space-xs)] md:hidden">
        {home.roles.map((role) => (
          <li
            key={role}
            className="font-mono text-caption uppercase text-ink-secondary"
          >
            {role}
          </li>
        ))}
      </ul>

      {resumeOpen && resumeHref && (
        <ResumeViewer
          href={resumeHref}
          label={home.resume.label}
          onClose={() => setResumeOpen(false)}
        />
      )}
    </section>
  )
}
