import { useId, useState } from 'react'
import { Section } from '@/components/Section'
import { contacts } from '@/content'
import { cn } from '@/lib/cn'
import { resolved } from '@/types/content'

type Field = 'name' | 'email' | 'subject' | 'message'
type Errors = Partial<Record<Field, string>>
type Status =
  | 'idle'
  | 'unconfigured'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'rate-limited'
  | 'rejected'

const EMPTY: Record<Field, string> = {
  name: '',
  email: '',
  subject: '',
  message: '',
}

// The API's own limits, mirrored so the browser stops over-long input rather
// than letting it become a request the server rejects. Kept in step with
// `ContactRequest` in app/api/routes/public.py; email is RFC 5321's 254.
const LIMITS: Record<Field, number> = {
  name: 255,
  email: 254,
  subject: 255,
  message: 5000,
}

function validate(values: Record<Field, string>): Errors {
  const errors: Errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your name.'
  if (!values.email.trim()) errors.email = 'Please enter your email address.'
  // Deliberately permissive: the only reliable email validation is delivery.
  // This catches typos without rejecting valid unusual addresses.
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'That does not look like an email address.'
  if (!values.subject.trim()) errors.subject = 'Please enter a subject.'
  if (values.message.trim().length < 10)
    errors.message = 'Please write at least a sentence.'
  return errors
}

/**
 * Contacts.
 *
 * The form posts to the API's one public endpoint. The governing rule is that
 * it must never claim success it has not achieved: with no endpoint configured
 * it says sending is not connected, a failed request says so and points at the
 * direct channels, and only a 2xx response shows the success message.
 * A form that silently swallows a message is worse than no form.
 */
