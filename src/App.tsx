import { Routes, Route } from 'react-router-dom'
import { APIProvider } from '@vis.gl/react-google-maps'
import Layout from '@/components/Layout/Layout'
import RoutesPage from '@/features/routes/RoutesPage'
import AdvisorPage from '@/features/advisor/AdvisorPage'
import AboutPage from '@/features/about/AboutPage'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export default function App() {
  const content = (
    <Layout>
      <Routes>
        <Route path="/" element={<RoutesPage />} />
        <Route path="/advisor" element={<AdvisorPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Layout>
  )

  if (!API_KEY) return content

  return (
    <APIProvider apiKey={API_KEY} libraries={['places']}>
      {content}
    </APIProvider>
  )
}
