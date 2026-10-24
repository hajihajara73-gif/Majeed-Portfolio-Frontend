import { CertificateViewer } from '@/components/CertificateViewer'
import { useCertificateViewer } from '@/hooks/useCertificateViewer'
import { Reveal } from '@/components/Reveal'
import { Section } from '@/components/Section'
import { TiltCard } from '@/components/TiltCard'
import { achievements } from '@/content'
import { resolved, type Achievement } from '@/types/content'

/**
 * Achievements.
 *
 * Each certificate shows its own scan as the card face. Selecting one opens
 * the original PDF in a dialog.
 *
 * The card is a real <button>, not a clickable div: it is reachable by keyboard
 * and announced as an action, so "tap the image to see the PDF" works for
 * people who never touch a pointer. Entries with no published scan still
 * appear — the credential is real even when the document is withheld — they
 * simply render as a text card with no action.
 */
const isCertificate = (item: Achievement) => item.type === 'certificate'

/**
 * Certificates, grouped by the categories set in the admin.
 *
 * The grouping is driven entirely by the CMS: categories arrive already in
 * the order someone chose, and a certificate filed under none still appears,
 * after the groups. With no categories configured at all this renders one
 * flat grid, which is what it did before any of this existed.
 */
export function CertificatesSection() {
  const copy = achievements.certificates
  const introduction = resolved(copy.introduction)
  const viewer = useCertificateViewer()

  const items = achievements.items.filter(isCertificate)
  const groups = achievements.categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.categoryId === category.id),
    }))
    .filter((group) => group.items.length > 0)

  const grouped = new Set(groups.flatMap((g) => g.items.map((i) => i.id)))
  const ungrouped = items.filter((item) => !grouped.has(item.id))

  return (
    <Section id="certificates" eyebrow={copy.eyebrow} heading={copy.heading}>
      {introduction && (
        <p className="mt-[var(--space-sm)] max-w-[var(--width-prose)] text-body text-ink-secondary">
          {introduction}
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-[var(--space-md)] max-w-[var(--width-prose)] text-body text-muted">
          {achievements.emptyState}
        </p>
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.category.id} className="mt-[var(--space-xl)]">
              <h3 className="text-h3 text-ink">{group.category.label}</h3>
              {group.category.summary && (
                <p className="mt-[var(--space-xs)] max-w-[var(--width-prose)] text-caption normal-case text-muted">
                  {group.category.summary}
                </p>
              )}
              <CertificateGrid
                items={group.items}
                onOpen={viewer.show}
                headingLevel="h4"
              />
            </div>
          ))}

          {ungrouped.length > 0 && (
            <div className="mt-[var(--space-xl)]">
              {groups.length > 0 && (
                <h3 className="text-h3 text-ink">Other</h3>
              )}
              <CertificateGrid
                items={ungrouped}
                onOpen={viewer.show}
                headingLevel={groups.length > 0 ? "h4" : "h3"}
              />
            </div>
          )}
        </>
      )}

      {viewer.open && (
        <CertificateViewer achievement={viewer.open} onClose={viewer.close} />
      )}
    </Section>
  )
}

/** Awards, competitions, milestones — everything that is not a certificate. */
export function AchievementsSection() {
  const introduction = resolved(achievements.introduction)
  const viewer = useCertificateViewer()
  const items = achievements.items.filter((item) => !isCertificate(item))

  // No awards yet is a real answer, and an empty heading is worse than none.
  if (items.length === 0) return null

  return (
    <Section
      id="achievements"
      eyebrow={achievements.eyebrow}
      heading={achievements.heading}
    >
      {introduction && (
        <p className="mt-[var(--space-sm)] max-w-[var(--width-prose)] text-body text-ink-secondary">
          {introduction}
        </p>
      )}

      <CertificateGrid items={items} onOpen={viewer.show} />

      {viewer.open && (
        <CertificateViewer achievement={viewer.open} onClose={viewer.close} />
      )}
    </Section>
  )
}

function CertificateGrid({
  items,
  onOpen,
  headingLevel = 'h3',
}: {
  items: readonly Achievement[]
  onOpen: (item: Achievement) => void
  /**
   * The card title's heading level. A grid sitting under a category heading
   * passes 'h4', so the cards nest beneath it rather than claiming to be its
   * sibling; a grid with no heading above it keeps 'h3'. Getting this wrong
   * is invisible on screen and misleading to anyone navigating by headings.
   */
  headingLevel?: 'h3' | 'h4'
}) {
  return (
    <ul className="mt-[var(--space-md)] grid gap-[var(--space-md)] sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <Reveal key={item.id} as="li" index={index} className="h-full">
          <CertificateCard
            item={item}
            headingLevel={headingLevel}
            onOpen={() => onOpen(item)}
          />
        </Reveal>
      ))}
    </ul>
  )
}

function CertificateCard({
  item,
  onOpen,
  headingLevel = 'h3',
}: {
  readonly item: Achievement
  readonly onOpen: () => void
  readonly headingLevel?: 'h3' | 'h4'
}) {
  const Title = headingLevel
  const organization = resolved(item.organization)
  const date = resolved(item.date)
  const imageSrc = item.image ? resolved(item.image.src) : undefined
  const hasDocument = Boolean(resolved(item.document))
  const openable = Boolean(imageSrc || hasDocument)

  const body = (
    <div className="glass-panel flex h-full flex-col overflow-hidden text-left">
      {imageSrc && item.image ? (
        <div className="relative overflow-hidden border-b border-border bg-bg-deep">
          <img
            src={imageSrc}
            srcSet={item.image.srcSet}
            sizes={item.image.sizes}
            alt={item.image.alt}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover object-top transition-transform duration-slow ease-cinematic group-hover:scale-[1.03]"
          />
          {hasDocument && (
            <span
              aria-hidden="true"
              className="absolute bottom-2 right-2 rounded-pill bg-bg-deep/80 px-[var(--space-sm)] py-0.5 font-mono text-caption uppercase text-gold backdrop-blur-sm"
            >
              PDF
            </span>
          )}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-[var(--space-md)]">
        <span className="font-mono text-caption uppercase text-gold">
          {item.type}
        </span>
        <Title className="mt-[var(--space-xs)] text-h3 text-ink">
          {item.title}
        </Title>
        {(organization || date) && (
          <p className="mt-1 text-caption normal-case text-muted">
            {organization}
            {organization && date ? ' · ' : ''}
            {date}
          </p>
        )}
        {openable && (
          <span className="mt-auto pt-[var(--space-md)] font-mono text-caption uppercase text-ink-secondary transition-colors duration-fast ease-standard group-hover:text-gold">
            View certificate →
          </span>
        )}
      </div>
    </div>
  )

  if (!openable) {
    return <div className="h-full">{body}</div>
  }

  return (
    <TiltCard maxTilt={4} className="h-full">
      <button
        type="button"
        onClick={onOpen}
        className="group h-full w-full cursor-pointer rounded-lg text-left"
      >
        <span className="sr-only">
          View the {item.title} certificate
          {organization ? ` from ${organization}` : ''}
        </span>
        <span aria-hidden="true" className="block h-full">
          {body}
        </span>
      </button>
    </TiltCard>
  )
}