export function ContactsSection() {
  const fieldId = useId()
  const [values, setValues] = useState<Record<Field, string>>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  // Honeypot. Hidden from people, irresistible to naive bots. Held outside
  // `values` so it can never be confused with a real field.
  const [website, setWebsite] = useState('')

  const introduction = resolved(contacts.introduction)
  const endpoint = resolved(contacts.form.endpoint)
  const channels = contacts.channels
    .map((channel) => ({
      ...channel,
      value: resolved(channel.value),
      href: resolved(channel.href),
    }))
    .filter((channel) => channel.value && channel.href)

  const set = (field: Field) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((previous) => ({ ...previous, [field]: event.target.value }))
    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }))
    }
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setStatus('idle')
      return
    }
    if (!endpoint) {
      setStatus('unconfigured')
      return
    }

    setStatus('sending')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, website }),
      })

      if (response.status === 429) {
        setStatus('rate-limited')
        return
      }
      if (response.status === 422) {
        // The server validates the address more strictly than a browser can —
        // it rejects reserved names like `.invalid` and `.local`, which the
        // permissive check above deliberately allows. Every other field is
        // bounded by `LIMITS` before the request is made, so this is the one
        // remaining way a well-formed submission comes back refused. The
        // visitor can fix it, and "something went wrong" would wrongly tell
        // them not to bother.
        setStatus('rejected')
        setErrors({ email: 'That address was not accepted. Please check it.' })
        return
      }
      if (!response.ok) {
        setStatus('failed')
        return
      }

      setStatus('sent')
      setValues(EMPTY)
    } catch {
      // Network failure, CORS, offline. Indistinguishable from here, and the
      // honest answer to the visitor is the same in every case.
      setStatus('failed')
    }
  }

  const sending = status === 'sending'

  return (
    <Section id="contacts" eyebrow={contacts.eyebrow} heading={contacts.heading}>
      {introduction && (
        <p className="mt-[var(--space-sm)] max-w-[var(--width-prose)] text-body text-ink-secondary">
          {introduction}
        </p>
      )}

      <div className="mt-[var(--space-xl)] grid gap-[var(--space-xl)] md:grid-cols-2">
        {/* Left: direct channels + availability */}
        <div>
          {channels.length > 0 ? (
            <ul className="space-y-[var(--space-sm)]">
              {channels.map((channel) => (
                <li key={channel.id}>
                  <span className="block font-mono text-caption uppercase text-muted">
                    {channel.label}
                  </span>
                  <a
                    href={channel.href}
                    className="text-body-lg text-ink underline-offset-4 transition-colors duration-fast ease-standard hover:text-gold hover:underline"
                  >
                    {channel.value}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-muted">
              Contact details are being finalised.
            </p>
          )}

          {contacts.availability.length > 0 && (
            <div className="mt-[var(--space-lg)]">
              <h3 className="font-mono text-caption uppercase text-gold">
                Open to
              </h3>
              <ul className="mt-[var(--space-sm)] flex flex-wrap gap-[var(--space-xs)]">
                {contacts.availability.map((item) => (
                  <li
                    key={item}
                    className="rounded-pill border border-border px-[var(--space-md)] py-1.5 text-caption text-ink-secondary"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: form */}
        <form noValidate onSubmit={onSubmit} className="glass-panel p-[var(--space-md)]">
          <h3 className="text-h3 text-ink">{contacts.form.heading}</h3>

          <div className="mt-[var(--space-md)] space-y-[var(--space-md)]">
            <TextField
              id={`${fieldId}-name`}
              label="Name"
              value={values.name}
              onChange={set('name')}
              error={errors.name}
              autoComplete="name"
              disabled={sending}
              maxLength={LIMITS.name}
            />
            <TextField
              id={`${fieldId}-email`}
              label="Email"
              type="email"
              value={values.email}
              onChange={set('email')}
              error={errors.email}
              autoComplete="email"
              disabled={sending}
              maxLength={LIMITS.email}
            />
            <TextField
              id={`${fieldId}-subject`}
              label="Subject"
              value={values.subject}
              onChange={set('subject')}
              error={errors.subject}
              disabled={sending}
              maxLength={LIMITS.subject}
            />
            <TextField
              id={`${fieldId}-message`}
              label="Message"
              multiline
              value={values.message}
              onChange={set('message')}
              error={errors.message}
              disabled={sending}
              maxLength={LIMITS.message}
            />
          </div>

          {/* Honeypot: display:none keeps it out of the accessibility tree as
              well as out of sight, and tabIndex -1 keeps it off the keyboard
              path, so no person can reach it. The server treats a filled one
              as spam and returns the same success a real sender sees. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor={`${fieldId}-website`}>Website</label>
            <input
              id={`${fieldId}-website`}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="mt-[var(--space-md)] w-full rounded-pill bg-gold px-[var(--space-lg)] py-[var(--space-sm)] text-caption uppercase text-bg-deep transition-colors duration-fast ease-standard hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-gold"
          >
            {sending ? 'Sending…' : contacts.form.submitLabel}
          </button>

          {/* Status is a live region so the outcome reaches screen readers
              without moving focus away from the form. */}
          <p
            role="status"
            aria-live="polite"
            className={cn(
              'mt-[var(--space-sm)] text-caption normal-case',
              status === 'sent' && 'text-success',
              status === 'failed' ||
                status === 'rate-limited' ||
                status === 'rejected'
                ? 'text-danger'
                : status !== 'sent' && 'text-muted',
            )}
          >
            {status === 'sending' && 'Sending…'}
            {status === 'unconfigured' &&
              'Message sending is not connected yet — please use the contact details listed here in the meantime.'}
            {status === 'sent' && contacts.form.successMessage}
            {status === 'rate-limited' &&
              'That is a few messages in a short time. Please try again later, or email directly.'}
            {status === 'rejected' &&
              'That email address was not accepted. Please check it and try again.'}
            {status === 'failed' &&
              'Something went wrong sending that. Please email instead.'}
          </p>
        </form>
      </div>
    </Section>
  )
}

interface TextFieldProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void
  readonly error?: string
  readonly type?: string
  readonly multiline?: boolean
  readonly autoComplete?: string
  readonly disabled?: boolean
  readonly maxLength?: number
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  multiline,
  autoComplete,
  disabled,
  maxLength,
}: TextFieldProps) {
  const errorId = `${id}-error`
  const shared = {
    id,
    value,
    onChange,
    autoComplete,
    disabled,
    maxLength,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: cn(
      'w-full rounded-md border bg-surface/70 px-[var(--space-sm)] py-2 text-body text-ink',
      'transition-colors duration-fast ease-standard placeholder:text-faint',
      'disabled:cursor-not-allowed disabled:opacity-60',
      error ? 'border-danger' : 'border-border hover:border-border-strong',
    ),
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block font-mono text-caption uppercase text-muted"
      >
        {label}
      </label>
      {multiline ? (
        <textarea {...shared} rows={5} />
      ) : (
        <input {...shared} type={type} />
      )}
      {error && (
        <p id={errorId} className="mt-1 text-caption normal-case text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
