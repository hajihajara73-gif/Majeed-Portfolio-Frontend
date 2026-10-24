/**
 * Content type contracts.
 *
 * These types are the seam between CONTENT and DESIGN. Components read these
 * shapes and never contain copy of their own. When the Admin CMS arrives later,
 * it replaces the `src/content/*.ts` modules — these types stay, and become the
 * API response schema.
 *
 * RULE: nothing in `src/content/` may be invented. Anything not supplied by
 * Mohammed is a `Todo` string so it is impossible to ship by accident.
 */

/**
 * A value that has not been supplied yet.
 *
 * Rendering helpers treat this as "hide me" rather than printing it, and
 * `scripts`/reviews can grep for `TODO_REPLACE_` to list what is outstanding.
 */
export type Todo = `TODO_REPLACE_${string}`

/** Narrowing helper: true when a field is still an unfilled placeholder. */
export const isTodo = (value: string | null | undefined): value is Todo =>
  typeof value === 'string' && value.startsWith('TODO_REPLACE_')

/** Returns the value only if it is real content, otherwise `undefined`. */
export const resolved = (value: string | null | undefined): string | undefined =>
  typeof value === 'string' && value.length > 0 && !isTodo(value)
    ? value
    : undefined

/**
 * Keeps only the real entries of a list. A list that is entirely unfilled comes
 * back empty, so the caller can drop the whole block rather than render a
 * heading above nothing.
 */
export const resolvedList = (
  values: readonly (string | null | undefined)[],
): string[] => values.map(resolved).filter((v): v is string => v !== undefined)

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

export interface ImageAsset {
  /** Path under /public, e.g. `/assets/images/profile.webp` */
  readonly src: string | Todo
  /** Required. Empty string only for decorative images. */
  readonly alt: string
  readonly width?: number
  readonly height?: number
  /** Responsive candidates, e.g. `/a-640.webp 640w, /a-1024.webp 1024w` */
  readonly srcSet?: string
  readonly sizes?: string
}

export interface Link {
  readonly label: string
  readonly href: string | Todo
  /** Set for links leaving the site. */
  readonly external?: boolean
}

export type SectionId =
  | 'home'
  | 'about'
  | 'skills'
  | 'projects'
  | 'career'
  | 'certificates'
  | 'achievements'
  | 'contacts'

export interface NavItem {
  readonly id: SectionId
  readonly label: string
}

/* -------------------------------------------------------------------------- */
/* Site                                                                       */
/* -------------------------------------------------------------------------- */

export interface SiteContent {
  readonly name: string
  readonly shortName: string
  readonly monogram: string
  /** Used for canonical URLs, OG tags and the sitemap. */
  readonly url: string | Todo
  readonly locale: string
  readonly seo: {
    readonly title: string
    readonly description: string
    readonly ogImage: string | Todo
  }
  readonly nav: readonly NavItem[]
  readonly social: readonly Link[]
  readonly footerNote: string
}

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

export interface BackgroundVideo {
  readonly src: string
  readonly poster: string
  readonly type: string
  /** Seconds. Used to decide whether the loop needs a crossfade. */
  readonly durationSeconds: number
  readonly width: number
  readonly height: number
}

export interface MusicTrack {
  readonly title: string | Todo
  readonly artist: string | Todo
  readonly src: string | Todo
  readonly cover?: ImageAsset
  /**
   * True while this is stand-in audio rather than the real track. The player
   * labels it visibly so a temporary asset can never be mistaken for a choice.
   */
  readonly isPlaceholder?: boolean
  readonly defaultVolume?: number
}

export interface HomeContent {
  readonly greeting: string
  readonly headline: string
  readonly roles: readonly string[]
  readonly introduction: string
  readonly primaryCta: Link
  readonly resume: Link
  /** Slugs referencing `projects.ts`. Order is the display order. */
  readonly featuredProjectSlugs: readonly string[]
  readonly technologyHighlights: readonly string[]
  readonly background: BackgroundVideo
  readonly music: MusicTrack
  /** The small ambient "notes" panel in the approved design. */
  readonly notes: {
    readonly label: string
    readonly lines: readonly string[]
  }
}

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

export interface EducationEntry {
  readonly degree: string
  readonly institution: string
  readonly start: string | Todo
  readonly end: string | Todo
  readonly location: string | Todo
  readonly description?: string | Todo
}

