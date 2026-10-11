import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com'
const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com'

/** A registrable domain, approximated as the last two labels. */
const registrable = (hostname: string): string =>
  hostname.split('.').slice(-2).join('.')

/**
 * The domain this build will be served from, if it can be known.
 *
 * `VITE_SITE_URL` first; failing that `VERCEL_PROJECT_PRODUCTION_URL`, which
 * Vercel sets on every deployment to the project's production host. Mirrors
 * how the public site resolves its canonical URL — see ../vite.config.ts.
 */
function siteOrigin(env: Record<string, string>): string {
  const explicit = env.VITE_SITE_URL?.trim()
  if (explicit) {
    try {
      return new URL(explicit).origin
    } catch {
      /* fall through */
    }
  }
  if (env.VERCEL_ENV === 'production' && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return ''
}

/**
 * Content-Security-Policy for the admin, injected at build time.
 *
 * Deliberately mirrors the public site's plugin rather than being set as a host
 * header. Both bundles are served by Vercel, and one CSP header applied to the
 * whole site would have to be the union of two different policies — or would
 * intersect with the public site's meta policy in ways that are easy to get
 * wrong and hard to notice. A policy per document keeps each one honest.
 *
 * `connect-src` and `img-src` are derived from VITE_API_BASE_URL, because in
 * production the admin talks to a different origin and loads its media
 * thumbnails from there.
 */
function contentSecurityPolicy(mode: string): Plugin {
  return {
    name: 'inject-admin-csp',
    /**
     * BUILD ONLY, for the same reason as the public site's: React Fast Refresh
     * injects its preamble as an inline script, and `script-src 'self'` blocks
     * it, leaving a blank page. Verify the policy against `npm run preview`.
     */
    apply: 'build',
    transformIndexHtml() {
      const env = loadEnv(mode, process.cwd(), '')
      const api = (env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
      let apiOrigin = ''
      if (api) {
        try {
          apiOrigin = new URL(api).origin
        } catch {
          // An unparseable value is the API client's problem to report at
          // runtime, not a reason to emit a broken policy.
        }
      }

      // The same-site API origin the client falls back to when the configured
      // one is cross-site. See `resolveApiBase()` in src/lib/api.ts: a
      // cross-site base cannot carry a SameSite=Lax session cookie, so the
      // client corrects it at runtime — and the policy has to permit the
      // corrected origin or the correction is blocked before it is tried.
      //
      // Only added when the configured origin really is cross-site, so a
      // correctly-configured build gets exactly the policy it had before.
      const site = siteOrigin(env)
      let fallbackOrigin = ''
      if (site && apiOrigin) {
        const siteHost = new URL(site).hostname
        const apiHost = new URL(apiOrigin).hostname
        if (registrable(apiHost) !== registrable(siteHost)) {
          fallbackOrigin = `https://api.${registrable(siteHost)}`
        }
      }
      const apiOrigins = [apiOrigin, fallbackOrigin].filter(Boolean)

      const policy = [
        "default-src 'self'",
        // No inline script. The admin has none.
        "script-src 'self'",
        // Google Fonts serves the Inter / JetBrains Mono stylesheet that
        // index.html links, and the font files come from a second origin.
        // Omitting these blocked the admin's own typography — caught by the
        // deployment end-to-end test, not by reading the config.
        //
        // 'unsafe-inline' is required for style because React sets element
        // styles, and browsers without style-src-attr support fold that into
        // style-src.
        `style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS_CSS}`,
        `font-src 'self' ${GOOGLE_FONTS_FILES}`,
        // Media thumbnails come from the API, and blob: covers object URLs used
        // for previewing a file before it is uploaded.
        ['img-src', "'self'", 'data:', 'blob:', ...apiOrigins].join(' '),
        ['connect-src', "'self'", ...apiOrigins].join(' '),
        // PDFs and other non-image assets preview in an iframe.
        ['frame-src', "'self'", ...apiOrigins].join(' '),
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')

      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

/**
 * The admin is a completely separate Vite application.
 *
 * It has its own package.json, its own dependency tree and its own build
 * output. Nothing here can end up in the public site's bundle, and the public
 * site's Three.js dependencies are not installed here at all — which is the
 * only reliable way to guarantee the isolation the spec asks for.
 */
export default defineConfig(({ mode }) => ({
  base: '/admin/',
  plugins: [react(), tailwindcss(), contentSecurityPolicy(mode)],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5174,
    proxy: {
      // Same-origin in development, so the session cookie behaves exactly as
      // it will in production instead of needing cross-site relaxations.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: false,
      },
    },
  },
  build: { target: 'es2022', outDir: 'dist' },
}))
