/**
 * API client.
 *
 * Two rules encoded here:
 *
 * 1. `credentials: 'include'` — the session lives in an HttpOnly cookie, never
 *    in localStorage. A token in localStorage is readable by any script on the
 *    page, which turns any XSS into a full account takeover.
 * 2. Every unsafe request echoes the CSRF cookie in a header. The cookie rides
 *    along automatically on a cross-site request; the header cannot be set by
 *    another origin, so requiring both proves same-origin intent.
 */

const CSRF_COOKIE = 'mj_admin_csrf'
const CSRF_HEADER = 'X-CSRF-Token'

/**
 * Where the API lives.
 *
 * Empty in development, so requests stay relative and Vite's dev proxy forwards
 * them — same-origin, which is how the session cookie behaves most simply.
 *
 * In production the admin is served by Vercel and the API runs on Render, so
 * they are different origins and the requests must be absolute. Relative `/api`
 * paths would resolve against Vercel, which has no such route, and every admin
 * request would 404.
 *
 * Trailing slashes are stripped so the value is forgiving about how it is typed.
 */
const CONFIGURED_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/+$/,
  '',
)

/** A registrable domain, approximated as the last two labels. */
const registrable = (hostname: string): string =>
  hostname.split('.').slice(-2).join('.')

/**
 * Resolve the API origin, correcting one that cannot possibly work.
 *
 * A cross-site API base is not merely a poor choice — it is *non-functional*.
 * The session cookie is `SameSite=Lax`, so a browser will not send it to a
 * different registrable domain, and the admin signs in and then 401s on every
 * request after it. Using that value guarantees failure, so this prefers a
 * same-site origin derived from the domain the admin is actually served from:
 * `api.<registrable domain>`, which is the deployment layout this project
 * documents throughout.
 *
 * That derivation is the one piece of inference here, and it is deliberately
 * narrow. It happens only when the configured value is already broken, never
 * to override a working one, and never in development. A correctly-configured
 * build never reaches it.
 *
 * It is a correction, not a silent one: `apiBaseCorrection` is non-null
 * whenever it applies, and the module logs a warning naming both origins. The
 * real fix is still to set VITE_API_BASE_URL properly and redeploy.
 */
function resolveApiBase(): { base: string; correction: string | null } {
  // Empty means same-origin through the dev proxy, which always works.
  if (!CONFIGURED_BASE) return { base: '', correction: null }
  if (typeof window === 'undefined') {
    return { base: CONFIGURED_BASE, correction: null }
  }

  let apiHost: string
  try {
    apiHost = new URL(CONFIGURED_BASE).hostname
  } catch {
    return { base: CONFIGURED_BASE, correction: null }
  }

  const own = window.location.hostname
  // Development is exempt: localhost is not same-site with anything, and an
  // absolute base there is a deliberate choice rather than a mistake.
  if (own === 'localhost' || own === '127.0.0.1') {
    return { base: CONFIGURED_BASE, correction: null }
  }
  // Already same-origin or same-site: the cookie will be sent. Leave it alone.
  if (apiHost === own || registrable(apiHost) === registrable(own)) {
    return { base: CONFIGURED_BASE, correction: null }
  }

  const corrected = `https://api.${registrable(own)}`
  return { base: corrected, correction: corrected }
}

const resolved = resolveApiBase()
const API_BASE = resolved.base

/**
 * The origin this client corrected to, or null when the configuration was
 * sound. Non-null means the deployment is still misconfigured even though the
 * admin is working.
 */
export const apiBaseCorrection = resolved.correction

if (resolved.correction) {
  console.warn(
    `[admin] VITE_API_BASE_URL is ${CONFIGURED_BASE}, which is a different ` +
      `site from ${window.location.hostname}. A SameSite=Lax session cookie ` +
      `cannot be sent there, so requests are going to ${resolved.correction} ` +
      `instead. Fix VITE_API_BASE_URL and redeploy.`,
  )
}

/**
 * An absolute (or dev-relative) API URL.
 *
 * Exported because `fetch` is not the only consumer: media thumbnails are
 * `<img src>` attributes, and those need the same base. A relative one there
 * would have the browser ask Vercel for the image and get a 404.
 */
export const apiUrl = (path: string): string => `${API_BASE}/api${path}`

/** The API's origin, or '' in development. Used to build the admin's CSP. */
export const apiOrigin = API_BASE

/**
 * A configuration problem worth showing a person, or null.
 *
 * Deliberately narrow. The cross-site case that used to be reported here is
 * now *corrected* by `resolveApiBase()` rather than merely announced, so the
 * login screen stays clean and the admin works — the correction is reported to
 * the console instead, where a maintainer will see it and a visitor will not.
 *
 * What remains is the case nothing can rescue: a `VITE_API_BASE_URL` that is
 * not a URL at all. There is no origin to correct to, so every request will
 * fail, and saying so beats letting it look like an outage.
 */
export function apiConfigError(): string | null {
  // Empty means same-origin through the dev proxy, which is always fine.
  if (!API_BASE) return null
  try {
    new URL(API_BASE)
    return null
  } catch {
    return (
      `VITE_API_BASE_URL is not a valid URL ("${CONFIGURED_BASE}"), so no ` +
      `request to the API can succeed. Fix it and redeploy.`
    )
  }
}

export class ApiError extends Error {
  // Declared explicitly rather than as constructor parameter properties:
  // `erasableSyntaxOnly` is on, which forbids that syntax because it emits
  // runtime code rather than being purely erasable types.
  readonly status: number
  readonly code: string
  readonly detail?: unknown

  constructor(status: number, code: string, message: string, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.detail = detail
  }
}

function csrfToken(): string {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`),
  )
  return match ? decodeURIComponent(match[1]!) : ''
}

interface Options {
  method?: string
  body?: unknown
  formData?: FormData
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {}

  if (method !== 'GET' && method !== 'HEAD') {
    headers[CSRF_HEADER] = csrfToken()
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(apiUrl(path), {
    method,
    credentials: 'include',
    headers,
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  })

  if (response.status === 204) return undefined as T

  const text = await response.text()
  const payload = text ? safeParse(text) : null

  if (!response.ok) {
    const detail = (payload as { detail?: unknown })?.detail
    const asObject = typeof detail === 'object' && detail !== null ? (detail as Record<string, unknown>) : null
    throw new ApiError(
      response.status,
      (asObject?.code as string) ?? String(response.status),
      (asObject?.message as string) ??
        (typeof detail === 'string' ? detail : messageForStatus(response.status)),
      detail,
    )
  }

  return payload as T
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function messageForStatus(status: number): string {
  switch (status) {
    case 401:
      return 'Your session has expired. Sign in again.'
    case 403:
      return 'That action was refused.'
    case 404:
      return 'Not found.'
    case 409:
      return 'That conflicts with the current state.'
    case 422:
      return 'Some fields need attention.'
    default:
      return 'Something went wrong.'
  }
}

/** Field-level messages from a FastAPI 422, keyed by field name. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.status !== 422) return {}
  const detail = error.detail
  if (!Array.isArray(detail)) return {}
  const result: Record<string, string> = {}
  for (const item of detail as { loc?: unknown[]; msg?: string }[]) {
    const field = item.loc?.slice(1).join('.') ?? ''
    if (field && item.msg) result[field] = item.msg
  }
  return result
}
