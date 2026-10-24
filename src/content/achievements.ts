import type { Achievement, AchievementsContent } from '@/types/content'

/**
 * Certificates.
 *
 * Every title, issuer, date and credential number below was read off the
 * rendered certificate itself, not from the filename. Where a certificate
 * states a verification URL or credential ID, it is reproduced exactly.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ONE CERTIFICATE IS DELIBERATELY NOT PUBLISHED
 *
 * The Government of Tamil Nadu DOTE "Typewriting English Junior" provisional
 * certificate is listed here, but its scan and PDF are NOT. That document
 * carries a date of birth, a register number, a passport photograph, a
 * signature and the IP address it was downloaded from — publishing it would
 * put a complete identity kit on a public page.
 *
 * The credential is still shown, because it is real. Only the scan is withheld.
 * If you want it published in full, add `image` and `document` to that entry —
 * but read the list above again first.
 * ────────────────────────────────────────────────────────────────────────────
 */

const img = (slug: string, alt: string) => ({
  src: `/assets/certificates/${slug}-1200.webp`,
  srcSet: `/assets/certificates/${slug}-600.webp 600w, /assets/certificates/${slug}-1200.webp 1200w`,
  sizes: '(max-width: 640px) 92vw, 360px',
  alt,
  width: 1200,
})

