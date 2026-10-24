import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button, cn } from '@/components/ui'

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/home', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/skills', label: 'Skills' },
  { to: '/projects', label: 'Projects' },
  { to: '/career', label: 'Career' },
  { to: '/certificates', label: 'Certificates' },
  { to: '/certificate-categories', label: 'Certificate categories' },
  { to: '/achievements', label: 'Achievements' },
  { to: '/media', label: 'Media' },
  { to: '/social', label: 'Social' },
  { to: '/messages', label: 'Messages' },
  { to: '/settings', label: 'Settings' },
  { to: '/publish', label: 'Publish' },
]

export function Layout() {
  const { admin, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen md:grid md:grid-cols-[13rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="border-border bg-surface md:min-h-screen md:border-r">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:block md:border-b-0">
          <div>
            <p className="font-mono text-sm tracking-wide text-gold">MJ ADMIN</p>
            <p className="truncate text-xs text-muted">{admin?.email}</p>
          </div>
        </div>

        <nav aria-label="Admin sections" className="px-2 py-2">
          <ul className="flex gap-1 overflow-x-auto md:block md:space-y-0.5 md:overflow-visible">
            {NAV.map((item) => (
              <li key={item.to} className="shrink-0">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'block whitespace-nowrap rounded-sm px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-surface-2 text-gold'
                        : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => {
              void signOut().then(() => navigate('/login'))
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <main id="main" className="min-w-0 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
