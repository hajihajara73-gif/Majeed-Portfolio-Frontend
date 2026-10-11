import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com'
const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com'

/**
 * Inject a Content-Security-Policy meta tag at build time.
 *
 * A meta tag rather than a server header, deliberately: this is a static site
 * and the host is not decided yet, so a policy that only exists in one
 * provider's config file would be absent the moment it is deployed anywhere
 * else. `public/_headers` carries the directives a meta tag genuinely cannot
 * express — `frame-ancestors` and HSTS are ignored in meta form.
 *
 * `connect-src` is derived from the configured contact endpoint rather than
 * hard-coded, so the policy cannot drift away from the API the build actually
 * talks to. Every source below corresponds to something the page really loads:
 * remove a feature and the matching directive should go with it.
 */
function contentSecurityPolicy(mode: string): Plugin {
  return {
    name: 'inject-csp',
    /**
     * BUILD ONLY. The dev server is not a deployment target, and Vite's dev
     * transport is fundamentally incompatible with this policy: React Fast
     * Refresh injects its preamble as an INLINE script, which `script-src
     * 'self'` blocks — and then the app never boots at all, which is a blank
     * page rather than a subtle degradation.
     *
     * The production build has no inline script (that was the point of moving
     * the font flip into the bundle), so the strict policy is both correct and
     * exercisable there. Verify it against `npm run preview`, not `npm run dev`.
     */
    apply: 'build',
    transformIndexHtml() {
      const env = loadEnv(mode, process.cwd(), '')
      const endpoint = env.VITE_CONTACT_ENDPOINT
      let apiOrigin = ''
      if (endpoint) {
        try {
          apiOrigin = new URL(endpoint).origin
        } catch {
          // An unparseable endpoint is the contact form's problem to report at
          // runtime, not a reason to fail the build with a broken policy.
        }
      }

      const policy = [
        "default-src 'self'",
        // No inline script anywhere: the one inline handler this page had was
        // moved into the bundle precisely so this can stay strict.
        "script-src 'self'",
        // Google Fonts serves a stylesheet; Tailwind's output is a file.
        // 'unsafe-inline' is required for style because React and Framer Motion
        // set element styles, and browsers without style-src-attr support fold
        // that into style-src.
        `style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS_CSS}`,
        `font-src 'self' ${GOOGLE_FONTS_FILES}`,
        // data: covers the small inlined assets Vite emits.
        "img-src 'self' data:",
        // The cabin video and the audio track.
        "media-src 'self'",
        // Certificates open in a same-origin iframe on wide viewports.
        "frame-src 'self'",
        // The contact form is the only network call the site makes.
        ['connect-src', "'self'", apiOrigin].filter(Boolean).join(' '),
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        // `frame-ancestors` is deliberately NOT here: a meta tag cannot carry
        // it, and Chrome logs a console warning for every attempt. It is set as
        // a real header in public/_headers instead.
        //
        // `upgrade-insecure-requests` is deliberately absent too. It would buy
        // nothing — every source allowed above is already https or 'self' — and
        // the Projects section links to one real, live, plain-http university
        // deployment that must keep working. Not worth the risk for no gain.
      ]
        .filter(Boolean)
        .join('; ')

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
 * Site-URL-dependent output: canonical, og:url, absolute og:image, robots.txt
 * and sitemap.xml.
 *
 * All of it needs the real domain, which is not known until the site is
 * deployed. The rule applied here is the same one the content layer uses: when
 * a value is unknown, emit nothing rather than something wrong.
 *
 * That matters most for the sitemap. It used to ship as a static file
 * containing `<loc>https://example.com/</loc>` — a submittable sitemap
 * pointing at somebody else's domain, which is worse than having none. So the
 * file is generated here, and only once the domain is actually known: from
 * `VITE_SITE_URL`, or from the deploying platform's own variable. Never
 * invented, and never a placeholder.
 */
function siteMetadata(mode: string): Plugin {
  const read = () => {
    const env = loadEnv(mode, process.cwd(), '')
    // An explicit value always wins — it is the only way to name a domain the
    // build platform does not know about.
    const explicit = env.VITE_SITE_URL?.trim()
    // Failing that, ask the platform instead of guessing. Vercel sets
    // VERCEL_PROJECT_PRODUCTION_URL on every deployment: the project's
    // production host, custom domain preferred, with no scheme. That is the
    // real domain, from the deployment itself, so the canonical link and
    // sitemap no longer depend on someone remembering a dashboard field.
    //
    // Only for a production build. `VERCEL_URL` — the per-deployment host —
    // would make canonical a different URL on every build, and a preview's
    // canonical should point at production anyway, which this does.
    const platform =
      env.VERCEL_ENV === 'production' && env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
        : ''
    const raw = explicit || platform
    if (!raw) return null
    try {
      // Normalised to an origin with no trailing slash, so joining is simple.
      return new URL(raw).origin
    } catch {
      return null
    }
  }

  return {
    name: 'site-metadata',
    transformIndexHtml() {
      const origin = read()
      if (!origin) return []
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: `${origin}/` }, injectTo: 'head' },
        {
          tag: 'meta',
          attrs: { property: 'og:url', content: `${origin}/` },
          injectTo: 'head',
        },
        {
          // Social scrapers require an absolute image URL; a root-relative one
          // is silently dropped by most of them.
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: `${origin}/assets/background/cabin-poster.jpg`,
          },
          injectTo: 'head',
        },
      ]
    },
    generateBundle() {
      const origin = read()

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source:
          'User-agent: *\nAllow: /\n' +
          (origin
            ? `\nSitemap: ${origin}/sitemap.xml\n`
            : '\n# No Sitemap line: this build does not know the site URL, and\n' +
              '# a sitemap pointing at the wrong domain is worse than none.\n' +
              '# Set VITE_SITE_URL to fix.\n'),
      })

      if (origin) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source:
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            '  <url>\n' +
            `    <loc>${origin}/</loc>\n` +
            '    <changefreq>monthly</changefreq>\n' +
            '    <priority>1.0</priority>\n' +
            '  </url>\n' +
            '</urlset>\n',
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    contentSecurityPolicy(mode),
    siteMetadata(mode),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  /**
   * The public site serves on 3000 locally; the API is on 8000.
   *
   * `strictPort` is on deliberately. Vite's default is to walk to the next free
   * port, which would be silent and would then fail CORS against the API —
   * `CORS_ORIGINS` names an exact origin, so a drifted port looks like a broken
   * contact form rather than an occupied port. Failing to start says which.
   *
   * The admin runs its own dev server on 5174 (see admin/vite.config.ts).
   */
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    modulePreload: {
      /**
       * Do NOT preload the 3D chunk.
       *
       * By default Vite emits `<link rel="modulepreload">` for dynamically
       * imported chunks, which defeats the point of lazy-loading them: measured,
       * every visitor was downloading ~232 kB of three/R3F even on phones and
       * under reduce-motion, where no canvas ever mounts.
       *
       * Filtering it here means the chunk is fetched only when
       * `useCanvasPolicy()` actually decides to mount the scene.
       */
      resolveDependencies: (_url, deps) =>
        deps.filter((dep) => !/(r3f|three|AmbientScene)-[\w-]+\.js$/.test(dep)),
    },
    /**
     * No manualChunks.
     *
     * A hand-rolled `manualChunks` here actively broke lazy-loading: forcing
     * `@react-three/*` into its own chunk made that chunk the common ancestor
     * for React itself, so the entry ended up STATICALLY importing it and every
     * visitor downloaded three.js. The automatic splitting handles the dynamic
     * `import()` in CinematicBackground correctly on its own. Verified by
     * checking dist/index.html and the entry chunk's import list after each
     * build — do not add manualChunks back without re-checking both.
     */
  },
}))
