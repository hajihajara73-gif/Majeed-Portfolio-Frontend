import { Reveal } from '@/components/Reveal'
import { TiltCard } from '@/components/TiltCard'
import { projects } from '@/content'
import { resolved, type Project } from '@/types/content'

interface Props {
  readonly slugs: readonly string[]
}

/**
 * Featured project cards for the hero.
 *
 * NOT CURRENTLY MOUNTED, AND THAT IS DELIBERATE. `HomeSection` explains why:
 * these cards used to sit below the fold and were removed because they turned
 * the opening into a dashboard and duplicated what Projects already says
 * properly further down. Nothing renders this component today.
 *
 * It is kept — and kept correct — because the data behind it is still live:
 * `home.featuredProjectSlugs` is derived in `published.ts` from the per-project
 * `featured` flag the CMS sets. If the hero ever wants cards again, this works
 * as-is. Anyone reading this while hunting for "why is my featured card not
 * showing": it is this, and the fix is a decision about the hero, not a bug.
 *
 * A teaser, not a duplicate of the Projects section: title, category, a short
 * description when there is one, a few technologies, and a link down to the
 * full entry. Every field is independently optional, so a card with only a
 * title still looks deliberate rather than broken.
 *
 * The card is NOT one big anchor any more. A project published on a store has
 * two destinations — install it, or read about it — and an anchor cannot
 * legally contain another anchor. So the card is a plain container and the
 * links sit inside it, which also means a keyboard user gets two real tab
 * stops with distinguishable names instead of one ambiguous one.
 */
export function FeaturedProjects({ slugs }: Props) {
  const featured = slugs
    .map((slug) => projects.items.find((project) => project.slug === slug))
    .filter((project): project is Project => project !== undefined)

  if (featured.length === 0) return null

  return (
    <div>
      <h2 className="font-mono text-caption uppercase text-gold">
        Featured work
      </h2>

      <ul className="mt-[var(--space-md)] grid gap-[var(--space-sm)] sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((project, index) => {
          const summary = resolved(project.summary)
          const technologies = project.technologies.slice(0, 3)
          const install = project.release ? resolved(project.liveUrl) : null
          const name = project.shortTitle ?? project.title

          return (
            <Reveal key={project.slug} as="li" index={index} className="h-full">
              <TiltCard className="h-full" maxTilt={4}>
                <div className="glass-panel group flex h-full flex-col p-[var(--space-md)] transition-colors duration-normal ease-cinematic hover:border-gold/40">
                  <span className="font-mono text-caption uppercase text-gold">
                    {project.category}
                  </span>

                  <h3 className="mt-[var(--space-xs)] text-h3 text-ink">
                    {name}
                  </h3>

                  {project.organization && (
                    <p className="mt-1 text-caption normal-case text-muted">
                      {project.organization}
                    </p>
                  )}

                  {/* Release first, because for a published product the
                      version and the store are the news. */}
                  {project.release && (
                    <ul className="mt-[var(--space-xs)] flex flex-wrap items-center gap-[var(--space-xs)]">
                      {project.status === 'live' && (
                        <li className="inline-flex items-center gap-1.5 rounded-pill border border-forest-bright/35 bg-forest px-[var(--space-sm)] py-0.5 font-mono text-caption uppercase text-ink">
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-pill bg-forest-bright"
                          />
                          Live
                        </li>
                      )}
                      <li className="rounded-pill border border-border-strong px-[var(--space-sm)] py-0.5 font-mono text-caption uppercase text-ink-secondary">
                        v{project.release.version}
                      </li>
                      <li className="rounded-pill border border-gold/40 bg-gold/5 px-[var(--space-sm)] py-0.5 font-mono text-caption uppercase text-gold">
                        {project.release.channel}
                      </li>
                    </ul>
                  )}

                  {summary && (
                    <p className="mt-[var(--space-xs)] text-body text-ink-secondary">
                      {summary}
                    </p>
                  )}

                  {technologies.length > 0 && (
                    <ul className="mt-[var(--space-sm)] flex flex-wrap gap-[var(--space-xs)]">
                      {technologies.map((tech) => (
                        <li
                          key={tech}
                          className="rounded-pill border border-border px-[var(--space-sm)] py-0.5 font-mono text-caption text-ink-secondary"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-[var(--space-sm)] pt-[var(--space-md)]">
                    {install && (
                      <a
                        href={install}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-pill bg-gold px-[var(--space-md)] py-[var(--space-xs)] font-mono text-caption uppercase text-bg-deep transition-colors duration-fast ease-standard hover:bg-gold-soft"
                      >
                        Get {name}
                        <span className="sr-only">
                          {' '}
                          on {project.release?.channel} (opens in a new tab)
                        </span>
                      </a>
                    )}
                    <a
                      href="#projects"
                      className="font-mono text-caption uppercase text-ink-secondary transition-colors duration-fast ease-standard hover:text-gold group-hover:text-gold"
                    >
                      {install ? 'Explore project' : 'View project'}
                      <span className="sr-only"> — {name}</span>
                      <span aria-hidden="true"> →</span>
                    </a>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          )
        })}
      </ul>
    </div>
  )
}
