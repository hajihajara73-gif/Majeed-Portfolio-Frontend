import { useCallback, useEffect, useState } from 'react'
import { ApiError, api, fieldErrors } from '@/lib/api'
import { PageHeader } from '@/components/Layout'
import { MediaField } from '@/components/MediaPicker'
import {
  Banner,
  Button,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
  Toggle,
  listToText,
  textToList,
} from '@/components/ui'

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'list'
  | 'number'
  | 'boolean'
  | 'select'
  | 'media'

export interface FieldDef {
  name: string
  label: string
  kind: FieldKind
  hint?: string
  options?: { value: string; label: string }[]
  /**
   * For `select`: load the options from another resource instead of listing
   * them here. The value is that resource's admin path, e.g.
   * '/admin/achievement-categories'. Beats asking anyone to paste a UUID.
   */
  optionsFrom?: string
  /** For `media`: restrict the picker to one kind, e.g. 'image'. */
  mediaKind?: string
  createOnly?: boolean
  required?: boolean
}

export interface ResourceConfig {
  path: string
  title: string
  description?: string
  fields: FieldDef[]
  /** Row label in the list. */
  primary: (row: Record<string, unknown>) => string
  secondary?: (row: Record<string, unknown>) => string
  reorderable?: boolean
  /** Extra defaults applied when creating. */
  defaults?: Record<string, unknown>
  /**
   * Show only the rows this returns true for.
   *
   * Lets two pages edit two halves of one table — certificates and the other
   * achievements — without a second table or a filtered endpoint. Filtering
   * in the client is honest here: these lists are tens of rows, not
   * thousands, and the whole set is already fetched for the ordering UI.
   */
  filter?: (row: Record<string, unknown>) => boolean
}

type Row = Record<string, unknown>

function emptyDraft(config: ResourceConfig): Row {
  const draft: Row = { ...config.defaults }
  for (const field of config.fields) {
    if (draft[field.name] !== undefined) continue
    draft[field.name] =
      field.kind === 'boolean'
        ? false
        : field.kind === 'number'
          ? 0
          : field.kind === 'list'
            ? []
            : ''
  }
  return draft
}

