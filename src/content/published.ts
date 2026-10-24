/**
 * Overlay the published snapshot onto the source content modules.
 *
 * The modules in this directory are the BASE, not a legacy path. The snapshot
 * only overrides fields it actually carries a real value for, which gives two
 * properties worth the indirection:
 *
 *   1. A build with no snapshot renders exactly what the source modules say,
 *      so this repository stays buildable and reviewable on its own.
 *   2. The CMS cannot silently delete content by leaving a column empty. An
 *      empty string, an empty list or a null comes back as "no opinion" and
 *      the module's value survives.
 *
 * Some fields are intentionally NOT overlaid because the database does not
 * model them — section eyebrows and headings, the seven-item nav, the project
 * galleries, the philosophy block and the contact channels. Those stay in
 * source. See `docs/ADMIN.md` for the list and why.
 *
 * Everything here is pure data mapping at module scope; it runs once at build
 * time and costs nothing at runtime.
 */

import type {
  Achievement,
  AchievementType,
  AchievementsContent,
  AboutContent,
  CareerContent,
  CareerEntry,
  CareerEntryType,
  ContactsContent,
  EducationEntry,
  HomeContent,
  ImageAsset,
  Project,
  ProjectStatus,
  ProjectsContent,
  SiteContent,
  SkillCategory,
  SkillCategoryId,
  SkillsContent,
} from '@/types/content'

import { about as aboutBase } from './about'
import { achievements as achievementsBase } from './achievements'
import { career as careerBase } from './career'
import { contacts as contactsBase } from './contacts'
import { home as homeBase } from './home'
import { projects as projectsBase } from './projects'
import { site as siteBase } from './site'
import { skills as skillsBase } from './skills'
import { snapshot, type SnapshotAsset } from './snapshot'

/* -------------------------------------------------------------------------- */
/* Reading untrusted JSON                                                     */
/* -------------------------------------------------------------------------- */

/** A string, but only if there is something in it. */
const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined

/** A list of real strings, or undefined when there is nothing to say. */
const strList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const items = value.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0,
  )
  return items.length > 0 ? items : undefined
}

const rows = (value: unknown): Record<string, unknown>[] | undefined => {
  if (!Array.isArray(value) || value.length === 0) return undefined
  const items = value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  )
  return items.length > 0 ? items : undefined
}

const obj = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const asset = (value: unknown): SnapshotAsset | undefined => {
  const candidate = obj(value)
  return str(candidate.url) ? (candidate as unknown as SnapshotAsset) : undefined
}

/** Keeps a value only when the snapshot has a real one. */
const pick = <T>(value: T | undefined, fallback: T): T =>
  value === undefined ? fallback : value

/**
 * A union member, or the fallback. The database column is a plain string, so
 * an unexpected value must not become an unhandled variant in a component.
 */
const oneOf = <T extends string>(
  allowed: readonly T[],
  value: unknown,
  fallback: T,
): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback

/**
 * Snapshot asset to `ImageAsset`.
 *
 * `srcSet` and `sizes` are carried over ONLY when the URL is unchanged. The
 * CMS does not generate responsive variants, so keeping an old `srcSet`
 * against a new file would serve the previous image at most viewport widths —
 * a subtle wrong-picture bug rather than a missing one.
 */
const image = (value: unknown, fallback: ImageAsset): ImageAsset => {
  const found = asset(value)
  if (!found) return fallback

  const sameFile = found.url === fallback.src
  return {
    src: found.url,
    alt: str(found.alt) ?? (sameFile ? fallback.alt : ''),
    width: num(found.width) ?? (sameFile ? fallback.width : undefined),
    height: num(found.height) ?? (sameFile ? fallback.height : undefined),
    srcSet: sameFile ? fallback.srcSet : undefined,
    sizes: sameFile ? fallback.sizes : undefined,
  }
}

/* -------------------------------------------------------------------------- */
/* Site                                                                       */
/* -------------------------------------------------------------------------- */

const siteData = obj(snapshot?.site)
const seoData = obj(siteData.seo)
const socialRows = rows(siteData.social)

