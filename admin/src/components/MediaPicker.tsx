import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api, apiUrl } from '@/lib/api'
import { Badge, Banner, Button, Input, Spinner, cn } from '@/components/ui'

export interface MediaRow {
  id: string
  kind: string
  storage_key: string
  original_filename: string
  content_type: string
  byte_size: number
  width: number | null
  height: number | null
  alt_text: string | null
  title: string | null
  is_public: boolean
  reference_count: number
}

/**
 * The admin-authenticated preview URL.
 *
 * Built through `apiUrl` because in production this points at Render while the
 * admin itself is served by Vercel. The session cookie still has to reach it,
 * which it does when the two share a registrable domain — `SameSite=Lax` allows
 * same-site subresource requests. Across different registrable domains the
 * browser withholds the cookie and every thumbnail 401s, which is one of the
 * reasons a shared parent domain is the documented setup.
 */
export const fileUrl = (id: string): string => apiUrl(`/admin/media/${id}/file`)

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const KIND_LABEL: Record<string, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  document: 'PDF',
}

/**
 * View one asset full size, without leaving the form.
 *
 * The thumbnail is 112x80, which is enough to recognise a file and not enough
 * to read a certificate or check that the right scan is attached — and there
 * was previously no way to open an attachment at all from the editor, only
 * Replace and Clear.
 *
 * Native <dialog> with showModal(), like every other modal in this project:
 * focus trapping, Escape to close and background inerting come from the
 * element. Each kind is rendered with the element that actually handles it,
 * and "Open in new tab" is always present because an embedded PDF is the one
 * thing browsers are least consistent about.
 */
