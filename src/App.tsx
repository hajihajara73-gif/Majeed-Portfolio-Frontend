import { useEffect } from 'react'
import { CinematicBackground } from '@/components/CinematicBackground'
import { ScrollProgress } from '@/components/ScrollProgress'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { home } from '@/content'
import { auditContent } from '@/lib/contentAudit'
import { AboutSection } from '@/sections/AboutSection'
import {
  AchievementsSection,
  CertificatesSection,
} from '@/sections/AchievementsSection'
import { CareerSection } from '@/sections/CareerSection'
import { ContactsSection } from '@/sections/ContactsSection'
import { HomeSection } from '@/sections/HomeSection'
import { ProjectsSection } from '@/sections/ProjectsSection'
import { SkillsSection } from '@/sections/SkillsSection'

export default function App() {
  useEffect(() => {
    auditContent()
  }, [])

  return (
    <>
      <a href="#main" className="skip-link glass-panel px-4 py-2 text-ink">
        Skip to content
      </a>

      <CinematicBackground background={home.background} />
      <ScrollProgress />
      <SiteHeader />

      <main id="main">
        <HomeSection />

        {/* About stays inside the cabin.
            It is the one section where the environment is the point — the
            portrait is composited into the workspace rather than floating on
            flat ground — so it sits directly on the footage and carries its
            own measured scrim. */}
        <AboutSection />

        {/* Content ground.
            From Skills onward the page settles onto solid ground so body copy
            has a guaranteed, measurable contrast basis instead of sitting over
            whatever frame happens to be on screen. The gradient does the
            transition, so the video appears to sink behind the content rather
            than being cut off. */}
        <div style={{ background: 'var(--color-bg)' }}>
          <SkillsSection />
          <ProjectsSection />
          <CareerSection />
          <CertificatesSection />
          <AchievementsSection />
          <ContactsSection />
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
