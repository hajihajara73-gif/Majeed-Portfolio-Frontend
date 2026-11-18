import { seoFacts } from './seo'
import type { Project, ProjectsContent } from '@/types/content'

/**
 * The four real projects.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * VERIFICATION RULE
 *
 * Every technology and every highlight below was read out of the actual
 * repository — package.json / requirements.txt / composer config / source
 * files — not inferred from what a project of this kind "usually" uses.
 *
 * Two things were deliberately NOT claimed:
 *
 *   • Tailwind CSS on the PhD project. Its README says "React + Vite +
 *     TailwindCSS", but `tailwindcss` is not a dependency in any of the six
 *     package.json files and there is no tailwind config anywhere in the tree.
 *     Only `tailwind-merge` (a class-string utility) is installed. Bootstrap 5
 *     is what is actually there, so Bootstrap is what is listed.
 *
 *   • Accuracy figures for the diabetes model. `train_model.py` prints an
 *     accuracy score at training time but nothing in the repository records
 *     the value, so no number is published.
 *
 * If you add a project later, hold it to the same rule: if the repository does
 * not prove it, it does not go on the page.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** FLAGSHIP — a production system in real use by a state university. */
const phdAdmission: Project = {
  slug: 'periyar-phd-admission-system',
  title: 'Periyar University PhD Admission Management System',
  shortTitle: 'PhD Admission Management System',
  category: 'Full-Stack Web Application',
  organization: 'Periyar University',
  status: 'live',
  order: 1,
  featured: true,

  summary:
    'A comprehensive web-based PhD Admission Management System developed to streamline and digitize the university’s research admission workflow. The platform provides structured student and administrative workflows for managing the PhD admission process through dedicated web interfaces.',

  description: [
    'The system is organised as a monorepo of four independent portals — student, admin, supervisor and research centre — each with its own React frontend and Express API, all sharing a single MySQL database. A separate NestJS service owns queued email delivery.',
  ],

  // Verified across student/, admin/, supervisor/, center/ and email-service/.
  technologies: [
    'React 19',
    'Vite',
    'React Router 7',
    'Bootstrap 5',
    'Node.js',
    'Express',
    'MySQL',
    'NestJS',
    'Prisma',
    'JWT',
    'Argon2',
    'Redis',
    'BullMQ',
    'Nodemailer',
    'Docker',
    'Nginx',
  ],

  highlights: [
    'Four separate portals — student, admin, supervisor and research centre — sharing one MySQL database',
    'JWT authentication with per-module secrets, Argon2 password hashing and Redis-backed rate limiting',
    'Versioned SQL migrations covering the admission workflow, eligibility rules and payment handling',
    'Queued transactional email through a dedicated NestJS + BullMQ service',
    'Document uploads, plus generated PDFs, Excel exports and QR codes',
    'Containerised with Docker Compose behind an Nginx reverse proxy',
  ],

  cover: {
    src: '/assets/projects/phd-1280.webp',
    srcSet:
      '/assets/projects/phd-640.webp 640w, /assets/projects/phd-1280.webp 1280w',
    sizes: '(max-width: 768px) 92vw, 60vw',
    alt: 'Screenshot of the Periyar University PhD Admission Portal home page, showing admission notifications, important dates and applicant login links.',
    width: 1280,
    height: 800,
  },
  gallery: [],

  liveUrl: 'http://research.periyaruniversity.ac.in/rnd-app/student-app/home',
  github: 'https://github.com/majeed74905/project-cdoe',

  architecture:
    'Monorepo with four independent portals, each a React + Vite frontend paired with its own Express API, sharing one MySQL schema. Shared database pooling, mail transport and JWT middleware live in a common module. A standalone NestJS service handles queued email via BullMQ and Redis. Nginx reverse-proxies the modules in production.',

  problem: null,
  features: [],
  challenges: [],
  solutions: [],
  results: [],
}

/** The published release, defined once in `seo.ts`. */
const nexusRelease = seoFacts.publishedApps[0]!

/**
 * PUBLISHED PRODUCT — live on the Microsoft Edge Add-ons store.
 *
 * Verified against the repository at ~/Desktop/Nexus, not against the brief:
 *
 *   • version 3.0.0 — `release/extension/manifest.json`, the artifact
 *     Microsoft reviewed, and the root `package.json`.
 *   • Manifest V3 — `manifest_version: 3` in that same file.
 *   • Tesseract.js + WebAssembly — vendored into `release/extension/ocr/`
 *     as `eng.traineddata` and `tesseract-core-simd-lstm.wasm.js`. Bundled,
 *     not fetched, which is what makes "local OCR" true rather than a claim.
 *   • esbuild + TypeScript — the extension's only build dependencies.
 *   • Canvas API — `packages/ocr/src/render.ts`.
 *   • Playwright / Vitest — `apps/e2e` and `packages/engine`.
 *
 * REACT, VITE AND TAILWIND ARE DELIBERATELY NOT LISTED. They are real, but
 * they belong to `apps/web`, a companion React console in the same monorepo
 * — not to the extension Microsoft published. Listing them under a card
 * headed "Microsoft Edge Add-ons" would describe a different artifact. The
 * companion console is named in `architecture` instead, where it is true.
 *
 * `github` is null: the project has no git remote, no `repository` field and
 * no public source URL anywhere in its tree. Nothing to link, so nothing is
 * linked.
 */
