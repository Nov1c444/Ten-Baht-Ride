import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout/Layout'
import RoutesPage from '@/features/routes/RoutesPage'
import AdvisorPage from '@/features/advisor/AdvisorPage'
import AboutPage from '@/features/about/AboutPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RoutesPage />} />
        <Route path="/advisor" element={<AdvisorPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Layout>
  )
}
