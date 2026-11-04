import type { AboutContent } from '@/types/content'

export const about: AboutContent = {
  portrait: {
    src: '/assets/images/portrait-1024.webp',
    srcSet:
      '/assets/images/portrait-640.webp 640w, /assets/images/portrait-1024.webp 1024w',
    sizes: '(max-width: 768px) 80vw, 380px',
    alt: 'Mohammed Majeed J',
    width: 1024,
    height: 1538,
  },

  introduction:
    'I am a full stack developer focused on backend engineering with Python and applied AI.',

  /**
   * DRAFTED FROM VERIFIED EVIDENCE — please rewrite in your own voice.
   *
   * Every statement below is checkable: the degrees are confirmed, the PhD
   * platform is live and its architecture was read from the repository, the
   * Zara/Flask/PHP details come from those repositories, and "undergraduate
   * final year" is the library repo's own GitHub description. Nothing here is
   * invented — but the phrasing is mine, and it should sound like you.
   */
  biography: [
    'I am an MCA student at Periyar University, and most of what I know came from building things other people then had to use. The largest of those is the university’s own PhD admission platform — four separate portals over one MySQL database — which now runs in production for its research admissions.',
    'The rest of my work spans the stack rather than one corner of it: a React and TypeScript AI workspace built against Gemini and Groq, a scikit-learn classifier served through Flask, and a PHP records system from my undergraduate final year. Different languages, the same habit — get the data model right first, then make the interface honest about it.',
  ],

  // Only countable, checkable facts. No invented metrics, ever.
  facts: [
    { label: 'Studying', value: 'MCA · Periyar University' },
    { label: 'Projects shipped', value: '4' },
    { label: 'Publicly deployed', value: '3' },
    { label: 'In production', value: 'Periyar University' },
  ],

  // Degrees, institutions and cities are confirmed. DATES ARE NOT — they
  // have never been supplied unambiguously, so they stay TODO rather than
  // being approximated. Fill them in the admin, not here.
  education: [
    {
      degree: 'Master of Computer Applications (MCA)',
      institution: 'Periyar University',
      start: 'TODO_REPLACE_MCA_START_YEAR',
      end: 'TODO_REPLACE_MCA_END_YEAR',
      location: 'Salem, Tamil Nadu',
    },
    {
      degree: 'Bachelor of Computer Applications (BCA)',
      // Old site read "ISLMIAH COLLEGE (Autonomous)" — spelling corrected.
      institution: 'Islamiah College (Autonomous)',
      start: 'TODO_REPLACE_BCA_START_YEAR',
      end: 'TODO_REPLACE_BCA_END_YEAR',
      location: 'Vaniyambadi, Tamil Nadu',
    },
  ],

  interests: [
    'AI and machine learning',
    'Scalable backend systems',
    'Cloud infrastructure',
    'Cybersecurity',
  ],

  expertise: [
    {
      title: 'Full Stack Development',
      summary: 'React and TypeScript interfaces backed by APIs I also build.',
    },
    {
      title: 'Python Backend Engineering',
      summary: 'FastAPI services, relational data modelling, and API design.',
    },
    {
      title: 'Applied AI',
      summary:
        'Building on top of hosted model APIs and integrating them into products.',
    },
    {
      title: 'Cloud & Deployment',
      summary: 'Shipping and running applications on managed cloud platforms.',
    },
  ],

  philosophy: [
    {
      title: 'TODO_REPLACE_PHILOSOPHY_TITLE_1',
      body: 'TODO_REPLACE_PHILOSOPHY_BODY_1',
    },
  ],
}