const nexus: Project = {
  slug: 'nexus-local-ai-privacy-firewall',
  title: 'NEXUS 3.0 — Local AI Privacy Firewall',
  shortTitle: 'NEXUS 3.0',
  category: 'Browser Extension / Privacy & Security',
  status: 'live',
  order: 2,
  featured: true,

  // Read from seoFacts, not restated. The same values drive the schema.org
  // SoftwareApplication emitted at build time, so the badge on the card and
  // the structured data a crawler reads cannot disagree about the version.
  release: {
    version: nexusRelease.version,
    channel: nexusRelease.channel,
  },

  summary:
    'A local-first privacy firewall for AI tools. NEXUS inspects what you are about to send — typed prompts, screenshots and clipboard text — finds credentials, keys and personal data in it, scores the risk, and offers a sanitized version to send instead.',

  description: [
    'The architectural argument is the product: an AI service cannot be the thing that decides whether your data is safe to send to an AI service, because asking it means sending the data first. So detection, scoring and redaction all run on the device, before anything crosses the boundary.',
    'What that protects is the raw value. When you choose to send a sanitized prompt, the sanitized text is still submitted to whichever AI provider you are using — the secret is what stays behind, replaced by a placeholder that keeps the prompt answerable.',
  ],

  technologies: [
    'TypeScript',
    'Manifest V3',
    'Tesseract.js',
    'WebAssembly',
    'esbuild',
    'Canvas API',
    'Chrome Extensions API',
    'Playwright',
    'Vitest',
  ],

  highlights: [
    'Screenshot privacy firewall — reads text out of a PNG, JPG or WEBP with a bundled WebAssembly OCR engine, maps each detection back to its pixels, and redacts it before the image is saved',
    'Clipboard guardian — scans clipboard text only when you hand it over; `clipboardRead` is an optional permission, so there is no background monitoring',
    'Destination-aware policy — rules name both sides, so "API key heading for an external AI" resolves differently from "email address heading for your own organisation"',
    'The extension ships with no host permissions and no network code at all: the build fails if fetch, XMLHttpRequest, WebSocket, sendBeacon or importScripts appear in the content-script bundle',
    'Content-Security-Policy pins connect-src to ‘self’, so extension pages cannot reach an external origin even if a future bug tried to',
    'Proven end to end by a Playwright suite that loads the real unpacked extension, feeds it credentials rendered into actual pixels, and checks the sanitized PNG differs where the secret was',
  ],

  /* The cover is set in the CMS — the Microsoft Edge Add-ons listing itself,
     which is the one piece of evidence a visitor can verify independently.
     Repeated here so a build with no snapshot shows the same picture rather
     than an older one; `published.ts` overlays the CMS copy when there is a
     snapshot, and the two now point at the same file. No `srcSet`: the CMS
     does not generate responsive variants, and inventing one here would make
     most viewports load a file the CMS has never heard of. */
  cover: {
    src: '/uploads/image/f30e85ff2fc45b369b5c771d5d01a4a1.png',
    sizes: '(max-width: 768px) 92vw, 45vw',
    alt: 'The NEXUS listing on the Microsoft Edge Add-ons store: the extension titled NEXUS — Local AI Privacy Firewall, filed under Productivity with a Get button, two store screenshots showing the scanner and the image redaction view, and a sidebar reading Version 3.0.0, updated 8 November 2026.',
    width: 1872,
    height: 902,
  },

  /* Real captures from the project's own Playwright run, not mock-ups: the
     suite drives the running product and writes these to `apps/e2e/run-shots`.
     Every alt text below describes what is actually on screen in that frame.

     The 2.0-era landing shot is deliberately not used — it carries a "2.0"
     badge, and showing it beside a 3.0.0 release would contradict the badge
     a reader just looked at. */
  gallery: [
    {
      src: '/assets/projects/nexus-explain-1280.webp',
      srcSet:
        '/assets/projects/nexus-explain-640.webp 640w, /assets/projects/nexus-explain-1280.webp 1280w',
      sizes: '(max-width: 768px) 92vw, 45vw',
      alt: 'A detection expanded to show why it was flagged: a database password identified as a credential at 79% confidence, located at characters 51 to 62, with the structural detector layer named and the policy set to block.',
      width: 1280,
      height: 800,
    },
    {
      src: '/assets/projects/nexus-sanitized-1280.webp',
      srcSet:
        '/assets/projects/nexus-sanitized-640.webp 640w, /assets/projects/nexus-sanitized-1280.webp 1280w',
      sizes: '(max-width: 768px) 92vw, 45vw',
      alt: 'The sanitized result: the original prompt rewritten with six values replaced by placeholders such as [PASSWORD_REDACTED] and [API_KEY_REDACTED], beside a rebuilt prompt that lists which values were withheld so the model still has the context to answer.',
      width: 1280,
      height: 800,
    },
  ],

  liveUrl: nexusRelease.url,
  // No git remote, no `repository` field, no public source URL in the tree.
  github: null,

  architecture:
    'A TypeScript monorepo. A shared detection engine does preprocessing, detection, risk scoring and sanitization, and is consumed by three surfaces: the Manifest V3 browser extension published on Edge, an OCR package wrapping a vendored WebAssembly Tesseract build, and a companion React console for reviewing content outside the browser extension. The extension bundle is built with esbuild and carries no runtime dependencies.',

  problem:
    'Pasting a stack trace, a config file or a screenshot into a chatbot sends whatever was in it — API keys, database URLs, customer data — to a third party’s logs, and possibly a training set. Rotating the key is the only remedy, and most people never realise they need to.',

  features: [],
  challenges: [],
  solutions: [],
  results: [],
}