export interface AboutContent {
  readonly portrait: ImageAsset
  readonly introduction: string
  readonly biography: readonly string[]
  /** Short verified facts. Never a fabricated metric. */
  readonly facts: readonly { readonly label: string; readonly value: string }[]
  readonly education: readonly EducationEntry[]
  readonly interests: readonly string[]
  readonly expertise: readonly { readonly title: string; readonly summary: string }[]
  readonly philosophy: readonly { readonly title: string; readonly body: string }[]
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

export type SkillCategoryId =
  | 'frontend'
  | 'backend'
  | 'programming'
  | 'database'
  | 'ai-ml'
  | 'tools-cloud'

export interface Skill {
  readonly name: string
  /** Short factual note. No invented proficiency percentages. */
  readonly note?: string
}

export interface SkillCategory {
  readonly id: SkillCategoryId
  readonly label: string
  readonly summary: string
  readonly skills: readonly Skill[]
}

export interface SkillsContent {
  readonly eyebrow: string
  readonly heading: string
  readonly introduction: string
  readonly categories: readonly SkillCategory[]
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export type ProjectStatus = 'live' | 'local' | 'in-progress' | 'archived'

export interface Project {
  readonly slug: string
  readonly title: string
  readonly shortTitle?: string
  readonly category: string
  /** Who it was built for, when that is part of the story. */
  readonly organization?: string
  readonly status: ProjectStatus
  /**
   * Shown instead of a live link when there is no public deployment, e.g.
   * "Local deployment". Never invent a URL to fill this gap.
   */
  readonly deploymentNote?: string
  /**
   * Display order, lowest first. Explicit rather than array position so a CMS
   * can reorder later without rewriting the list.
   */
  readonly order: number
  /**
   * Short, verified capability statements. Every one must be provable from the
   * repository — this is the section a reader will check against the source.
   */
  readonly highlights: readonly string[]
  /** One-line overview. */
  readonly summary: string | Todo
  readonly description: readonly (string | Todo)[]
  readonly technologies: readonly string[]
  readonly cover?: ImageAsset
  /** Screenshots. Rendered as a gallery when non-empty. */
  readonly gallery: readonly ImageAsset[]
  readonly github: string | Todo | null
  /** Public deployment. `null` when the project only runs locally. */
  readonly liveUrl: string | Todo | null
  readonly features: readonly (string | Todo)[]
  readonly architecture: string | Todo | null
  /** What made this hard. */
  readonly problem: string | Todo | null
  readonly challenges: readonly (string | Todo)[]
  readonly solutions: readonly (string | Todo)[]
  /** Outcome. Only ever real, measured results — never invented metrics. */
  readonly results: readonly (string | Todo)[]
  readonly featured: boolean
}

export interface ProjectsContent {
  readonly eyebrow: string
  readonly heading: string
  readonly introduction: string
  readonly items: readonly Project[]
}

/* -------------------------------------------------------------------------- */
/* Career                                                                     */
/* -------------------------------------------------------------------------- */

export type CareerEntryType = 'education' | 'experience' | 'milestone'

export interface CareerEntry {
  readonly id: string
  readonly title: string
  readonly organization: string
  readonly type: CareerEntryType
  readonly start: string | Todo
  readonly end: string | Todo | 'present'
  readonly location: string | Todo
  readonly description: string | Todo
  readonly technologies: readonly string[]
}

export interface CareerContent {
  readonly eyebrow: string
  readonly heading: string
  readonly introduction: string
  readonly entries: readonly CareerEntry[]
}

/* -------------------------------------------------------------------------- */
/* Achievements                                                               */
/* -------------------------------------------------------------------------- */

export type AchievementType =
  | 'certificate'
  | 'award'
  | 'competition'
  | 'presentation'
  | 'milestone'

/** A topical grouping for certificates, ordered in the admin. */
export interface AchievementCategory {
  readonly id: string
  readonly label: string
  readonly summary?: string | null
}

export interface Achievement {
  readonly id: string
  readonly title: string
  readonly type: AchievementType
  /** Category slug, or null when the entry is not filed under one. */
  readonly categoryId?: string | null
  readonly organization: string | Todo
  readonly date: string | Todo
  readonly description: string | Todo
  readonly credentialId?: string | Todo
  readonly verificationUrl?: string | Todo
  readonly document?: string | Todo
  readonly image?: ImageAsset
  readonly featured: boolean
}

export interface AchievementsContent {
  readonly eyebrow: string
  readonly heading: string
  readonly introduction: string
  /** May be empty — the section renders an honest empty state. */
  readonly items: readonly Achievement[]
  readonly emptyState: string
  /** In the order the admin set. Certificates group under these. */
  readonly categories: readonly AchievementCategory[]
  /** Copy for the separate certificates section. */
  readonly certificates: {
    readonly eyebrow: string
    readonly heading: string
    readonly introduction: string
  }
}

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

export interface ContactChannel {
  readonly id: 'email' | 'phone' | 'github' | 'linkedin'
  readonly label: string
  readonly value: string | Todo
  readonly href: string | Todo
}

export interface ContactsContent {
  readonly eyebrow: string
  readonly heading: string
  readonly introduction: string
  readonly availability: readonly string[]
  readonly channels: readonly ContactChannel[]
  readonly form: {
    readonly heading: string
    readonly submitLabel: string
    readonly successMessage: string
    /** No backend yet. Wired in a later phase. */
    readonly endpoint: string | Todo | null
  }
}
