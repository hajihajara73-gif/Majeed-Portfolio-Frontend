import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api } from '@/lib/api'
import { PageHeader } from '@/components/Layout'
import {
  Badge,
  Banner,
  Button,
  EmptyState,
  Input,
  Select,
  Spinner,
} from '@/components/ui'

interface MediaRow {
  id: string
  kind: string
  storage_key: string
  original_filename: string
  content_type: string
  byte_size: number
  width: number | null
  height: number | null
  is_public: boolean
  created_at: string
  reference_count: number
}

function size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function Media() {
  const [rows, setRows] = useState<MediaRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    api<MediaRow[]>('/admin/media')
      .then(setRows)
      .catch((caught) => setError(String(caught)))
  }, [])

  useEffect(load, [load])

  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      await api('/admin/media', { method: 'POST', formData: form })
      load()
    } catch (caught) {
      // The API rejects on sniffed content, not the extension, so the message
      // is worth showing verbatim.
      setError(caught instanceof ApiError ? caught.message : String(caught))
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const remove = async (row: MediaRow) => {
    if (!confirm(`Delete ${row.original_filename}?`)) return
    try {
      await api(`/admin/media/${row.id}`, { method: 'DELETE' })
      load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
    }
  }

  if (!rows) return error ? <Banner tone="error">{error}</Banner> : <Spinner />

  return (
    <>
      <PageHeader
        title="Media"
        description="Images, video, audio and documents. Files in use cannot be deleted."
        actions={
          <>
            <input
              ref={fileInput}
              type="file"
              className="sr-only"
              id="media-upload"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void upload(file)
              }}
            />
            <Button
              variant="primary"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
            >
              {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      <p className="mb-4 text-xs text-muted">
        Accepted: JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, MP3, M4A, PDF. SVG is
        rejected on purpose — it can carry scripts.
      </p>

      {rows.length === 0 ? (
        <EmptyState>No files yet.</EmptyState>
      ) : (
        <ul className="card divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{row.original_filename}</p>
                <p className="truncate font-mono text-[11px] text-muted">
                  {row.id}
                </p>
              </div>

              <Badge>{row.kind}</Badge>
              {!row.is_public && <Badge tone="gold">private</Badge>}
              {row.reference_count > 0 && (
                <Badge tone="live">used {row.reference_count}×</Badge>
              )}

              <span className="text-xs text-muted">
                {size(row.byte_size)}
                {row.width ? ` · ${row.width}×${row.height}` : ''}
              </span>

              <Button
                onClick={() => {
                  void navigator.clipboard.writeText(row.id)
                  setCopied(row.id)
                  window.setTimeout(() => setCopied(null), 1500)
                }}
              >
                {copied === row.id ? 'Copied' : 'Copy id'}
              </Button>
              <Button
                variant="danger"
                onClick={() => void remove(row)}
                disabled={row.reference_count > 0}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

interface MessageRow {
  id: string
  name: string
  email: string
  subject: string | null
  body: string
  is_read: boolean
  is_archived: boolean
  created_at: string
  email_delivery_status: string
  resend_email_id: string | null
  email_error: string | null
  email_sent_at: string | null
  email_attempts: number
}

interface MessageCounts {
  total: number
  unread: number
  read: number
  archived: number
  email_failed: number
}

interface MessagePage {
  items: MessageRow[]
  total: number
  limit: number
  offset: number
  counts: MessageCounts
}

const PAGE_SIZE = 25

/** Delivery status as a badge. The vocabulary matches the database exactly. */
function DeliveryBadge({ row }: { row: MessageRow }) {
  const map: Record<string, { tone: 'live' | 'gold' | 'muted'; label: string }> = {
    sent: { tone: 'live', label: 'emailed' },
    pending: { tone: 'gold', label: 'email pending' },
    failed: { tone: 'gold', label: 'email failed' },
    disabled: { tone: 'muted', label: 'no email' },
  }
  const shown = map[row.email_delivery_status] ?? {
    tone: 'muted' as const,
    label: row.email_delivery_status,
  }
  return <Badge tone={shown.tone}>{shown.label}</Badge>
}

/**
 * One message, full size.
 *
 * Native <dialog> with showModal(), like every other modal here: focus
 * trapping, Escape and background inerting come from the element.
 */
function MessageDialog({
  row,
  onClose,
  onDelete,
  onArchive,
  onResend,
  busy,
}: {
  row: MessageRow
  onClose: () => void
  onDelete: () => void
  onArchive: () => void
  onResend: () => void
  busy: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose()
    }
    dialog.addEventListener('click', onClick)
    dialog.addEventListener('close', onClose)
    return () => {
      dialog.removeEventListener('click', onClick)
      dialog.removeEventListener('close', onClose)
    }
  }, [onClose])

  const subject = row.subject ?? '(no subject)'

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="message-subject"
      className="w-[min(92vw,42rem)] rounded-lg border border-border bg-surface p-0 text-ink backdrop:bg-black/60"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h2 id="message-subject" className="text-base font-semibold text-ink">
            {subject}
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            {row.name} ·{' '}
            <a
              href={`mailto:${row.email}`}
              className="text-gold underline-offset-4 hover:underline"
            >
              {row.email}
            </a>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {new Date(row.created_at).toLocaleString()}
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="p-4">
        <p className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md bg-surface-2 p-3 text-sm text-ink-2">
          {row.body}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <DeliveryBadge row={row} />
          {row.email_sent_at && (
            <span>notified {new Date(row.email_sent_at).toLocaleString()}</span>
          )}
          {row.email_attempts > 0 && <span>· {row.email_attempts} attempt(s)</span>}
        </div>

        {/* Resend's own words. Shown because a failure is only actionable if
            you can see why it failed; this is an authenticated admin page. */}
        {row.email_error && (
          <p className="mt-2 rounded-md border border-danger/40 bg-danger/5 p-2 font-mono text-[11px] text-danger">
            {row.email_error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-border p-4">
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${row.email}?subject=${encodeURIComponent(
              subject.startsWith('Re:') ? subject : `Re: ${subject}`,
            )}`}
            className="rounded-sm border border-border-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold"
          >
            Reply by email
          </a>
          {row.email_delivery_status !== 'sent' && (
            <Button onClick={onResend} disabled={busy}>
              {busy ? 'Sending…' : 'Retry notification'}
            </Button>
          )}
          <Button onClick={onArchive} disabled={busy}>
            {row.is_archived ? 'Unarchive' : 'Archive'}
          </Button>
        </div>
        <Button variant="danger" onClick={onDelete} disabled={busy}>
          Delete
        </Button>
      </div>
    </dialog>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="mt-0.5 block text-xl font-semibold text-ink">{value}</span>
    </div>
  )
}

export function Messages() {
  const [page, setPage] = useState<MessagePage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<MessageRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // `query` is what is typed; `search` is what is sent. Separating them is
  // what makes the debounce possible without the input feeling laggy.
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [archived, setArchived] = useState(false)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    // Debounced, so typing does not fire a request per keystroke.
    const timer = window.setTimeout(() => {
      setSearch(query)
      setOffset(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  /** Fetch only — the callers decide what to do with the result. */
  const fetchPage = useCallback((): Promise<MessagePage> => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
      status: statusFilter,
      archived: String(archived),
    })
    if (search) params.set('q', search)
    return api<MessagePage>(`/admin/messages?${params}`)
  }, [offset, statusFilter, archived, search])

  // React's documented fetch-in-effect shape, as used in lib/auth.tsx: the
  // work happens in an async continuation rather than the effect body, and
  // `cancelled` stops a slow response from overwriting newer state after
  // the filters have moved on.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const next = await fetchPage()
        if (cancelled) return
        setPage(next)
        setError(null)
      } catch (caught) {
        if (cancelled) return
        setError(caught instanceof ApiError ? caught.message : String(caught))
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [fetchPage])

  /** Re-fetch on demand: the Refresh button, and after any mutation. */
  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      setPage(await fetchPage())
      setError(null)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
    } finally {
      setRefreshing(false)
    }
  }, [fetchPage])


  const patch = async (row: MessageRow, body: Record<string, unknown>) => {
    setBusy(true)
    try {
      await api(`/admin/messages/${row.id}`, { method: 'PUT', body })
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  const view = (row: MessageRow) => {
    setViewing(row)
    if (!row.is_read) void patch(row, { is_read: true })
  }

  const toggleRead = (row: MessageRow) =>
    void patch(row, { is_read: !row.is_read })

  const toggleArchive = async (row: MessageRow) => {
    await patch(row, { is_archived: !row.is_archived })
    setViewing(null)
  }

  const resend = async (row: MessageRow) => {
    setBusy(true)
    try {
      const updated = await api<MessageRow>(`/admin/messages/${row.id}/resend`, {
        method: 'POST',
      })
      setViewing(updated)
      await load()
      if (updated.email_delivery_status !== 'sent') {
        setError(updated.email_error ?? 'The notification could not be sent.')
      } else {
        setError(null)
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row: MessageRow) => {
    // Irreversible — there is no server-side archive of a deleted message —
    // so it is confirmed, and the prompt names the sender.
    if (!confirm(`Delete the message from ${row.name} (${row.email})?`)) return
    setBusy(true)
    try {
      await api(`/admin/messages/${row.id}`, { method: 'DELETE' })
      setViewing(null)
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  if (!page) return error ? <Banner tone="error">{error}</Banner> : <Spinner />

  const { items, counts, total } = page
  const showing = `${total === 0 ? 0 : offset + 1}–${Math.min(
    offset + items.length,
    total,
  )} of ${total}`

  return (
    <>
      <PageHeader
        title="Messages"
        description="Everything sent through the contact form on the public site."
        actions={
          <Button onClick={() => void load()} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={counts.total} />
        <Stat label="Unread" value={counts.unread} />
        <Stat label="Read" value={counts.read} />
        <Stat label="Archived" value={counts.archived} />
      </div>

      {counts.email_failed > 0 && (
        <div className="mb-4">
          <Banner tone="warning">
            {counts.email_failed} notification
            {counts.email_failed === 1 ? '' : 's'} could not be emailed. Open a
            message and use Retry — the message itself is safe either way.
          </Banner>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or subject"
          className="max-w-xs"
          aria-label="Search messages"
        />
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setOffset(0)
          }}
          aria-label="Filter by read state"
          className="max-w-[10rem]"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </Select>
        <Button
          onClick={() => {
            setArchived((value) => !value)
            setOffset(0)
          }}
        >
          {archived ? 'Showing archived' : 'Show archived'}
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState>
          {search || statusFilter !== 'all' || archived
            ? 'No messages match this filter.'
            : 'No messages yet. Anything sent through the contact form on the public site arrives here.'}
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-border">
          {items.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              {!row.is_read && <Badge tone="gold">new</Badge>}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">
                  {row.subject ?? '(no subject)'}
                </p>
                <p className="truncate text-xs text-muted">
                  {row.name} · {row.email}
                </p>
              </div>

              <DeliveryBadge row={row} />

              <span className="shrink-0 text-xs text-muted">
                {new Date(row.created_at).toLocaleDateString()}
              </span>

              <Button onClick={() => view(row)}>View</Button>
              <Button onClick={() => toggleRead(row)} disabled={busy}>
                {row.is_read ? 'Unread' : 'Read'}
              </Button>
              <Button variant="danger" onClick={() => void remove(row)} disabled={busy}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted">{showing}</span>
          <div className="flex gap-2">
            <Button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {viewing && (
        <MessageDialog
          row={viewing}
          busy={busy}
          onClose={() => setViewing(null)}
          onDelete={() => void remove(viewing)}
          onArchive={() => void toggleArchive(viewing)}
          onResend={() => void resend(viewing)}
        />
      )}
    </>
  )
}
