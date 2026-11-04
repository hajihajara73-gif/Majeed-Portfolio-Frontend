import type { CareerContent } from '@/types/content'

/**
 * The two degrees, their institutions and their cities are confirmed. DATES
 * and descriptions are not — leave them as TODO rather than approximating.
 *
 * No work experience has been supplied. If there is none yet, that is fine:
 * the timeline reads honestly as an education timeline. Do not invent roles.
 */
export const career: CareerContent = {
  eyebrow: 'Career',
  heading: 'The path so far',
  // Framing copy, not a personal claim: two degrees (about.ts) and four
  // projects (projects.ts), three of which have a live URL. Rewrite in your
  // own voice whenever you like — the facts are what must stay true.
  introduction:
    'No employment history yet — this is an education timeline, and the work that ran alongside it. The projects section is where the engineering lives.',

  entries: [
    {
      id: 'mca-periyar',
      title: 'Master of Computer Applications',
      organization: 'Periyar University',
      type: 'education',
      start: 'TODO_REPLACE_MCA_START_YEAR',
      end: 'TODO_REPLACE_MCA_END_YEAR',
      location: 'Salem, Tamil Nadu',
      description: 'TODO_REPLACE_MCA_DESCRIPTION',
      technologies: [],
    },
    {
      id: 'bca-islamiah',
      title: 'Bachelor of Computer Applications',
      organization: 'Islamiah College (Autonomous)',
      type: 'education',
      start: 'TODO_REPLACE_BCA_START_YEAR',
      end: 'TODO_REPLACE_BCA_END_YEAR',
      location: 'Vaniyambadi, Tamil Nadu',
      description: 'TODO_REPLACE_BCA_DESCRIPTION',
      technologies: [],
    },
  ],
}
