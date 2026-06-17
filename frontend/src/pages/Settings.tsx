import { useState } from "react";
import { Settings, Save } from "lucide-react";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(localStorage.getItem("api_url") || (import.meta.env.VITE_API_URL as string) || "http://localhost:8000/api/v1");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("api_url", apiUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6"><Settings className="w-6 h-6 text-slate-400" /> Settings</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Backend API URL</label>
        <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <p className="text-xs text-slate-500 mt-2">Must end with /api/v1. Reload page after saving.</p>
        <button onClick={handleSave} className="mt-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all">
          <Save className="w-4 h-4" /> {saved ? "Saved!" : "Save"}
        </button>
      </div>
    </div>
  );
}
