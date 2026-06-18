import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { UploadPage } from '@/pages/UploadPage';
import { AskPage } from '@/pages/AskPage';
import { Dashboard } from '@/pages/Dashboard';
import { DataEngineering } from '@/pages/DataEngineering';
import History from '@/pages/History';
import Settings from '@/pages/Settings';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/ask" element={<AskPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/data-engineering" element={<DataEngineering />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