const zaraAi: Project = {
  slug: 'zara-ai-platform',
  title: 'Zara AI Platform',
  shortTitle: 'Zara AI',
  category: 'AI Platform / Full-Stack Web Application',
  status: 'live',
  order: 3,
  featured: true,

  summary:
    'An AI-powered web platform focused on providing an interactive assistant experience through a modern web interface and AI service integrations.',

  description: [],

  technologies: [
    'React 18',
    'TypeScript',
    'Vite',
    'Tailwind CSS',
    'React Router 6',
    'Framer Motion',
    'Google Gemini',
    'Groq',
    'Monaco Editor',
    'Sandpack',
    'Google OAuth',
    'IndexedDB',
    'Netlify',
  ],

  highlights: [
    'Integrates two model providers — Google Gemini (@google/genai) and Groq — behind a shared model manager',
    'In-browser code workspace built on Monaco Editor and CodeSandbox Sandpack',
    'Chat, voice, live-session and image modes alongside study tools such as exam prep and flashcards',
    'Diagram rendering through Graphviz (viz.js)',
    'Google OAuth sign-in with local persistence via IndexedDB for offline use',
  ],

  cover: {
    src: '/assets/projects/zara-1280.webp',
    srcSet:
      '/assets/projects/zara-640.webp 640w, /assets/projects/zara-1280.webp 1280w',
    sizes: '(max-width: 768px) 92vw, 45vw',
    alt: 'Screenshot of the Zara AI workspace, showing a sidebar of chat, live, image, tutor, exam and code modes beside a prompt entry area.',
    width: 1280,
    height: 800,
  },
  gallery: [],

  liveUrl: 'https://zara-ai-assists.netlify.app/',
  github: 'https://github.com/majeed74905/zara-ai-frontend',

  architecture: null,
  problem: null,
  features: [],
  challenges: [],
  solutions: [],
  results: [],
}

const diabetesPrediction: Project = {
  slug: 'diabetes-prediction',
  title: 'Diabetes Prediction',
  shortTitle: 'Diabetes Prediction',
  category: 'Machine Learning',
  status: 'live',
  order: 4,
  featured: true,

  summary:
    'A machine-learning based web application that predicts the likelihood of diabetes using user-provided input parameters. The project demonstrates the integration of a trained machine-learning workflow with a web-accessible prediction interface.',

  description: [],

  technologies: [
    'Python 3.11',
    'Flask',
    'scikit-learn',
    'Logistic Regression',
    'pandas',
    'NumPy',
    'joblib',
    'Gunicorn',
    'Render',
  ],

  highlights: [
    'Logistic Regression classifier trained with scikit-learn',
    'StandardScaler feature scaling, with model and scaler persisted via joblib',
    'Eight clinical inputs, including glucose, BMI, insulin and diabetes pedigree function',
    'Separate preprocessing, training and prediction modules, plus an EDA notebook',
    'Deployed on Render under Gunicorn with a health-check endpoint',
  ],

  cover: {
    src: '/assets/projects/diabetes-1280.webp',
    srcSet:
      '/assets/projects/diabetes-640.webp 640w, /assets/projects/diabetes-1280.webp 1280w',
    sizes: '(max-width: 768px) 92vw, 45vw',
    alt: 'Screenshot of the diabetes risk prediction web form, showing clinical input fields for glucose, blood pressure, insulin, BMI and age.',
    width: 1280,
    height: 800,
  },
  gallery: [],

  liveUrl: 'https://diabetic-prediction-y2qs.onrender.com/',
  github: 'https://github.com/majeed74905/diabetic-prediction',

  architecture: null,
  problem: null,
  features: [],
  challenges: [],
  solutions: [],
  results: [],
}
export const projects: ProjectsContent = {
  eyebrow: 'Projects',
  heading: 'Selected work',
  introduction:
    'Four projects, listed with the technologies each repository actually contains.',
  items: [phdAdmission, nexus, zaraAi, diabetesPrediction],
}

/* Display order, the flagship and the rest used to be derived here and
 * imported directly by ProjectsSection. They are gone on purpose.
 *
 * This module is the BASE content. `published.ts` overlays the CMS snapshot
 * onto it and `@/content` serves the result, so anything derived from this
 * file alone silently ignores every edit made in the admin. ProjectsSection
 * now derives the order from the overlaid list instead; see the note there.
 */
