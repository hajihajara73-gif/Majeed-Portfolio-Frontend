import type { SiteContent } from '@/types/content'
import { seoFacts } from './seo'

export const site: SiteContent = {
  name: 'Mohammed Majeed J',
  shortName: 'Mohammed Majeed',
  monogram: 'MJ',

  // Needed for canonical URL, OG tags and sitemap.xml. Set VITE_SITE_URL once
  // and the same value feeds the build-time metadata in vite.config.ts, so
  // there is a single place to change it rather than three.
  url: import.meta.env.VITE_SITE_URL ?? 'TODO_REPLACE_SITE_URL',

  locale: 'en',

  // Authored in `seo.ts`, not here. That module is the one place both the app
  // and `vite.config.ts` can read from, which is what keeps the rendered
  // <title> and the build-time Open Graph tags from drifting apart. The CMS
  // (`seo_title`, `seo_description`, `og_image_id`) overrides all three.
  seo: {
    title: seoFacts.title,
    description: seoFacts.description,
    ogImage: seoFacts.socialCard.path,
  },

  // The only seven top-level destinations. Do not add to this list.
  nav: [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'career', label: 'Career' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'contacts', label: 'Contacts' },
  ],

  // Shown in the hero and the footer. Each link is hidden until its href is
  // real, so an unfilled profile never renders as a dead icon.
  social: [
    { label: 'GitHub', href: 'https://github.com/majeed74905', external: true },
    {
      label: 'LinkedIn',
      // Confirmed by Mohammed on 2026-11-04. The previous value was the
      // auto-generated vanity URL (`/in/mohammed-majeed-a337842a4`).
      //
      // This list is REPLACED WHOLESALE by the CMS snapshot when one exists
      // (see published.ts), and the snapshot still carries the old URL — so
      // changing it here fixes a snapshot-less build and records the truth in
      // the repository, but the live site and the JSON-LD `sameAs` follow the
      // snapshot until this is updated in the admin and re-published.
      href: 'https://www.linkedin.com/in/majeed74905/',
      external: true,
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/md_afzal_3237/',
      external: true,
    },
    { label: 'Email', href: 'mailto:majeed74905@gmail.com', external: true },
  ],

  footerNote: 'Designed and built by Mohammed Majeed J.',
}
