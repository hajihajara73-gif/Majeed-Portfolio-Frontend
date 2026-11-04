import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/Layout'
import { Badge, Banner, Spinner } from '@/components/ui'

interface DashboardData {
  counts: Record<string, number>
  publish: {
    published: boolean
    checksum: string | null
    published_at: string | null
    snapshot_id: string | null
  }
  last_content_update: string | null
}

/**
 * One card per count, and each card counts the thing it is named after.
 *
 * Certificates and Achievements are listed separately because they ARE
 * separate sections — in the admin, in the nav, and on the public site. They
 * share one table, split by `achievement_type`, and this card used to show
 * the whole table under the name "Achievements": 11, when the truth is 10
 * certificates and 1 achievement. The backend now returns both counts.
 */
const CARDS: { key: string; label: string; to: string }[] = [
  { key: 'projects', label: 'Projects', to: '/projects' },
  { key: 'certificates', label: 'Certificates', to: '/certificates' },
  { key: 'achievements', label: 'Achievements', to: '/achievements' },
  { key: 'skills', label: 'Skills', to: '/skills' },
  { key: 'media', label: 'Media', to: '/media' },
  { key: 'social_links', label: 'Social links', to: '/social' },
  { key: 'messages', label: 'Messages', to: '/messages' },
]

function when(value: string | null): string {
  if (!value) return 'never'
  return new Date(value).toLocaleString()
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<DashboardData>('/admin/dashboard')
      .then(setData)
      .catch((caught) => setError(String(caught)))
  }, [])

  if (error) return <Banner tone="error">{error}</Banner>
  if (!data) return <Spinner />

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Every number here is a live count from the database."
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <li key={card.key}>
            <Link
              to={card.to}
              className="card block p-4 transition-colors hover:border-gold/40"
            >
              <span className="text-xs uppercase tracking-wide text-muted">
                {card.label}
              </span>
              <span className="mt-1 block text-2xl font-semibold text-ink">
                {data.counts[card.key] ?? 0}
              </span>
              {card.key === 'projects' && (
                <span className="mt-1 block text-xs text-muted">
                  {data.counts.projects_published ?? 0} published
                </span>
              )}
              {card.key === 'messages' && (
                <span className="mt-1 block text-xs text-muted">
                  {data.counts.messages_unread ?? 0} unread
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {/* Recent activity was removed from this page by request. The audit log
          it read is untouched and `GET /admin/activity` still serves it —
          nothing was deleted, it is just no longer on the dashboard. */}
      <section className="mt-6">
        <div className="card p-4 lg:max-w-md">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Publication
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {data.publish.published ? (
                <Badge tone="live">Published</Badge>
              ) : (
                <Badge tone="muted">Never published</Badge>
              )}
            </div>
            <p className="text-ink-2">
              Last published: <span className="text-ink">{when(data.publish.published_at)}</span>
            </p>
            <p className="text-ink-2">
              Last content change:{' '}
              <span className="text-ink">{when(data.last_content_update)}</span>
            </p>
            {data.publish.checksum && (
              <p className="font-mono text-xs text-muted">
                {data.publish.checksum.slice(0, 16)}…
              </p>
            )}
            <Link
              to="/publish"
              className="inline-block pt-1 text-sm text-gold underline-offset-4 hover:underline"
            >
              Go to publish →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
