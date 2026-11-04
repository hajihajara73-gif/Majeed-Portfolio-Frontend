import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api } from '@/lib/api'
import { PageHeader } from '@/components/Layout'
import { Badge, Banner, Button, EmptyState, Spinner } from '@/components/ui'

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
  created_at: string
}

/**
 * The full message, in a modal.
 *
 * Native <dialog> with showModal(), same as the public site's viewers: focus
 * trapping, Escape to close, background inerting and the right role semantics
 * come from the element rather than being hand-rolled.
 *
 * The list truncates subject and sender to stay scannable, so without this
 * there was no way to read a long message or select an address to reply to.
 */
function MessageDialog({
  row,
  onClose,
  onDelete,
}: {
  row: MessageRow
  onClose: () => void
  onDelete: () => void
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
        <p className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-md bg-surface-2 p-3 text-sm text-ink-2">
          {row.body}
        </p>
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-border p-4">
        <a
          href={`mailto:${row.email}?subject=${encodeURIComponent(
            subject.startsWith('Re:') ? subject : `Re: ${subject}`,
          )}`}
          className="rounded-sm border border-border-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold"
        >
          Reply by email
        </a>
        <Button variant="danger" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </dialog>
  )
}

export function Messages() {
  const [rows, setRows] = useState<MessageRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<MessageRow | null>(null)

  const load = useCallback(() => {
    api<MessageRow[]>('/admin/messages')
      .then(setRows)
      .catch((caught) => setError(String(caught)))
  }, [])

  useEffect(load, [load])

  const markRead = async (row: MessageRow) => {
    if (row.is_read) return
    try {
      await api(`/admin/messages/${row.id}`, {
        method: 'PUT',
        body: { is_read: true },
      })
      load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
    }
  }

  const view = (row: MessageRow) => {
    setViewing(row)
    void markRead(row)
  }

  const remove = async (row: MessageRow) => {
    // Deleting a message is irreversible — there is no archive for it on the
    // server — so it is confirmed, and the prompt names the sender.
    if (!confirm(`Delete the message from ${row.name} (${row.email})?`)) return
    try {
      await api(`/admin/messages/${row.id}`, { method: 'DELETE' })
      setViewing(null)
      load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
    }
  }

  if (!rows) return error ? <Banner tone="error">{error}</Banner> : <Spinner />

  const unread = rows.filter((row) => !row.is_read).length

  return (
    <>
      <PageHeader
        title="Messages"
        description={`${rows.length} total · ${unread} unread`}
      />

      {error && (
        <div className="mb-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState>
          No messages yet. Anything sent through the contact form on the public
          site arrives here.
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-border">
          {rows.map((row) => (
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

              <span className="shrink-0 text-xs text-muted">
                {new Date(row.created_at).toLocaleDateString()}
              </span>

              <Button onClick={() => view(row)}>View</Button>
              <Button variant="danger" onClick={() => void remove(row)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      {viewing && (
        <MessageDialog
          row={viewing}
          onClose={() => setViewing(null)}
          onDelete={() => void remove(viewing)}
        />
      )}
    </>
  )
}
