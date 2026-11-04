import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initTheme } from '@/lib/theme'
import './styles.css'

/**
 * Paint the stored theme before React mounts, so a non-default theme does not
 * flash the stylesheet's default palette for a frame on every load.
 */
initTheme()

/**
 * Activate the web fonts.
 *
 * `index.html` ships the stylesheet as `media="print"` so it never blocks first
 * paint. Flipping it here — rather than with an inline `onload` attribute — is
 * what lets the Content-Security-Policy forbid inline script entirely. The UI
 * is perfectly legible in the fallback stack if this never runs.
 */
const webfonts = document.getElementById('webfonts')
if (webfonts instanceof HTMLLinkElement) webfonts.media = 'all'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

createRoot(container).render(
  <StrictMode>
    {/* basename matches vite's `base`, so the admin can be served from /admin
        without every link needing the prefix. */}
    <BrowserRouter basename="/admin">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
