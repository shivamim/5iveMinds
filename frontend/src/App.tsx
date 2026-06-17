import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import PipelineExecution from "./pages/PipelineExecution";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import DataEngineering from "./pages/DataEngineering";
import Statistics from "./pages/Statistics";
import MLResults from "./pages/MLResults";
import Strategy from "./pages/Strategy";
import Report from "./pages/Report";
import History from "./pages/History";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pipeline/:run_id" element={<PipelineExecution />} />
        <Route element={<Layout />}>
          <Route path="/dashboard/:run_id" element={<Dashboard />} />
          <Route path="/data-engineering/:run_id" element={<DataEngineering />} />
          <Route path="/statistics/:run_id" element={<Statistics />} />
          <Route path="/ml/:run_id" element={<MLResults />} />
          <Route path="/strategy/:run_id" element={<Strategy />} />
          <Route path="/report/:run_id" element={<Report />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
