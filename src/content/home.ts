import type { HomeContent } from '@/types/content'

export const home: HomeContent = {
  greeting: 'Welcome',

  headline: 'I build systems that hold together.',

  // Self-described roles. Confirmed.
  roles: ['Full Stack Developer', 'Python Backend Specialist', 'AI Enthusiast'],

  introduction:
    'I work across the whole stack — Python and FastAPI services, React interfaces, and the data and AI layers in between. This is a selection of what I have built and how I approach the work.',

  primaryCta: { label: 'View Projects', href: '#projects' },

  resume: {
    label: 'Résumé',
    href: '/assets/documents/mohammed-majeed-j-resume.pdf',
    external: true,
  },

  // Slugs from projects.ts. Order here is the order on screen — flagship first.
  featuredProjectSlugs: [
    'periyar-phd-admission-system',
    'zara-ai-platform',
    'diabetes-prediction',
  ],

  technologyHighlights: [
    'React',
    'TypeScript',
    'Python',
    'FastAPI',
    'Node.js',
    'PostgreSQL',
    'Tailwind CSS',
  ],

  // The approved cinematic background, already processed into a seamless loop.
  // See public/assets/background/README.md for what was done to it and why.
  background: {
    src: '/assets/background/cabin-background.mp4',
    poster: '/assets/background/cabin-poster.webp',
    type: 'video/mp4',
    durationSeconds: 7,
    width: 848,
    height: 478,
  },

  // TEMPORARY AUDIO. `placeholder-ambient.mp3` is a generated two-note pad, not
  // a real track — the player labels it as a placeholder on screen so it can
  // never be mistaken for a choice. Replace `src`, `title` and `artist`, then
  // set isPlaceholder to false.
  music: {
    title: 'Ambient placeholder',
    artist: 'Temporary — replace before launch',
    src: '/assets/audio/placeholder-ambient.mp3',
    isPlaceholder: true,
    defaultVolume: 0.4,
  },

  notes: {
    label: 'Field notes',
    // Short ambient lines for the notes panel. Unfilled entries are not rendered.
    lines: [
      'TODO_REPLACE_NOTE_CURRENTLY_BUILDING',
      'TODO_REPLACE_NOTE_CURRENTLY_LEARNING',
      'TODO_REPLACE_NOTE_AVAILABILITY',
    ],
  },
}
