/**
 * The published snapshot, if one has been exported.
 *
 * `backend` writes `snapshot.json` here at build time
 * (`python -m app.export`). It is deliberately OPTIONAL: `import.meta.glob`
 * returns an empty object when the file is absent, where a plain
 * `import './snapshot.json'` would fail the build. That is the property that
 * keeps this repository buildable by anyone who has never run the CMS.
 *
 * Nothing here reaches the network. The file is baked into the bundle.
 */

/** An asset as the API serialises it — a URL plus the alt text it was given. */
export interface SnapshotAsset {
  readonly id: string
  readonly kind: string
  readonly url: string
  readonly alt: string | null
  readonly width: number | null
  readonly height: number | null
}

export interface SnapshotMeta {
  readonly source: 'published' | 'draft'
  readonly snapshotId: string | null
  readonly checksum: string
  readonly publishedAt: string | null
  readonly mediaFiles: number
}

/**
 * Loosely typed on purpose. This is data that crossed a process boundary, so
 * every field is treated as possibly absent and is checked before use rather
 * than trusted because a type says so.
 */
export interface SnapshotData {
  readonly _meta?: SnapshotMeta
  readonly site?: Record<string, unknown>
  readonly home?: Record<string, unknown>
  readonly about?: Record<string, unknown>
  readonly skills?: readonly Record<string, unknown>[]
  readonly projects?: readonly Record<string, unknown>[]
  readonly career?: readonly Record<string, unknown>[]
  readonly achievements?: readonly Record<string, unknown>[]
  readonly achievementCategories?: readonly Record<string, unknown>[]
}

const modules = import.meta.glob<{ default: SnapshotData }>('./snapshot.json', {
  eager: true,
})

export const snapshot: SnapshotData | null =
  modules['./snapshot.json']?.default ?? null

/** True when this build is serving CMS content rather than the source modules. */
export const isPublished = snapshot?._meta?.source === 'published'
