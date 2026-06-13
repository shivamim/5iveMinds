import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DataEngineeringPage } from '@/pages/DataEngineeringPage'
import { StatisticsPage } from '@/pages/StatisticsPage'
import { MLResultsPage } from '@/pages/MLResultsPage'
import { StrategyPage } from '@/pages/StrategyPage'
import { ReportPage } from '@/pages/ReportPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/data" element={<DataEngineeringPage />} />
        <Route path="/dashboard/stats" element={<StatisticsPage />} />
        <Route path="/dashboard/ml" element={<MLResultsPage />} />
        <Route path="/dashboard/strategy" element={<StrategyPage />} />
        <Route path="/dashboard/report" element={<ReportPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
