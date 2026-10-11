# Majeed Portfolio — Frontend

The public portfolio and the admin panel. React + TypeScript + Vite, Tailwind v4,
Three.js / React Three Fiber for atmosphere only. Deploys to **Vercel**.

The API lives in a separate repository:
**[Majeed-Portfolio-Backend](https://github.com/hajihajara73-gif/Majeed-Portfolio-Backend)**
(FastAPI, deploys to Render, talks to Neon PostgreSQL).

```
this repo (Vercel)                      backend repo (Render)
┌──────────────────────┐                ┌──────────────────┐
│  /         public    │  contact form  │  FastAPI         │
│            site      │ ─────────────► │  /api/public/*   │
│  /admin/   admin SPA │  admin API     │  /api/admin/*    │
└──────────────────────┘ ─────────────► └────────┬─────────┘
   static only                                   ▼
   no database access                   Neon PostgreSQL
```

**The public site never queries the database.** Content is baked into the build
from `src/content/snapshot.json`, which the backend exports. The only runtime
request the site makes is the contact form.

## Two applications in here

| Path | What | npm project |
| --- | --- | --- |
| `src/`, `public/` | The public portfolio | this one |
| `admin/` | The admin panel, served at `/admin/` | its own |

They are deliberately separate npm projects with separate dependency trees. That
isolation is what guarantees no admin code reaches the public bundle, and it is
checked on every build.

## Local setup

```bash
npm install
cp .env.example .env.local     # then edit
npm run dev                    # http://localhost:3000
```

The admin, separately:

```bash
cd admin
npm install
npm run dev                    # http://localhost:5174/admin/
```

Leave `VITE_API_BASE_URL` **unset** locally. Requests then stay relative and
Vite's dev proxy forwards them to `localhost:8000`, keeping everything
same-origin so the session cookie behaves simply.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run typecheck` | `tsc -b`, no emit |
| `npm run lint` | ESLint |
| `npm run build` | Public site only |
| `npm run build:all` | Public site **and** admin into `dist/` — what Vercel runs |
| `npm run preview` | Serve the production build |
| `npm run content:pull` | Convenience wrapper; expects the backend checked out at `../backend`. From separate clones, run the export from the backend repo instead (below) |

## Environment variables

All of these are **compiled into the browser bundle and are public.** Never put a
credential in a `VITE_` variable.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SITE_URL` | for launch | This site's origin. Feeds the canonical link, `og:url`, absolute `og:image`, `robots.txt` and `sitemap.xml`. Unset ⇒ all of those are **omitted**, because a sitemap pointing at the wrong domain is worse than none |
| `VITE_CONTACT_ENDPOINT` | for launch | `https://<api host>/api/public/contact`. Unset ⇒ the form says sending is not connected rather than pretending |
| `VITE_API_BASE_URL` | **for production** | Origin of the API. Without it the admin issues relative `/api/...` requests that resolve against Vercel and 404 |

## Vercel

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | *(repository root — leave blank)* |
| Build command | `npm run build:all` |
| Output directory | `dist` |
| Node version | 22.x, pinned by `engines.node` |

`vercel.json` declares the build, the security headers and the one rewrite the
admin SPA needs. Note there is deliberately **no catch-all rewrite**: the public
site has no router and navigates by hash anchor, so `/about` is not a route and a
catch-all would turn an honest 404 into a soft 200 on every mistyped URL.

## Updating content

Publishing in the admin records a snapshot in the database; it does **not** by
itself change the live site. The site is built from the committed export:

```bash
# 1. In the admin: Preview → Publish
# 2. In the BACKEND repo, with FRONTEND_ROOT pointing at this checkout:
#      FRONTEND_ROOT=/path/to/this/repo python -m app.export
# 3. Here:
git add -A && git commit -m "content: publish" && git push
```

Vercel builds on push. `docs/DEPLOYMENT.md` §15 explains why the export is a
local step rather than something the Render service does.

## The rules that matter

**Content is not design.** Copy lives in `src/content/`, never in a component.
`src/content/index.ts` serves the published snapshot overlaid on those modules,
so a build with no snapshot still renders correctly.

**Tokens are not values.** Colours, sizes, radii, shadows and durations come from
`src/styles/tokens.css`. No hex codes in components.

## Documentation

| Document | Covers |
| --- | --- |
| `docs/SPEC.md` | Visual direction, the measured scrim values, visual tiers, the 3D layer, accessibility, performance |
| `docs/DEPLOYMENT.md` | Vercel + Render + Neon, environment variables, DNS, smoke tests, manual actions |
| `docs/ADMIN.md` | CMS architecture and the publish pipeline |
| `docs/PHASE-7-PRODUCTION-AUDIT.md` | Security audit findings and evidence. Its paths predate the repository split |
| `docs/SECURITY.md` | Operational security posture, what was verified against the live site, open findings |
| `docs/SEO.md` | What metadata is emitted and from where, how to verify it, what is deliberately absent |
| `docs/BACKUP-AND-RECOVERY.md` | What holds state, how to back it up, how to restore it |
| `docs/FINAL-PRODUCTION-READINESS-REPORT.md` | Pre-launch audit of the live deployment, and what is still open |
| `CLAUDE.md` | Working rules for this codebase |

## Outstanding

```bash
grep -r "TODO_REPLACE_" src/
```

Unfilled fields render as nothing rather than as a placeholder, so a section can
look finished while being empty. `docs/SPEC.md` §9 has the blocking pre-launch
list.
