import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { DataEngineering } from '@/pages/DataEngineering';
import { Statistics } from '@/pages/Statistics';
import { MLResults } from '@/pages/MLResults';
import { Strategy } from '@/pages/Strategy';
import { Report } from '@/pages/Report';
import { HistoryPage } from '@/pages/History';
import { SettingsPage } from '@/pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/data-engineering" element={<DataEngineering />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/ml-results" element={<MLResults />} />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/report" element={<Report />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
