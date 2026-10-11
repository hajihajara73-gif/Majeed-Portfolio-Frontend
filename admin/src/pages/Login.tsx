import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiConfigError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Banner, Button, Field, Input } from '@/components/ui'

export function Login() {
  const { signIn, completeTwoFactor } = useAuth()
  const navigate = useNavigate()

  // Checked before anything is typed. Only an unusable API base reaches this:
  // a cross-site one is corrected in the client rather than reported here.
  const misconfigured = apiConfigError()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (pendingToken) {
        await completeTwoFactor(pendingToken, code)
        navigate('/')
        return
      }
      const result = await signIn(email, password)
      if (result.twoFactorRequired && result.pendingToken) {
        // Deliberately a second step, not a second field: no session exists
        // until this succeeds.
        setPendingToken(result.pendingToken)
        return
      }
      navigate('/')
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Could not sign in.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="card w-full max-w-sm space-y-4 p-6"
        noValidate
      >
        <div>
          <p className="font-mono text-sm tracking-wide text-gold">MJ ADMIN</p>
          <h1 className="mt-1 text-lg font-semibold">
            {pendingToken ? 'Two-factor code' : 'Sign in'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {pendingToken
              ? 'Enter the 6-digit code from your authenticator app, or a recovery code.'
              : 'Manage your portfolio content.'}
          </p>
        </div>

        {misconfigured && <Banner tone="warning">{misconfigured}</Banner>}

        {error && <Banner tone="error">{error}</Banner>}

        {pendingToken ? (
          <Field label="Authentication code">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              inputMode="text"
              autoFocus
              required
            />
          </Field>
        ) : (
          <>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
          </>
        )}

        <Button type="submit" variant="primary" disabled={busy} className="w-full">
          {busy ? 'Working…' : pendingToken ? 'Verify' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