export function ResourcePage({ config }: { config: ResourceConfig }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [draft, setDraft] = useState<Row | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const [linked, setLinked] = useState<Record<string, Row[]>>({})

  const load = useCallback(() => {
    api<Row[]>(config.path)
      .then((all) => setRows(config.filter ? all.filter(config.filter) : all))
      .catch((caught) => setError(String(caught)))
  }, [config.path, config.filter])

  useEffect(load, [load])

  // Options for any select that draws them from another resource.
  useEffect(() => {
    const sources = [
      ...new Set(
        config.fields.map((f) => f.optionsFrom).filter(Boolean) as string[],
      ),
    ]
    if (sources.length === 0) return
    let live = true
    Promise.all(
      sources.map((path) =>
        api<Row[]>(path)
          .then((r) => [path, r] as const)
          .catch(() => [path, [] as Row[]] as const),
      ),
    ).then((pairs) => {
      if (live) setLinked(Object.fromEntries(pairs))
    })
    return () => {
      live = false
    }
  }, [config.fields])

  const startCreate = () => {
    setEditingId(null)
    setErrors({})
    setError(null)
    setDraft(emptyDraft(config))
  }

  const startEdit = (row: Row) => {
    setEditingId(String(row.id))
    setErrors({})
    setError(null)
    setDraft({ ...row })
  }

  const save = async () => {
    if (!draft) return
    setBusy(true)
    setError(null)
    setErrors({})
    try {
      const body: Row = {}
      for (const field of config.fields) {
        if (field.createOnly && editingId) continue
        body[field.name] = draft[field.name]
      }
      if (editingId) {
        // Optimistic locking: tell the server which version we edited.
        body.expected_updated_at = draft.updated_at ?? null
        await api(`${config.path}/${editingId}`, { method: 'PUT', body })
      } else {
        await api(config.path, { method: 'POST', body })
      }
      setDraft(null)
      setEditingId(null)
      load()
    } catch (caught) {
      setErrors(fieldErrors(caught))
      setError(caught instanceof ApiError ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row: Row) => {
    if (!confirm(`Delete "${config.primary(row)}"? This cannot be undone.`)) {
      return
    }
    try {
      await api(`${config.path}/${row.id}`, { method: 'DELETE' })
      load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
    }
  }

  /**
   * Reorder with buttons rather than drag-and-drop.
   *
   * Drag is not keyboard operable without a lot of extra work, and this list
   * is short. Two buttons are fully accessible and impossible to misfire.
   */
  const move = async (index: number, direction: -1 | 1) => {
    if (!rows) return
    const next = [...rows]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target]!, next[index]!]
    setRows(next)
    try {
      await api(`${config.path}/reorder`, {
        method: 'POST',
        body: {
          items: next.map((row, i) => ({ id: row.id, display_order: i })),
        },
      })
      load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught))
      load()
    }
  }

  if (!rows) return error ? <Banner tone="error">{error}</Banner> : <Spinner />

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <Button variant="primary" onClick={startCreate}>
            New
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      {draft && (
        <form
          className="card mb-6 space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
          noValidate
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {editingId ? 'Edit' : 'New'}
          </h2>

          <div className="grid gap-3 md:grid-cols-2">
            {config.fields
              .filter((field) => !(field.createOnly && editingId))
              .map((field) => (
                <div
                  key={field.name}
                  className={
                    field.kind === 'textarea' ||
                    field.kind === 'list' ||
                    field.kind === 'media'
                      ? 'md:col-span-2'
                      : undefined
                  }
                >
                  <FieldInput
                    field={field}
                    value={draft[field.name]}
                    linked={linked}
                    error={errors[field.name]}
                    onChange={(value) =>
                      setDraft({ ...draft, [field.name]: value })
                    }
                  />
                </div>
              ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
            <Button onClick={() => setDraft(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <EmptyState>Nothing here yet.</EmptyState>
      ) : (
        <ul className="card divide-y divide-border">
          {rows.map((row, index) => (
            <li
              key={String(row.id)}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{config.primary(row)}</p>
                {config.secondary && (
                  <p className="truncate text-xs text-muted">
                    {config.secondary(row)}
                  </p>
                )}
              </div>

              {config.reorderable && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => void move(index, -1)}
                    disabled={index === 0}
                  >
                    <span aria-hidden="true">↑</span>
                    <span className="sr-only">
                      Move {config.primary(row)} up
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void move(index, 1)}
                    disabled={index === rows.length - 1}
                  >
                    <span aria-hidden="true">↓</span>
                    <span className="sr-only">
                      Move {config.primary(row)} down
                    </span>
                  </Button>
                </div>
              )}

              <Button onClick={() => startEdit(row)}>Edit</Button>
              <Button variant="danger" onClick={() => void remove(row)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function FieldInput({
  field,
  value,
  error,
  linked,
  onChange,
}: {
  field: FieldDef
  value: unknown
  error?: string
  linked?: Record<string, Record<string, unknown>[]>
  onChange: (value: unknown) => void
}) {
  // Options drawn from another resource. `label` covers the category-style
  // rows; `title` and `name` cover the rest, so this works for any resource
  // without each one needing a special case.
  const linkedOptions = (linked?.[field.optionsFrom ?? ''] ?? []).map((row) => ({
    value: String(row.id ?? ''),
    label: String(row.label ?? row.title ?? row.name ?? row.slug ?? row.id),
  }))

  if (field.kind === 'boolean') {
    return (
      <div className="pt-5">
        <Toggle
          label={field.label}
          checked={Boolean(value)}
          onChange={onChange}
        />
      </div>
    )
  }

  if (field.kind === 'media') {
    return (
      <MediaField
        label={field.label}
        hint={field.hint}
        kind={field.mediaKind}
        value={value ? String(value) : null}
        onChange={onChange}
      />
    )
  }

  return (
    <Field label={field.label} hint={field.hint} error={error}>
      {field.kind === 'textarea' ? (
        <Textarea
          rows={4}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
        />
      ) : field.kind === 'list' ? (
        <Textarea
          rows={4}
          value={listToText(value as string[])}
          onChange={(e) => onChange(textToList(e.target.value))}
          placeholder="One per line"
        />
      ) : field.kind === 'select' ? (
        <Select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
        >
          {/* A sourced select is optional by nature — the blank entry is how
              you clear it, and how a row stays uncategorised. */}
          {field.optionsFrom && <option value="">&mdash; none &mdash;</option>}
          {(field.options ?? linkedOptions).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : field.kind === 'number' ? (
        <Input
          type="number"
          value={String(value ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      ) : (
        <Input
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
        />
      )}
    </Field>
  )
}
