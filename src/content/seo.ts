import type { StructuredDataFacts } from '@/types/content'

/**
 * SEO and structured-data facts.
 *
 * TWO HARD CONSTRAINTS SHAPE THIS FILE.
 *
 * 1. **It must stay importable by `vite.config.ts`.** The canonical link, the
 *    Open Graph tags, the JSON-LD and the sitemap are all emitted at BUILD
 *    time, because the public site is static and Google must see them without
 *    running JavaScript. So this module may contain no value imports, no
 *    `import.meta.env`, and nothing browser-only — only `import type`, which
 *    esbuild erases before the config ever executes. `site.ts` imports the
 *    defaults back out of here, so there is still exactly one authored source
 *    for the title and description rather than one per consumer.
 *
 * 2. **Every field is a claim about a real person.** The rule from
 *    `types/content.ts` applies in full: nothing here may be invented. Each
 *    value below is checkable against this repository, the live site, or
 *    something Mohammed stated directly — noted inline where it is not
 *    obvious. There is deliberately no employer, no job history, no
 *    credential count and no metric.
 *
 * Title, description and the social card are also owned by the CMS
 * (`seo_title`, `seo_description`, `og_image_id`). Where the published
 * snapshot carries a real value it WINS over the default here; these are the
 * fallbacks, and what a build with no snapshot uses.
 */
export const seoFacts: StructuredDataFacts = {
  /**
   * Requested site name for Google Search. Google generates site names from
   * several signals and may still choose something else — this makes the
   * request consistently (WebSite.name, og:site_name) rather than guaranteeing
   * the outcome. See docs/SEO-AUDIT.md §Site name.
   */
  siteName: 'Mohammed Majeed Portfolio',

  /**
   * 57 characters, so Google is unlikely to truncate it. Name first, because
   * the primary query this site has to win is the person's own name; the two
   * role keywords follow. Em dash matches the house style used site-wide.
   */
  title: 'Mohammed Majeed J — Full Stack & Python Backend Developer',

  /**
   * 135 characters. Leads with the name for name queries, then the stack that
   * the Projects and Skills sections actually evidence.
   */
  description:
    'Portfolio of Mohammed Majeed J — a full stack developer building Python and FastAPI backends, React interfaces, and applied AI projects.',

  /** Mohammed's stated personal branding. */
  alternateName: 'Afzal',

  /**
   * Accurate positioning, not seniority. He is a postgraduate student who
   * ships full-stack work; "senior" appears nowhere, deliberately.
   */
  jobTitle: ['Full Stack Developer', 'Python Backend Developer'],

  /** Every clause here is evidenced by the About, Skills and Projects content. */
  personDescription:
    'MCA student at Periyar University and a full stack developer working across Python and FastAPI backends, React and TypeScript interfaces, and applied AI.',

  /**
   * Topics, not a tool inventory. Each one is represented by something real:
   * FastAPI by this repository's own backend, machine learning by the
   * diabetes classifier, Docker by the PhD platform's Compose setup,
   * PostgreSQL by the Neon database behind the CMS.
   */
  knowsAbout: [
    'Full-stack web development',
    'Python',
    'FastAPI',
    'React',
    'TypeScript',
    'Node.js',
    'PostgreSQL',
    'REST API design',
    'Applied artificial intelligence',
    'Machine learning',
    'Docker',
    'Cloud deployment',
  ],

  /**
   * Both degrees and institutions are confirmed in `about.ts`. The cities come
   * from Mohammed directly. The Periyar University URL was checked and returns
   * 200; Islamiah College carries no `url` because none has been verified, and
   * a schema.org organisation is valid on its name alone.
   */
  alumniOf: [
    {
      name: 'Periyar University',
      addressLocality: 'Salem',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
      url: 'https://www.periyaruniversity.ac.in',
    },
    {
      name: 'Islamiah College (Autonomous)',
      addressLocality: 'Vaniyambadi',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
  ],

  /**
   * 1200x630 is what Open Graph and Twitter's `summary_large_image` both want.
   * The previous og:image was the 848x478 cabin poster, which every scraper
   * accepted but none showed at full size. Built from that same poster, so the
   * visual identity is unchanged — see docs/SEO-AUDIT.md.
   */
  socialCard: {
    path: '/assets/images/og-card.jpg',
    width: 1200,
    height: 630,
    alt: 'Mohammed Majeed J — Full Stack & Python Backend Developer',
  },
}
