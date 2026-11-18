import type { ReactNode } from 'react'
import { Reveal } from '@/components/Reveal'
import { Section } from '@/components/Section'
import { TiltCard } from '@/components/TiltCard'
import { projects } from '@/content'
import { cn } from '@/lib/cn'
import {
  resolved,
  resolvedList,
  type ImageAsset,
  type Project,
} from '@/types/content'

/* Derived here rather than imported from the content module.
 *
 * `@/content/projects` is the SOURCE module; `@/content` is the CMS-backed
 * overlay every other section reads. This section used to import the former,
 * which meant an edit made in the admin reached the hero's featured cards
 * (they read the overlay) and then failed to reach the full entry directly
 * below them. The two agreed only because nobody had edited a project yet.
 *
 * Ordering by `order` rather than trusting array position, because the CMS
 * can reorder and the exported snapshot preserves whatever it was given. */
const ordered = [...projects.items].sort((a, b) => a.order - b.order)
const flagshipProject = ordered[0]
const secondaryProjects = ordered.slice(1)

/**
 * Projects.
 *
 * Deliberately NOT a uniform grid. The Periyar University system is a
 * production platform in real use by a state university, and the other three
 * are not — flattening them into four identical cards would throw away the one
 * piece of hierarchy a reader most needs. So the flagship gets a full-width
 * case study and the rest get a compact list beneath it.
 */
