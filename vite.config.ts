import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

// Authored SEO defaults and structured-data facts. Safe to import here
// BECAUSE that module has no value imports and no `import.meta.env` — see the
// header comment in src/content/seo.ts, which exists to keep it that way.
// The `.ts` extension is required here: Vite 8 warns on an extensionless
// import in the config itself, and tsconfig.node.json allows it.
import { seoFacts } from './src/content/seo.ts'

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

  /**
   * The published snapshot, read from disk at build time.
   *
   * The CMS owns the title, the description and the social card
   * (`seo_title`, `seo_description`, `og_image_id`); it has owned them since
   * the admin shipped, and until now NOTHING consumed them — the title and
   * description were hard-coded in index.html and the og:image was a
   * hard-coded path, so editing any of the three in the admin changed
   * nothing on the deployed site. This is what closes that loop, and it is
   * why the publish -> export -> build pipeline now genuinely reaches the
   * metadata.
   *
   * Absent or unparseable is a normal state, not an error: a clone that has
   * never run the CMS has no snapshot.json, and the authored defaults in
   * src/content/seo.ts are correct on their own. Same contract as
   * src/content/snapshot.ts.
   */
  const readSnapshot = () => {
    const str = (value: unknown): string | undefined =>
      typeof value === 'string' && value.trim().length > 0
        ? value.trim()
        : undefined

    try {
      const path = fileURLToPath(
        new URL('./src/content/snapshot.json', import.meta.url),
      )
      const data = JSON.parse(readFileSync(path, 'utf8')) as Record<
        string,
        unknown
      >
      const obj = (value: unknown): Record<string, unknown> =>
        value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

      const site = obj(data.site)
      const seo = obj(site.seo)
      const meta = obj(data._meta)
      // The export serialises an asset as an object; tolerate a bare string
      // too rather than depending on which shape the API emits.
      const ogAsset = obj(seo.ogImage)

      return {
        title: str(seo.title),
        description: str(seo.description),
        ogImage: str(ogAsset.url) ?? str(seo.ogImage),
        name: str(site.name),
        portrait: str(obj(obj(data.about).portrait).url),
        /** Profile URLs only — `mailto:` is not a `sameAs` value. */
        sameAs: (Array.isArray(site.social) ? site.social : [])
          .map((entry) => str(obj(entry).href))
          .filter((href): href is string => !!href && /^https?:\/\//.test(href)),
        publishedAt: str(meta.publishedAt),
      }
    } catch {
      return null
    }
  }

  /** Authored defaults, with any real CMS value laid over the top. */
  const effective = () => {
    const snap = readSnapshot()
    return {
      title: snap?.title ?? seoFacts.title,
      description: snap?.description ?? seoFacts.description,
      ogImage: snap?.ogImage ?? seoFacts.socialCard.path,
      name: snap?.name ?? 'Mohammed Majeed J',
      portrait: snap?.portrait,
      sameAs: snap?.sameAs ?? [],
      publishedAt: snap?.publishedAt,
    }
  }

  /**
   * schema.org JSON-LD as a `@graph` of three cross-referenced nodes.
   *
   * `docs/SEO.md` previously recorded structured data as *deliberately*
   * absent, and the reason was sound: every field it wants is a claim about a
   * real person, and the build is not entitled to decide what is true. That
   * blocker is gone — Mohammed supplied the positioning, the degrees and the
   * locations directly — so the facts now live in src/content/seo.ts under
   * the same no-invention rule as the rest of the content layer.
   *
   * Emitted at build time rather than from React because Google must be able
   * to read it without executing the bundle. A `<script type="application/
   * ld+json">` block is a DATA block, not executable script, so
   * `script-src 'self'` does not apply to it and the CSP stays strict.
   *
   * Deliberately NOT here: project-level CreativeWork/SoftwareSourceCode.
   * There are no project pages — one document, hash anchors — so there is no
   * page for a project entity to be the subject of, and Google produces no
   * rich result for it. See docs/SEO-AUDIT.md.
   */
  const structuredData = (origin: string) => {
    const seen = effective()
    const person = `${origin}/#person`
    const website = `${origin}/#website`

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': person,
          name: seen.name,
          alternateName: seoFacts.alternateName,
          url: `${origin}/`,
          ...(seen.portrait ? { image: `${origin}${seen.portrait}` } : {}),
          jobTitle: [...seoFacts.jobTitle],
          description: seoFacts.personDescription,
          knowsAbout: [...seoFacts.knowsAbout],
          alumniOf: seoFacts.alumniOf.map((org) => ({
            '@type': 'EducationalOrganization',
            name: org.name,
            ...(org.url ? { url: org.url } : {}),
            ...(org.addressLocality
              ? {
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: org.addressLocality,
                    ...(org.addressRegion
                      ? { addressRegion: org.addressRegion }
                      : {}),
                    ...(org.addressCountry
                      ? { addressCountry: org.addressCountry }
                      : {}),
                  },
                }
              : {}),
          })),
          ...(seen.sameAs.length ? { sameAs: seen.sameAs } : {}),
        },
        {
          '@type': 'WebSite',
          '@id': website,
          url: `${origin}/`,
          // The name Google is ASKED to use for the site. It derives site
          // names from several signals and may still pick its own.
          name: seoFacts.siteName,
          alternateName: seen.name,
          description: seen.description,
          inLanguage: 'en',
          publisher: { '@id': person },
        },
        {
          // The homepage is genuinely *about* one person, which is exactly
          // what ProfilePage means. `mainEntity` is the part that matters.
          '@type': 'ProfilePage',
          '@id': `${origin}/#webpage`,
          url: `${origin}/`,
          name: seen.title,
          description: seen.description,
          isPartOf: { '@id': website },
          about: { '@id': person },
          mainEntity: { '@id': person },
          inLanguage: 'en',
          ...(seen.publishedAt ? { dateModified: seen.publishedAt } : {}),
        },
      ],
    }
  }

  return {
    name: 'site-metadata',
    transformIndexHtml(html) {
      const origin = read()
      const seen = effective()
      const env = loadEnv(mode, process.cwd(), '')

      /**
       * A preview deployment must not compete with production in the index.
       * It already emits no canonical and no sitemap, but nothing previously
       * stopped a `*.vercel.app` preview being crawled outright. This does.
       */
      const isPreview = env.VERCEL_ENV === 'preview'

      const tags: {
        tag: string
        attrs: Record<string, string>
        injectTo: 'head'
        children?: string
      }[] = [
        {
          tag: 'meta',
          attrs: {
            name: 'robots',
            content: isPreview
              ? 'noindex, nofollow'
              : // max-image-preview:large is what allows Google to show a
                // full-size thumbnail instead of a 100px one.
                'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { property: 'og:site_name', content: seoFacts.siteName },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { property: 'og:locale', content: 'en_US' },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { property: 'og:title', content: seen.title },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { property: 'og:description', content: seen.description },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:title', content: seen.title },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:description', content: seen.description },
          injectTo: 'head',
        },
      ]

      if (origin) {
        const image = `${origin}${seen.ogImage}`
        tags.push(
          {
            tag: 'link',
            attrs: { rel: 'canonical', href: `${origin}/` },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { property: 'og:url', content: `${origin}/` },
            injectTo: 'head',
          },
          {
            // Social scrapers require an absolute image URL; a root-relative
            // one is silently dropped by most of them.
            tag: 'meta',
            attrs: { property: 'og:image', content: image },
            injectTo: 'head',
          },
          {
            // Dimensions let a scraper lay the card out before the image
            // arrives, and are what stop it falling back to a small preview.
            tag: 'meta',
            attrs: {
              property: 'og:image:width',
              content: String(seoFacts.socialCard.width),
            },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: {
              property: 'og:image:height',
              content: String(seoFacts.socialCard.height),
            },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: {
              property: 'og:image:alt',
              content: seoFacts.socialCard.alt,
            },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { name: 'twitter:image', content: image },
            injectTo: 'head',
          },
          {
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            children: JSON.stringify(structuredData(origin)),
            injectTo: 'head',
          },
        )
      }

      /**
       * index.html carries the authored title and description so that the
       * page is correct even if this plugin never runs. When the CMS has
       * overridden either one, rewrite it in place rather than appending a
       * second copy — duplicate titles and descriptions are themselves an
       * SEO defect.
       */
      let out = html
      const escape = (value: string) =>
        value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')

      out = out.replace(
        /<title>[\s\S]*?<\/title>/,
        `<title>${escape(seen.title)}</title>`,
      )
      out = out.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${escape(seen.description)}" />`,
      )

      return { html: out, tags }
    },
    generateBundle() {
      const origin = read()

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source:
          'User-agent: *\nAllow: /\n' +
          // The admin is a private application, not search result material.
          // It is already `X-Robots-Tag: noindex` at the edge; this saves the
          // crawl budget as well. Not a security control — see docs/SEO.md.
          '\n# The admin is a private app. Excluded from crawling, and served\n' +
          '# with X-Robots-Tag: noindex. This is not an access control.\n' +
          'Disallow: /admin/\n' +
          (origin
            ? `\nSitemap: ${origin}/sitemap.xml\n`
            : '\n# No Sitemap line: this build does not know the site URL, and\n' +
              '# a sitemap pointing at the wrong domain is worse than none.\n' +
              '# Set VITE_SITE_URL to fix.\n'),
      })

      if (origin) {
        // Day granularity, from the snapshot's own publish timestamp: the one
        // honest answer to "when did this page last change?" on a site whose
        // content is baked in at build time. Omitted when there is no
        // snapshot rather than defaulting to the build date, which would
        // claim a change that never happened.
        const published = effective().publishedAt
        const lastmod = published?.slice(0, 10)
        const validLastmod =
          lastmod && /^\d{4}-\d{2}-\d{2}$/.test(lastmod) ? lastmod : undefined

        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source:
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            '  <url>\n' +
            `    <loc>${origin}/</loc>\n` +
            (validLastmod ? `    <lastmod>${validLastmod}</lastmod>\n` : '') +
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