function MediaViewer({ row, onClose }: { row: MediaRow; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const src = fileUrl(row.id)

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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="media-viewer-title"
      className="w-[min(94vw,64rem)] rounded-lg border border-border bg-surface p-0 text-ink backdrop:bg-black/70"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h2
            id="media-viewer-title"
            className="truncate text-base font-semibold text-ink"
          >
            {row.title || row.original_filename}
          </h2>
          <p className="truncate text-xs text-muted">
            {KIND_LABEL[row.kind] ?? row.kind} · {formatSize(row.byte_size)}
            {row.width ? ` · ${row.width}×${row.height}` : ''}
            {row.is_public ? '' : ' · private'}
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="max-h-[70vh] overflow-auto bg-bg p-4">
        {row.kind === 'image' && (
          <img
            src={src}
            alt={row.alt_text ?? row.original_filename}
            className="mx-auto max-w-full rounded-sm"
          />
        )}
        {row.kind === 'document' && (
          <iframe
            src={src}
            title={row.original_filename}
            className="h-[65vh] w-full rounded-sm border border-border bg-surface"
          />
        )}
        {row.kind === 'video' && (
          <video src={src} controls className="mx-auto max-h-[65vh] w-full rounded-sm" />
        )}
        {row.kind === 'audio' && (
          <audio src={src} controls className="w-full" />
        )}
        {!['image', 'document', 'video', 'audio'].includes(row.kind) && (
          <p className="text-sm text-muted">
            No preview for this file type. Use “Open in new tab”.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4">
        <p className="truncate font-mono text-[11px] text-muted">
          {row.storage_key}
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm border border-border-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold"
        >
          Open in new tab
        </a>
      </div>
    </dialog>
  )
}

/**
 * Thumbnail for one asset.
 *
 * Only images get a real preview. Video, audio and PDFs get a typographic
 * plate instead of a broken <img> — rendering a PDF thumbnail would mean
 * decoding it, which is not worth a dependency here.
 */
function Thumb({ row, className }: { row: MediaRow; className?: string }) {
  if (row.kind === 'image') {
    return (
      <img
        src={fileUrl(row.id)}
        alt={row.alt_text ?? ''}
        loading="lazy"
        decoding="async"
        className={cn('h-full w-full bg-bg object-contain', className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-bg',
        className,
      )}
    >
      <span className="font-mono text-xs uppercase text-muted">
        {KIND_LABEL[row.kind] ?? row.kind}
      </span>
    </div>
  )
}

/**
 * Modal library.
 *
 * Built on <dialog> + showModal() so focus trapping, Escape-to-close and
 * background inerting come from the browser rather than being hand-rolled.
 */
export function MediaPicker({
  kind,
  onSelect,
  onClose,
}: {
  kind?: string
  onSelect: (row: MediaRow) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<MediaRow[] | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(kind ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api<MediaRow[]>('/admin/media')
      .then(setRows)
      .catch((caught) => setError(String(caught)))
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const onCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', onCancel)
    return () => dialog.removeEventListener('cancel', onCancel)
  }, [onClose])

  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const created = await api<MediaRow>('/admin/media', {
        method: 'POST',
        formData: form,
      })
      load()
      // Uploading from inside the picker almost always means "use this one".
      onSelect(created)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const visible = (rows ?? []).filter((row) => {
    if (filter && row.kind !== filter) return false
    if (!query) return true
    const haystack = `${row.original_filename} ${row.title ?? ''} ${row.alt_text ?? ''}`
    return haystack.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="media-picker-title"
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className="m-auto w-[min(94vw,62rem)] max-w-none rounded-lg border border-border-strong bg-surface p-0 text-ink backdrop:bg-bg/80"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <h2 id="media-picker-title" className="text-base font-semibold">
          Select media
        </h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="media-search">
            Search media
          </label>
          <Input
            id="media-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-44"
          />
          <select
            aria-label="Filter by type"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-base w-32"
          >
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="document">PDFs</option>
          </select>
          <input
            ref={fileInput}
            type="file"
            className="sr-only"
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
            {busy ? 'Uploading…' : 'Upload new'}
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>

      {error && (
        <div className="px-4 pt-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      <div className="max-h-[62vh] overflow-auto p-4">
        {!rows ? (
          <Spinner />
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            Nothing matches. Upload a file to get started.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onSelect(row)}
                  className="group w-full rounded-md border border-border bg-surface-2 p-2 text-left transition-colors hover:border-gold"
                >
                  <span className="block aspect-[4/3] overflow-hidden rounded-sm">
                    <Thumb row={row} />
                  </span>
                  <span className="mt-2 block truncate text-xs text-ink">
                    {row.title || row.original_filename}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5">
                    <Badge>{KIND_LABEL[row.kind] ?? row.kind}</Badge>
                    <span className="text-[11px] text-muted">
                      {formatSize(row.byte_size)}
                    </span>
                    {!row.is_public && <Badge tone="gold">private</Badge>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  )
}

/**
 * A media reference field.
 *
 * Replaces the raw id input: shows what is actually selected, and opens the
 * library to change it. The id is still what gets stored — this only changes
 * how it is chosen.
 */
export function MediaField({
  label,
  value,
  kind,
  hint,
  onChange,
}: {
  label: string
  value: string | null
  kind?: string
  hint?: string
  onChange: (id: string | null) => void
}) {
  const [picking, setPicking] = useState(false)
  const [viewing, setViewing] = useState(false)

  /**
   * The resolved asset, tagged with the id it was fetched for.
   *
   * Keyed rather than held in two separate pieces of state so that changing
   * the selection cannot briefly show the *previous* file's preview while the
   * new one loads — and so nothing has to be reset synchronously in an effect.
   */
  const [resolved, setResolved] = useState<{
    key: string | null
    row: MediaRow | null
    missing: boolean
  }>({ key: null, row: null, missing: false })

  const current = resolved.key === value ? resolved : null
  const row = current?.row ?? null
  const missing = current?.missing ?? false

  useEffect(() => {
    if (!value) return
    let cancelled = false
    const fetchOne = async () => {
      try {
        const found = await api<MediaRow>(`/admin/media/${value}`)
        if (!cancelled) setResolved({ key: value, row: found, missing: false })
      } catch {
        // The id points at something that no longer exists. Say so rather
        // than rendering an empty box that looks like "nothing selected".
        if (!cancelled) setResolved({ key: value, row: null, missing: true })
      }
    }
    void fetchOne()
    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <div>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>

      <div className="flex items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-sm border border-border">
          {row ? (
            // The thumbnail is the obvious thing to click to enlarge, so it
            // opens the viewer too. The button beside it stays, because a
            // clickable image is not discoverable on its own.
            // `aria-label` rather than relying on the contents: an image
            // thumbnail renders `alt=""` when the asset has no alt text,
            // which would leave this button with no accessible name at all.
            // `type="button"` matters too — MediaField is used inside forms,
            // and the default submit type would save the record on click.
            <button
              type="button"
              onClick={() => setViewing(true)}
              aria-label={`View ${row.original_filename} full size`}
              title="View full size"
              className="h-full w-full cursor-zoom-in"
            >
              <Thumb row={row} />
            </button>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg">
              <span className="text-[11px] text-muted">
                {missing ? 'missing' : 'none'}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {row ? (
            <>
              <p className="truncate text-sm text-ink">
                {row.title || row.original_filename}
              </p>
              <p className="truncate text-xs text-muted">
                {row.kind} · {formatSize(row.byte_size)}
                {row.width ? ` · ${row.width}×${row.height}` : ''}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted">
              {missing
                ? 'The selected file no longer exists.'
                : 'Nothing selected.'}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            {row && (
              <Button variant="secondary" onClick={() => setViewing(true)}>
                View
              </Button>
            )}
            <Button onClick={() => setPicking(true)}>
              {row ? 'Replace' : 'Choose media'}
            </Button>
            {value && (
              <Button variant="ghost" onClick={() => onChange(null)}>
                Clear
              </Button>
            )}
          </div>

          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
      </div>

      {picking && (
        <MediaPicker
          kind={kind}
          onClose={() => setPicking(false)}
          onSelect={(selected) => {
            onChange(selected.id)
            setPicking(false)
          }}
        />
      )}

      {viewing && row && (
        <MediaViewer row={row} onClose={() => setViewing(false)} />
      )}
    </div>
  )
}
