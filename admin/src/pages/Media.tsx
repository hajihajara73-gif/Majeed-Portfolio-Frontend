import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api, downloadFile } from '@/lib/api'
import { PageHeader } from '@/components/Layout'
import {
  Badge,
  Banner,
  Button,
  EmptyState,
  Input,
  Select,
  Spinner,
  Textarea,
  cn,
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

interface ThreadAttachment {
  id: string | null
  filename: string
  content_type: string
  size: number | null
  inline?: boolean
  downloadable: boolean
  blocked_reason: string | null
}

interface ThreadMessage {
  id: string
  direction: string
  from_email: string
  to_email: string
  subject: string | null
  text_body: string
  delivery_status: string
  delivery_error: string | null
  sent_at: string | null
  created_at: string
  // Metadata only. The bytes come from the authenticated endpoint, never
  // from a URL embedded here.
  attachments: ThreadAttachment[]
  // SPF/DKIM/DMARC as Resend evaluated them, or null for anything we sent.
  auth_results: Record<string, string> | null
}

const SIZE_UNITS = ['B', 'kB', 'MB']

function readableSize(bytes: number | null): string {
  if (bytes === null || Number.isNaN(bytes)) return ''
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${SIZE_UNITS[unit]}`
}

/**
 * Attachments on one received message.
 *
 * A blocked attachment is still LISTED, with the reason. Hiding it would
 * leave the admin wondering why a sender said "see attached" and nothing
 * was there; naming it and refusing to fetch it is the honest answer.
 */
function Attachments({
  messageId,
  items,
  onError,
}: {
  messageId: string
  items: ThreadAttachment[]
  onError: (message: string) => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  // Inline images are part of the body, not something the sender attached,
  // so a signature logo does not get announced as an attachment.
  const shown = items.filter((a) => !a.inline)
  if (shown.length === 0) return null

  const fetchOne = async (item: ThreadAttachment) => {
    if (!item.id) return
    setBusy(item.id)
    try {
      await downloadFile(
        `/admin/messages/${messageId}/attachments/${item.id}`,
        item.filename,
      )
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Download failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {shown.map((item, index) => (
        <li key={item.id ?? index}>
          {item.downloadable && item.id ? (
            <Button
              variant="ghost"
              onClick={() => void fetchOne(item)}
              disabled={busy === item.id}
            >
              {busy === item.id ? 'Fetching…' : item.filename}
              {item.size !== null && (
                <span className="ml-1 text-[11px] text-muted">
                  {readableSize(item.size)}
                </span>
              )}
            </Button>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] text-muted"
              title={item.blocked_reason ?? 'Not available'}
            >
              {item.filename}
              <span className="text-danger">
                · {item.blocked_reason ?? 'unavailable'}
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/**
 * SPF/DKIM/DMARC, shown only when something did NOT pass.
 *
 * A green tick on every message trains people to ignore it. This stays
 * silent on a clean result and speaks up on a failure, which is the only
 * time the information changes what you would do.
 */
function AuthWarning({ results }: { results: Record<string, string> | null }) {
  if (!results) return null
  const failed = Object.entries(results).filter(
    ([, verdict]) => verdict !== 'pass',
  )
  if (failed.length === 0) return null
  return (
    <p className="mt-1 rounded-md border border-gold/40 bg-gold/5 p-2 text-[11px] text-ink-2">
      <strong className="font-medium">Sender not verified.</strong>{' '}
      {failed.map(([check, verdict]) => `${check}: ${verdict}`).join(', ')}.
      Treat the address on this message as unconfirmed.
    </p>
  )
}

/**
 * One entry in the conversation.
 *
 * Inbound and outbound are distinguished by indent and surface rather than
 * by a label alone — the shape tells you who spoke before you read a word,
 * which is the whole job of a timeline.
 */
function TimelineEntry({
  side,
  who,
  address,
  when,
  body,
  status,
  error,
  attachments,
  authResults,
  messageId,
  onError,
}: {
  side: 'inbound' | 'outbound'
  who: string
  address?: string
  when: string
  body: string
  status?: string
  error?: string | null
  attachments?: ThreadAttachment[]
  authResults?: Record<string, string> | null
  messageId?: string
  onError?: (message: string) => void
}) {
  const outbound = side === 'outbound'
  return (
    <div className={cn('mb-3', outbound && 'pl-8')}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink">{who}</span>
        {/* The address the message actually came from, which is not always
            the one on the enquiry — a visitor may reply from a different
            account, and that is worth seeing rather than papering over. */}
        {address && (
          <span className="font-mono text-[11px] text-muted">{address}</span>
        )}
        <span className="text-[11px] text-muted">
          {new Date(when).toLocaleString()}
        </span>
        {status && status !== 'sent' && status !== 'received' && (
          <Badge tone={status === 'failed' ? 'gold' : 'muted'}>{status}</Badge>
        )}
      </div>
      <p
        className={cn(
          'whitespace-pre-wrap rounded-md p-3 text-sm',
          outbound
            ? 'border border-gold/30 bg-gold/5 text-ink'
            : 'bg-surface-2 text-ink-2',
        )}
      >
        {body}
      </p>
      <AuthWarning results={authResults ?? null} />
      {messageId && attachments && attachments.length > 0 && onError && (
        <Attachments
          messageId={messageId}
          items={attachments}
          onError={onError}
        />
      )}
      {error && (
        <p className="mt-1 rounded-md border border-danger/40 bg-danger/5 p-2 font-mono text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
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
  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(
    null,
  )

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

  // Load the conversation. Same fetch-in-effect shape as everywhere else:
  // the work is in an async continuation and `cancelled` stops a late
  // response writing state after the dialog has moved on.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const items = await api<ThreadMessage[]>(
          `/admin/messages/${row.id}/thread`,
        )
        if (!cancelled) setThread(items)
      } catch {
        // A thread that will not load must not blank the message itself —
        // the enquiry is still readable above, which is the important part.
        if (!cancelled) setThread([])
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [row.id])

  const sendReply = async () => {
    // Guard, not just a disabled button: the textarea submits on Ctrl+Enter
    // and a second press can land before the re-render.
    if (sending || !reply.trim()) return
    setSending(true)
    setNotice(null)
    try {
      const result = await api<{
        status: string
        message: string
        email: ThreadMessage | null
      }>(`/admin/messages/${row.id}/reply`, {
        method: 'POST',
        body: { body: reply },
      })
      if (result.email) setThread((previous) => [...previous, result.email!])
      if (result.status === 'sent') {
        setReply('')
        setNotice({ tone: 'ok', text: result.message })
      } else {
        // Saved but not delivered. The text stays in the box so nothing the
        // operator typed is lost.
        setNotice({ tone: 'bad', text: result.message })
      }
    } catch (caught) {
      setNotice({
        tone: 'bad',
        text: caught instanceof ApiError ? caught.message : String(caught),
      })
    } finally {
      setSending(false)
    }
  }

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

      <div className="max-h-[60vh] overflow-y-auto p-4">
        {/* The original enquiry opens the timeline — it is the inbound
            message that started the thread, so it is drawn like one. */}
        <TimelineEntry
          side="inbound"
          who={row.name}
          when={row.created_at}
          body={row.body}
        />

        {thread.map((m) => (
          <TimelineEntry
            key={m.id}
            side={m.direction === 'outbound' ? 'outbound' : 'inbound'}
            who={m.direction === 'outbound' ? 'You' : row.name}
            // Only for received mail: showing our own sending address back
            // to us on every reply is noise.
            address={m.direction === 'inbound' ? m.from_email : undefined}
            when={m.created_at}
            body={m.text_body}
            status={m.delivery_status}
            error={m.delivery_error}
            attachments={m.attachments}
            authResults={m.auth_results}
            messageId={row.id}
            onError={(text) => setNotice({ tone: 'bad', text })}
          />
        ))}

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

      {/* The composer. Replies go through Resend from the verified domain,
          so they thread properly and are recorded — which a mailto: link
          could never do. The mailto below remains as an escape hatch. */}
      <div className="border-t border-border p-4">
        <label
          htmlFor="reply-body"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted"
        >
          Reply to {row.name} · {row.email}
        </label>
        <Textarea
          id="reply-body"
          rows={4}
          value={reply}
          disabled={sending}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void sendReply()
          }}
          placeholder={`Write your reply — it will be sent as "${
            subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`
          }"`}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={() => void sendReply()}
            disabled={sending || !reply.trim()}
          >
            {sending ? 'Sending…' : 'Send reply'}
          </Button>
          <span className="text-[11px] text-muted">Ctrl+Enter to send</span>
          {notice && (
            <span
              className={cn(
                'text-xs',
                notice.tone === 'ok' ? 'text-forest-bright' : 'text-danger',
              )}
            >
              {notice.text}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-border p-4">
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${row.email}?subject=${encodeURIComponent(
              subject.startsWith('Re:') ? subject : `Re: ${subject}`,
            )}`}
            className="rounded-sm border border-border-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold"
          >
            Open in mail app
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
