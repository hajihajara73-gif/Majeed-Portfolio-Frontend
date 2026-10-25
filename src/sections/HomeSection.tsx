import { useState } from 'react'
import { ResumeViewer } from '@/components/ResumeViewer'
import { SocialLinks } from '@/components/SocialLinks'
import { home, site } from '@/content'
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
 */
export function HomeSection() {
  const resumeHref = resolved(home.resume.href)
  const [resumeOpen, setResumeOpen] = useState(false)

  return (
    <section
      id="home"
      aria-labelledby="home-heading"
      className="mx-auto flex min-h-[100svh] w-full max-w-[var(--width-content)] flex-col justify-center px-[var(--space-gutter)] pb-[var(--space-2xl)] pt-32"
    >
      <div className="relative flex flex-1 flex-col justify-center">
        <div className="md:max-w-[58%]">
          <p className="font-mono text-caption uppercase text-gold">
            {home.greeting}
          </p>

          <h1
            id="home-heading"
            className="mt-[var(--space-md)] text-display text-ink"
          >
            {site.name}
          </h1>

          <p className="mt-[var(--space-md)] text-body-lg text-ink-secondary">
            {home.headline}
          </p>

          <ul className="mt-[var(--space-md)] flex flex-wrap gap-x-[var(--space-md)] gap-y-[var(--space-xs)]">
            {home.roles.map((role) => (
              <li
                key={role}
                className="font-mono text-caption uppercase text-ink-secondary"
              >
                {role}
              </li>
            ))}
          </ul>

          <p className="mt-[var(--space-lg)] max-w-[var(--width-prose)] text-body text-ink-secondary">
            {home.introduction}
          </p>

          {/* The resume is the primary action. It opens a preview with a
              download beside it rather than navigating away, so the page is
              not lost to a PDF viewer. The button only exists once there is a
              resume to show. */}
          {resumeHref && (
            <div className="mt-[var(--space-xl)] flex flex-wrap items-center gap-[var(--space-sm)]">
              <button
                type="button"
                onClick={() => setResumeOpen(true)}
                className="rounded-pill bg-gold px-[var(--space-lg)] py-[var(--space-sm)] text-caption font-medium uppercase text-bg-deep transition-colors duration-fast ease-standard hover:bg-gold-soft"
              >
                {home.resume.label}
              </button>
            </div>
          )}

          <SocialLinks
            label="Social profiles"
            className="mt-[var(--space-lg)]"
          />
        </div>

      </div>

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