export const site: SiteContent = {
  ...siteBase,
  name: pick(str(siteData.name), siteBase.name),
  shortName: pick(str(siteData.shortName), siteBase.shortName),
  monogram: pick(str(siteData.monogram), siteBase.monogram),
  url: pick(str(siteData.url), siteBase.url),
  locale: pick(str(siteData.locale), siteBase.locale),
  seo: {
    title: pick(str(seoData.title), siteBase.seo.title),
    description: pick(str(seoData.description), siteBase.seo.description),
    ogImage: pick(str(asset(seoData.ogImage)?.url), siteBase.seo.ogImage),
  },
  // nav is not overlaid: the seven destinations are a design decision.
  social: socialRows
    ? socialRows
        .filter((row) => str(row.href))
        .map((row) => ({
          label: str(row.label) ?? '',
          href: str(row.href) as string,
          external: row.external !== false,
        }))
    : siteBase.social,
  footerNote: pick(str(siteData.footerNote), siteBase.footerNote),
}

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

const aboutData = obj(snapshot?.about)
const educationRows = rows(aboutData.education)
const expertiseRows = rows(aboutData.expertise)
const factRows = rows(aboutData.facts)

export const about: AboutContent = {
  ...aboutBase,
  portrait: image(aboutData.portrait, aboutBase.portrait),
  introduction: pick(str(aboutData.introduction), aboutBase.introduction),
  biography: pick(strList(aboutData.biography), [...aboutBase.biography]),
  interests: pick(strList(aboutData.interests), [...aboutBase.interests]),
  facts: factRows
    ? factRows
        .map((row) => ({
          label: str(row.label) ?? '',
          value: str(row.value) ?? '',
        }))
        .filter((fact) => fact.label && fact.value)
    : aboutBase.facts,
  education: educationRows
    ? educationRows.map(
        (row, index): EducationEntry => ({
          degree: str(row.degree) ?? '',
          institution: str(row.institution) ?? '',
          start: pick(str(row.start), aboutBase.education[index]?.start ?? ''),
          end: pick(str(row.end), aboutBase.education[index]?.end ?? ''),
          location: pick(str(row.location), aboutBase.education[index]?.location ?? ''),
          description: str(row.description),
        }),
      )
    : aboutBase.education,
  expertise: expertiseRows
    ? expertiseRows.map((row) => ({
        title: str(row.title) ?? '',
        summary: str(row.summary) ?? '',
      }))
    : aboutBase.expertise,
  // philosophy is not modelled in the database and stays in source.
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

const CATEGORY_IDS: readonly SkillCategoryId[] = [
  'frontend',
  'backend',
  'programming',
  'database',
  'ai-ml',
  'tools-cloud',
]

const skillRows = rows(snapshot?.skills)

export const skills: SkillsContent = {
  ...skillsBase,
  categories: skillRows
    ? skillRows
        .map((row, index): SkillCategory => {
          const base = skillsBase.categories[index]
          return {
            id: oneOf(CATEGORY_IDS, row.id, base?.id ?? 'tools-cloud'),
            label: str(row.label) ?? '',
            summary: str(row.summary) ?? '',
            skills: (rows(row.skills) ?? [])
              .map((skill) => ({
                name: str(skill.name) ?? '',
                note: str(skill.note),
              }))
              .filter((skill) => skill.name),
          }
        })
        .filter((category) => category.label && category.skills.length > 0)
    : skillsBase.categories,
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

const PROJECT_STATUSES: readonly ProjectStatus[] = [
  'live',
  'local',
  'in-progress',
  'archived',
]

const projectRows = rows(snapshot?.projects)
const baseBySlug = new Map(projectsBase.items.map((item) => [item.slug, item]))

const mergedProjects: readonly Project[] = projectRows
  ? projectRows
      .filter((row) => str(row.slug))
      .map((row, index): Project => {
        const slug = str(row.slug) as string
        // Keyed by slug, not by position, so reordering in the CMS cannot
        // graft one project's gallery onto another.
        const base = baseBySlug.get(slug)
        const cover = asset(row.cover)
        return {
          slug,
          title: pick(str(row.title), base?.title ?? ''),
          shortTitle: pick(str(row.shortTitle), base?.shortTitle),
          category: pick(str(row.category), base?.category ?? ''),
          organization: pick(str(row.organization), base?.organization),
          status: oneOf(PROJECT_STATUSES, row.status, base?.status ?? 'local'),
          deploymentNote: pick(str(row.deploymentNote), base?.deploymentNote),
          order: pick(num(row.order), base?.order ?? index),
          highlights: pick(strList(row.highlights), [...(base?.highlights ?? [])]),
          summary: pick(str(row.summary), base?.summary ?? ''),
          description: pick(strList(row.description), [...(base?.description ?? [])]),
          technologies: pick(strList(row.technologies), [
            ...(base?.technologies ?? []),
          ]),
          cover: cover
            ? image(row.cover, base?.cover ?? { src: cover.url, alt: '' })
            : base?.cover,
          // Galleries are not modelled in the database.
          gallery: base?.gallery ?? [],
          github: pick(str(row.githubUrl), base?.github ?? null),
          liveUrl: pick(str(row.liveUrl), base?.liveUrl ?? null),
          features: pick(strList(row.features), [...(base?.features ?? [])]),
          architecture: pick(str(row.architecture), base?.architecture ?? null),
          problem: pick(str(row.problem), base?.problem ?? null),
          challenges: pick(strList(row.challenges), [...(base?.challenges ?? [])]),
          solutions: pick(strList(row.solutions), [...(base?.solutions ?? [])]),
          results: pick(strList(row.results), [...(base?.results ?? [])]),
          featured: row.featured === true,
        }
      })
  : projectsBase.items

export const projects: ProjectsContent = {
  ...projectsBase,
  items: mergedProjects,
}

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */
/* Defined after projects because the hero's featured list is derived from
   them: `featuredProjectSlugs` is not a column, the per-project `featured`
   flag is, and this is where the two representations meet.                   */

const homeData = obj(snapshot?.home)
const notesData = obj(homeData.notes)
const ctaData = obj(homeData.primaryCta)
const backgroundData = obj(homeData.background)
const musicData = obj(homeData.music)
const backgroundVideo = asset(backgroundData.video)
const backgroundPoster = asset(backgroundData.poster)
const resumeAsset = asset(homeData.resume)
const musicAudio = asset(musicData.audio)

const featuredFromSnapshot = projectRows
  ? mergedProjects
      .filter((project) => project.featured)
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((project) => project.slug)
  : []

export const home: HomeContent = {
  ...homeBase,
  greeting: pick(str(homeData.greeting), homeBase.greeting),
  headline: pick(str(homeData.headline), homeBase.headline),
  introduction: pick(str(homeData.introduction), homeBase.introduction),
  roles: pick(strList(homeData.roles), [...homeBase.roles]),
  technologyHighlights: pick(strList(homeData.technologyHighlights), [
    ...homeBase.technologyHighlights,
  ]),
  notes: {
    label: pick(str(notesData.label), homeBase.notes.label),
    lines: pick(strList(notesData.lines), [...homeBase.notes.lines]),
  },
  primaryCta: {
    label: pick(str(ctaData.label), homeBase.primaryCta.label),
    href: pick(str(ctaData.href), homeBase.primaryCta.href),
    external: homeBase.primaryCta.external,
  },
  resume: {
    ...homeBase.resume,
    href: pick(resumeAsset?.url, homeBase.resume.href),
  },
  featuredProjectSlugs:
    featuredFromSnapshot.length > 0
      ? featuredFromSnapshot
      : homeBase.featuredProjectSlugs,
  background: {
    ...homeBase.background,
    src: pick(backgroundVideo?.url, homeBase.background.src),
    poster: pick(backgroundPoster?.url, homeBase.background.poster),
    width: pick(num(backgroundVideo?.width), homeBase.background.width),
    height: pick(num(backgroundVideo?.height), homeBase.background.height),
  },
  music: {
    ...homeBase.music,
    title: pick(str(musicData.title), homeBase.music.title),
    artist: pick(str(musicData.artist), homeBase.music.artist),
    src: pick(musicAudio?.url, homeBase.music.src),
    // Only a boolean overrides this. A missing flag must not quietly turn a
    // placeholder track into a real one.
    isPlaceholder:
      typeof musicData.isPlaceholder === 'boolean'
        ? musicData.isPlaceholder
        : homeBase.music.isPlaceholder,
    defaultVolume: pick(num(musicData.defaultVolume), homeBase.music.defaultVolume),
  },
}

/* -------------------------------------------------------------------------- */
/* Career                                                                     */
/* -------------------------------------------------------------------------- */

const CAREER_TYPES: readonly CareerEntryType[] = [
  'education',
  'experience',
  'milestone',
]

const careerRows = rows(snapshot?.career)

export const career: CareerContent = {
  ...careerBase,
  entries: careerRows
    ? careerRows.map(
        (row, index): CareerEntry => ({
          id: str(row.id) ?? `entry-${index}`,
          title: str(row.title) ?? '',
          organization: str(row.organization) ?? '',
          type: oneOf(CAREER_TYPES, row.type, 'milestone'),
          start: str(row.start) ?? '',
          end: str(row.end) ?? '',
          location: str(row.location) ?? '',
          description: str(row.description) ?? '',
          technologies: strList(row.technologies) ?? [],
        }),
      )
    : careerBase.entries,
}

/* -------------------------------------------------------------------------- */
/* Achievements                                                               */
/* -------------------------------------------------------------------------- */

const ACHIEVEMENT_TYPES: readonly AchievementType[] = [
  'certificate',
  'award',
  'competition',
  'presentation',
  'milestone',
]

const achievementRows = rows(snapshot?.achievements)
const achievementBaseById = new Map(
  achievementsBase.items.map((item) => [item.id, item]),
)

const achievementCategoryRows = rows(snapshot?.achievementCategories)

export const achievements: AchievementsContent = {
  ...achievementsBase,
  // Straight from the CMS, already in the admin's order. No fallback to the
  // base module: it holds none, because a grouping nobody configured would be
  // a grouping this file invented.
  categories: achievementCategoryRows
    ? achievementCategoryRows.flatMap((row) => {
        const id = str(row.id)
        const label = str(row.label)
        return id && label
          ? [{ id, label, summary: str(row.summary) ?? null }]
          : []
      })
    : achievementsBase.categories,
  items: achievementRows
    ? achievementRows.map((row, index): Achievement => {
        const id = str(row.id) ?? `achievement-${index}`
        const base = achievementBaseById.get(id)
        const cover = asset(row.image)
        return {
          id,
          title: pick(str(row.title), base?.title ?? ''),
          type: oneOf(ACHIEVEMENT_TYPES, row.type, base?.type ?? 'certificate'),
          categoryId: str(row.categoryId) ?? null,
          organization: pick(str(row.organization), base?.organization ?? ''),
          date: pick(str(row.date), base?.date ?? ''),
          description: pick(str(row.description), base?.description ?? ''),
          credentialId: pick(str(row.credentialId), base?.credentialId),
          verificationUrl: pick(str(row.verificationUrl), base?.verificationUrl),
          // A withheld document resolves to null in the snapshot, and that is
          // a decision, not missing data: it must override the source module
          // rather than fall back to it. Same for the image.
          document: asset(row.document)?.url,
          image: cover
            ? image(row.image, base?.image ?? { src: cover.url, alt: '' })
            : undefined,
          featured: row.featured === true,
        }
      })
    : achievementsBase.items,
}

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Not overlaid.
 *
 * `social_links` stores a label and an href; a contact channel additionally
 * needs the display value ("github.com/majeed74905"), which cannot be derived
 * from an href without inventing text. Rather than add a parallel table for
 * it, contacts stay in source and the CMS governs the social links only.
 */
export const contacts: ContactsContent = contactsBase
