import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, api } from '@/lib/api'

export interface AdminProfile {
  id: string
  email: string
  full_name: string
  role: string
  totp_enabled: boolean
  last_login_at: string | null
}

interface AuthState {
  admin: AdminProfile | null
  loading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ twoFactorRequired: boolean; pendingToken?: string }>
  completeTwoFactor: (pendingToken: string, code: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/**
 * The session probe, with concurrent calls collapsed into one request.
 *
 * `/auth/me` was being requested twice on every mount: StrictMode invokes the
 * mount effect twice in development, and each pass fired its own fetch. When
 * nobody is signed in both come back 401, and the browser logs every 4xx to
 * the console — so a perfectly normal "not signed in" check looked like two
 * errors. Sharing one in-flight promise makes it one request and one log line.
 *
 * A 401 here is the expected answer, not a failure: it is how a cookie-session
 * app asks "do I have a session?" when the cookie is HttpOnly and therefore
 * invisible to JavaScript. It resolves to `null` rather than throwing, because
 * every caller wants the same thing — a profile, or nothing.
 */
let inFlightProfile: Promise<AdminProfile | null> | null = null

function fetchProfile(): Promise<AdminProfile | null> {
  if (!inFlightProfile) {
    inFlightProfile = api<AdminProfile>('/auth/me')
      .catch(() => null)
      .finally(() => {
        // Cleared once settled, so a later check is a fresh request rather
        // than a cached answer from before a sign-in or sign-out.
        inFlightProfile = null
      })
  }
  return inFlightProfile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setAdmin(await fetchProfile())
    setLoading(false)
  }, [])

  // Session check on mount, using React's documented fetch-in-effect shape:
  // the work happens in an async continuation (so no synchronous setState in
  // the effect body) and `cancelled` stops a late response from writing state
  // after unmount.
  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const profile = await fetchProfile()
      if (cancelled) return
      setAdmin(profile)
      setLoading(false)
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback<AuthState['signIn']>(async (email, password) => {
    const result = await api<{
      status: string
      pending_token?: string
      admin?: AdminProfile
    }>('/auth/login', { method: 'POST', body: { email, password } })

    if (result.status === 'two_factor_required') {
      // No session exists yet — the server issued only a pending token.
      return { twoFactorRequired: true, pendingToken: result.pending_token }
    }
    setAdmin(result.admin ?? null)
    return { twoFactorRequired: false }
  }, [])

  const completeTwoFactor = useCallback<AuthState['completeTwoFactor']>(
    async (pendingToken, code) => {
      const result = await api<{ admin?: AdminProfile }>('/auth/2fa', {
        method: 'POST',
        body: { pending_token: pendingToken, code },
      })
      setAdmin(result.admin ?? null)
    },
    [],
  )

  /**
   * Sign out, and never leave the person stuck signed in.
   *
   * This used to rethrow anything that was not a 401, and the caller in the
   * sidebar is `signOut().then(() => navigate('/login'))` — so any other
   * failure skipped both the local clear AND the redirect, and the button
   * silently did nothing. That is exactly what happened when `POST
   * /auth/logout` started returning 403: logout is an unsafe method, so it
   * carries the CSRF header like every other write, and the header could not
   * be built from a cookie the admin was unable to read.
   *
   * The server call is still made and still matters — it revokes the session
   * row, which is what actually ends the session. But whether or not it
   * succeeds, the local state is cleared: a sign-out button that refuses to
   * sign you out is worse than one that leaves a stale row behind, and the
   * session has an absolute expiry regardless.
   */
  const signOut = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch (error) {
      // 401 means it was already gone. Anything else is worth seeing in the
      // console, but never worth blocking the sign-out over.
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.warn('[admin] sign-out request failed; clearing session locally', error)
      }
    } finally {
      setAdmin(null)
    }
  }, [])

  const value = useMemo(
    () => ({ admin, loading, signIn, completeTwoFactor, signOut, refresh }),
    [admin, loading, signIn, completeTwoFactor, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
