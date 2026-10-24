import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { Layout } from '@/components/Layout'
import { ResourcePage } from '@/components/ResourcePage'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { Media, Messages } from '@/pages/Media'
import { Publish } from '@/pages/Publish'
import { AboutEditor, HomeEditor, SettingsEditor } from '@/pages/Singletons'
import {
  achievementsConfig,
  achievementCategoriesConfig,
  certificatesConfig,
  careerConfig,
  educationConfig,
  expertiseConfig,
  projectsConfig,
  skillCategoriesConfig,
  skillsConfig,
  socialConfig,
} from '@/pages/resources'
import { Spinner } from '@/components/ui'

/**
 * Route guard.
 *
 * Convenience only. It decides what to *render*; it decides nothing about what
 * the API will accept. Every endpoint re-checks the session server-side, so
 * bypassing this in the browser gains nothing.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { admin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Checking session" />
  if (!admin) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function SkillsPage() {
  return (
    <div className="space-y-10">
      <ResourcePage config={skillCategoriesConfig} />
      <ResourcePage config={skillsConfig} />
    </div>
  )
}

function CareerPage() {
  return (
    <div className="space-y-10">
      <ResourcePage config={careerConfig} />
      <ResourcePage config={educationConfig} />
    </div>
  )
}

function AboutPage() {
  return (
    <div className="space-y-10">
      <AboutEditor />
      <ResourcePage config={expertiseConfig} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="home" element={<HomeEditor />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route
            path="projects"
            element={<ResourcePage config={projectsConfig} />}
          />
          <Route path="career" element={<CareerPage />} />
          <Route
            path="certificates"
            element={<ResourcePage config={certificatesConfig} />}
          />
          <Route
            path="certificate-categories"
            element={<ResourcePage config={achievementCategoriesConfig} />}
          />
          <Route
            path="achievements"
            element={<ResourcePage config={achievementsConfig} />}
          />
          <Route path="media" element={<Media />} />
          <Route
            path="social"
            element={<ResourcePage config={socialConfig} />}
          />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<SettingsEditor />} />
          <Route path="publish" element={<Publish />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