const items: readonly Achievement[] = [
  {
    id: 'google-technical-support',
    title: 'Technical Support Fundamentals',
    type: 'certificate',
    organization: 'Google · Coursera',
    date: '28 December 2023',
    description:
      'An online non-credit course authorised by Google and offered through Coursera.',
    verificationUrl: 'https://coursera.org/verify/5P6T26PGMSK9',
    document: '/assets/documents/certificates/google-technical-support.pdf',
    image: img(
      'google-technical-support',
      'Google Technical Support Fundamentals certificate issued through Coursera.',
    ),
    featured: true,
  },
  {
    id: 'iit-bombay-intro-to-computers',
    title: 'Introduction to Computers',
    type: 'certificate',
    organization: 'Spoken Tutorial Project, IIT Bombay',
    date: '26 August 2023',
    description:
      'Training organised at Islamiah College (Autonomous), completed with an online exam conducted remotely from IIT Bombay. Score: 100%.',
    credentialId: '3317078B6Y',
    document:
      '/assets/documents/certificates/iit-bombay-intro-to-computers.pdf',
    image: img(
      'iit-bombay-intro-to-computers',
      'Spoken Tutorial Project, IIT Bombay certificate for Introduction to Computers training.',
    ),
    featured: true,
  },
  {
    id: 'isea-cyber-security',
    title: 'Cyber Security',
    type: 'certificate',
    organization: 'MeitY · ISEA',
    date: '30 December 2023',
    description:
      'Information Security Education and Awareness programme, Ministry of Electronics and Information Technology.',
    credentialId: 'MeitY/ISEA/WCHP/033210',
    document: '/assets/documents/certificates/isea-cyber-security.pdf',
    image: img(
      'isea-cyber-security',
      'MeitY ISEA cyber security certificate.',
    ),
    featured: true,
  },
  {
    id: 'simplilearn-data-science-python',
    title: 'Data Science with Python',
    type: 'certificate',
    organization: 'Simplilearn',
    date: '29 December 2023',
    credentialId: '4748011',
    description: 'TODO_REPLACE_SIMPLILEARN_DESCRIPTION',
    document:
      '/assets/documents/certificates/simplilearn-data-science-python.pdf',
    image: img(
      'simplilearn-data-science-python',
      'Simplilearn Data Science with Python certificate.',
    ),
    featured: true,
  },
  {
    id: 'tcs-ion-communication-skills',
    title: 'Communication Skills',
    type: 'certificate',
    organization: 'TCS iON',
    date: '19 January 2024',
    description:
      'Covering the process of communication, barriers to communication, and verbal and non-verbal communication.',
    credentialId: '91306-25782095-1016',
    document:
      '/assets/documents/certificates/tcs-ion-communication-skills.pdf',
    image: img(
      'tcs-ion-communication-skills',
      'TCS iON Communication Skills certificate of achievement.',
    ),
    featured: false,
  },
  {
    id: 'infosys-python-basics',
    title: 'Python Basics',
    type: 'certificate',
    organization: 'Infosys Springboard',
    date: '30 December 2023',
    description: 'TODO_REPLACE_INFOSYS_PYTHON_DESCRIPTION',
    verificationUrl: 'https://verify.onwingspan.com',
    document: '/assets/documents/certificates/infosys-python-basics.pdf',
    image: img(
      'infosys-python-basics',
      'Infosys Springboard Python Basics certificate.',
    ),
    featured: false,
  },
  {
    id: 'infosys-voice-controlled-robot',
    title: 'Voice Controlled Robot',
    type: 'certificate',
    organization: 'Infosys Springboard',
    date: '29 December 2023',
    description: 'Experiment 5 — Voice Controlled Robot (Skyrim Kit).',
    verificationUrl: 'https://verify.onwingspan.com',
    document:
      '/assets/documents/certificates/infosys-voice-controlled-robot.pdf',
    image: img(
      'infosys-voice-controlled-robot',
      'Infosys Springboard Voice Controlled Robot certificate.',
    ),
    featured: false,
  },
  {
    id: 'chandrayaan-3-mahaquiz',
    title: 'Chandrayaan-3 Mahaquiz',
    type: 'competition',
    organization: 'MyGov · ISRO',
    date: '2023',
    description: 'Certificate of participation in the national Chandrayaan-3 quiz.',
    document: '/assets/documents/certificates/chandrayaan-3-mahaquiz.pdf',
    image: img(
      'chandrayaan-3-mahaquiz',
      'MyGov and ISRO certificate of participation for the Chandrayaan-3 Mahaquiz.',
    ),
    featured: false,
  },
  {
    id: 'great-learning-python',
    title: 'Python Programming',
    type: 'certificate',
    organization: 'Great Learning Academy',
    date: 'July 2023',
    description: 'TODO_REPLACE_GREAT_LEARNING_DESCRIPTION',
    document: '/assets/documents/certificates/great-learning-python.pdf',
    image: img(
      'great-learning-python',
      'Great Learning Academy Python Programming certificate of completion.',
    ),
    featured: false,
  },
  {
    id: 'mindluster-python',
    title: 'Python',
    type: 'certificate',
    organization: 'Mindluster',
    date: '14 October 2023',
    description: 'TODO_REPLACE_MINDLUSTER_DESCRIPTION',
    credentialId: '10788473669',
    document: '/assets/documents/certificates/mindluster-python.pdf',
    image: img('mindluster-python', 'Mindluster Python certificate of achievement.'),
    featured: false,
  },
  {
    // Listed without its scan on purpose — see the note at the top of this file.
    id: 'dote-typewriting-english-junior',
    title: 'Typewriting English (Junior) — Second Class',
    type: 'certificate',
    organization:
      'Government of Tamil Nadu · Directorate of Technical Education',
    date: 'October 2023',
    description:
      'Government Technical Examinations, Board of Examinations, Chennai.',
    credentialId: 'PC / GA23036228',
    featured: false,
  },
]

export const achievements: AchievementsContent = {
  // The achievements section proper: awards, competitions, milestones —
  // everything that is not a course certificate.
  eyebrow: 'Achievements',
  heading: 'Recognition',
  introduction:
    'Competitions, awards and work that went further than the classroom.',
  items,
  emptyState: 'Nothing listed here yet.',

  // Categories come from the CMS. Empty here on purpose: the base module
  // must not invent a grouping the admin has not set.
  categories: [],

  certificates: {
    eyebrow: 'Certifications',
    heading: 'Certificates',
    introduction:
      'Certificates from Google, IIT Bombay, TCS iON, Infosys Springboard and others. Select any to read the original.',
  },
}
