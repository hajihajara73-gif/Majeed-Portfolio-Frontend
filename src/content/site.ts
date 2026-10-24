import type { SiteContent } from '@/types/content'

export const site: SiteContent = {
  name: 'Mohammed Majeed J',
  shortName: 'Mohammed Majeed',
  monogram: 'MJ',

  // Needed for canonical URL, OG tags and sitemap.xml. Set VITE_SITE_URL once
  // and the same value feeds the build-time metadata in vite.config.ts, so
  // there is a single place to change it rather than three.
  url: import.meta.env.VITE_SITE_URL ?? 'TODO_REPLACE_SITE_URL',

  locale: 'en',

  seo: {
    title: 'Mohammed Majeed J — Full Stack Developer',
    description:
      'Full stack developer working across Python backends, React interfaces and applied AI. Selected projects, skills and background.',
    ogImage: 'TODO_REPLACE_OG_IMAGE',
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
      href: 'https://www.linkedin.com/in/mohammed-majeed-a337842a4',
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