export function ProjectsSection() {
  const introduction = resolved(projects.introduction)

  return (
    <Section id="projects" eyebrow={projects.eyebrow} heading={projects.heading}>
      {introduction && (
        <p className="mt-[var(--space-sm)] max-w-[var(--width-prose)] text-body text-ink-secondary">
          {introduction}
        </p>
      )}

      {flagshipProject && <Flagship project={flagshipProject} />}

      {secondaryProjects.length > 0 && (
        <>
          <h3 className="mt-[var(--space-2xl)] font-mono text-caption uppercase text-gold">
            Also built
          </h3>
          <ol className="mt-[var(--space-md)] space-y-[var(--space-lg)]">
            {secondaryProjects.map((project, index) => (
              <Reveal key={project.slug} as="li" index={index}>
                <SecondaryProject project={project} />
              </Reveal>
            ))}
          </ol>
        </>
      )}
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Flagship                                                                   */
/* -------------------------------------------------------------------------- */

function Flagship({ project }: { readonly project: Project }) {
  const summary = resolved(project.summary)
  const description = resolvedList(project.description)
  const architecture = resolved(project.architecture)
  const cover = project.cover ? resolved(project.cover.src) : undefined

  return (
    <Reveal className="mt-[var(--space-xl)]">
      {/* Same side-by-side shape as the secondary entries, so the flagship does
          not swallow three screens of vertical space. It stays clearly first
          through the gold badge, the larger heading, the organisation line and
          the extra blocks (architecture, full capability list) — hierarchy from
          weight and content, not from sheer size. */}
      <article className="grid gap-[var(--space-lg)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="md:sticky md:top-28 md:self-start">
          {cover && project.cover ? (
            <TiltCard maxTilt={3}>
              <figure className="glass-panel overflow-hidden p-1">
                <img
                  src={cover}
                  srcSet={project.cover.srcSet}
                  sizes={project.cover.sizes}
                  alt={project.cover.alt}
                  width={project.cover.width}
                  height={project.cover.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/10] w-full rounded-md object-cover object-top"
                />
                <figcaption className="px-[var(--space-xs)] pb-1 pt-[var(--space-xs)] text-caption normal-case text-muted">
                  Screenshot of the live admission portal.
                </figcaption>
              </figure>
            </TiltCard>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
            <span className="rounded-pill bg-gold px-[var(--space-md)] py-1 font-mono text-caption uppercase text-bg-deep">
              Flagship project
            </span>
            <StatusBadge project={project} />
            <ReleaseBadges project={project} />
          </div>

          {project.organization && (
            <p className="mt-[var(--space-sm)] font-mono text-caption uppercase tracking-[0.18em] text-ink-secondary">
              {project.organization}
            </p>
          )}

          <h3 className="mt-[var(--space-xs)] text-h2 text-ink">
            {project.shortTitle ?? project.title}
          </h3>

          <p className="mt-[var(--space-xs)] font-mono text-caption uppercase text-gold">
            {project.category}
          </p>

          {summary && (
            <p className="mt-[var(--space-sm)] text-body text-ink-secondary">
              {summary}
            </p>
          )}

          {description.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-[var(--space-sm)] text-body text-ink-secondary"
            >
              {paragraph}
            </p>
          ))}

          {project.highlights.length > 0 && (
            <div className="mt-[var(--space-md)]">
              <h4 className="font-mono text-caption uppercase text-gold">
                Selected capabilities
              </h4>
              <ul className="mt-[var(--space-xs)] space-y-1">
                {project.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex gap-[var(--space-xs)] text-body text-ink-secondary"
                  >
                    <span aria-hidden="true" className="text-gold">
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {architecture && (
            <div className="mt-[var(--space-md)]">
              <h4 className="font-mono text-caption uppercase text-gold">
                Architecture
              </h4>
              <p className="mt-[var(--space-xs)] border-l-2 border-forest pl-[var(--space-sm)] text-body text-muted">
                {architecture}
              </p>
            </div>
          )}

          <TechStack
            items={project.technologies}
            className="mt-[var(--space-md)]"
          />

          <ProjectLinks project={project} className="mt-[var(--space-md)]" />
        </div>
      </article>
    </Reveal>
  )
}

/* -------------------------------------------------------------------------- */
/* Secondary                                                                  */
/* -------------------------------------------------------------------------- */

function SecondaryProject({ project }: { readonly project: Project }) {
  const summary = resolved(project.summary)
  const cover = project.cover ? resolved(project.cover.src) : undefined

  return (
    <article className="grid gap-[var(--space-md)] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <TiltCard maxTilt={4}>
        {cover && project.cover ? (
          <div className="glass-panel overflow-hidden p-1">
            <img
              src={cover}
              srcSet={project.cover.srcSet}
              sizes={project.cover.sizes}
              alt={project.cover.alt}
              width={project.cover.width}
              height={project.cover.height}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] w-full rounded-md object-cover object-top"
            />
          </div>
        ) : (
          /* No public deployment to screenshot and no owned artwork, so the
             plate stays typographic rather than inventing a visual. */
          <div className="glass-panel flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-surface-elevated to-surface">
            <span
              aria-hidden="true"
              className="font-display text-h1 leading-none text-ink/15"
            >
              {String(project.order).padStart(2, '0')}
            </span>
          </div>
        )}
      </TiltCard>

      <div>
        <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
          <span className="font-mono text-caption uppercase text-gold">
            {project.category}
          </span>
          <StatusBadge project={project} />
          <ReleaseBadges project={project} />
        </div>

        <h4 className="mt-[var(--space-xs)] text-h3 text-ink">
          {project.shortTitle ?? project.title}
        </h4>

        {summary && (
          <p className="mt-[var(--space-xs)] max-w-[var(--width-prose)] text-body text-ink-secondary">
            {summary}
          </p>
        )}

        {project.highlights.length > 0 && (
          <ul className="mt-[var(--space-sm)] space-y-1">
            {project.highlights.slice(0, 3).map((item) => (
              <li
                key={item}
                className="flex gap-[var(--space-xs)] text-body text-muted"
              >
                <span aria-hidden="true" className="text-gold">
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}

        <TechStack
          items={project.technologies}
          className="mt-[var(--space-sm)]"
        />

        <ProjectGallery project={project} className="mt-[var(--space-md)]" />

        <ProjectLinks project={project} className="mt-[var(--space-md)]" />
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

function StatusBadge({ project }: { readonly project: Project }) {
  if (project.status === 'live') {
    return (
      <span className="inline-flex items-center gap-2 rounded-pill border border-forest-bright/40 px-[var(--space-sm)] py-0.5 font-mono text-caption uppercase text-forest-bright">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-pill bg-forest-bright"
        />
        Live
      </span>
    )
  }
  if (project.deploymentNote) {
    return (
      <span className="rounded-pill border border-border px-[var(--space-sm)] py-0.5 font-mono text-caption uppercase text-muted">
        {project.deploymentNote}
      </span>
    )
  }
  return null
}

/**
 * Screenshots beneath a project, when it has any.
 *
 * The `gallery` field has existed on every project since the type was
 * written and nothing ever displayed it. This renders it.
 *
 * Plain figures with real captions rather than a lightbox: a modal would
 * need focus trapping, an escape handler and a restore target to be usable
 * by keyboard, and none of that earns its place for two screenshots that
 * are perfectly readable in the page. Each one links to the full-size file,
 * so a reader who wants a closer look still has one.
 */
function ProjectGallery({
  project,
  className,
}: {
  readonly project: Project
  readonly className?: string
}) {
  // flatMap rather than map + a type predicate: the predicate would have to
  // name this array's own element type while defining it, which is circular.
  const shots = project.gallery.flatMap(
    (shot): readonly { readonly shot: ImageAsset; readonly src: string }[] => {
      const src = resolved(shot.src)
      return src ? [{ shot, src }] : []
    },
  )

  if (shots.length === 0) return null

  return (
    <figure className={className}>
      <figcaption className="font-mono text-caption uppercase text-gold">
        Inside the product
      </figcaption>
      <ul className="mt-[var(--space-sm)] grid gap-[var(--space-sm)] sm:grid-cols-2">
        {shots.map(({ shot, src }) => (
          <li key={src}>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel block overflow-hidden p-1 transition-colors duration-normal ease-cinematic hover:border-gold/40"
            >
              <img
                src={src}
                srcSet={shot.srcSet}
                sizes={shot.sizes}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                loading="lazy"
                decoding="async"
                className="aspect-[16/10] w-full rounded-md object-cover object-top"
              />
            </a>
          </li>
        ))}
      </ul>
    </figure>
  )
}

/**
 * Version and store badges, for a project that ships as a product.
 *
 * Renders nothing at all unless the content provides a release, so the four
 * projects that are deployments rather than products are untouched.
 */
function ReleaseBadges({ project }: { readonly project: Project }) {
  const release = project.release
  if (!release) return null

  return (
    <>
      <span className="rounded-pill border border-border-strong px-[var(--space-sm)] py-0.5 font-mono text-caption uppercase text-ink-secondary">
        v{release.version}
      </span>
      <span className="rounded-pill border border-gold/40 bg-gold/5 px-[var(--space-sm)] py-0.5 font-mono text-caption uppercase text-gold">
        {release.channel}
      </span>
    </>
  )
}

function TechStack({
  items,
  className,
}: {
  readonly items: readonly string[]
  readonly className?: string
}) {
  if (items.length === 0) return null
  return (
    <div className={className}>
      <h5 className="sr-only">Technologies used</h5>
      <ul className="flex flex-wrap gap-[var(--space-xs)]">
        {items.map((tech) => (
          <li
            key={tech}
            className="rounded-pill border border-border bg-surface/60 px-[var(--space-sm)] py-0.5 font-mono text-caption text-ink-secondary"
          >
            {tech}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProjectLinks({
  project,
  className,
}: {
  readonly project: Project
  readonly className?: string
}) {
  const live = resolved(project.liveUrl)
  const github = resolved(project.github)
  const name = project.shortTitle ?? project.title

  if (!live && !github) return null

  return (
    <div className={cn('flex flex-wrap gap-[var(--space-sm)]', className)}>
      {live && (
        <ExternalLink href={live} primary>
          {/* A store listing is an install, not a visit. The wording comes
              from the release in the content layer, so this stays free of
              any one product's name. */}
          {project.release ? `Get it on ${project.release.channel}` : 'View live system'}
          <span className="sr-only"> — {name} (opens in a new tab)</span>
        </ExternalLink>
      )}
      {github && (
        <ExternalLink href={github}>
          View source
          <span className="sr-only"> — {name} (opens in a new tab)</span>
        </ExternalLink>
      )}
    </div>
  )
}

function ExternalLink({
  href,
  primary,
  children,
}: {
  readonly href: string
  readonly primary?: boolean
  readonly children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'rounded-pill px-[var(--space-lg)] py-[var(--space-xs)] text-caption uppercase transition-colors duration-fast ease-standard',
        primary
          ? 'bg-gold text-bg-deep hover:bg-gold-soft'
          : 'border border-border-strong text-ink hover:border-gold hover:text-gold',
      )}
    >
      {children}
    </a>
  )
}
