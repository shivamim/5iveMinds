import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPipelineHistory, deletePipelineRun } from "../services/api";
import { History, Trash2, ArrowRight, Clock, Star } from "lucide-react";

export default function HistoryPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getPipelineHistory().then((res) => { setRuns(res); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this run?")) return;
    await deletePipelineRun(id);
    load();
  };

  if (loading) return <div className="p-8 text-slate-400">Loading history...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6"><History className="w-6 h-6 text-indigo-400" /> Pipeline History</h1>
      {runs.length === 0 ? <p className="text-slate-500">No runs yet.</p> : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">{run.dataset_name}</p>
                <p className="text-sm text-slate-500 truncate max-w-md">{run.business_question}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {run.started_at ? new Date(run.started_at).toLocaleDateString() : "-"}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {run.quality_score_avg != null ? run.quality_score_avg.toFixed(1) : "-"}</span>
                  <span className={`px-1.5 py-0.5 rounded ${run.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{run.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/dashboard/${run.id}`} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white"><ArrowRight className="w-4 h-4" /></Link>
                <button onClick={() => handleDelete(run.id)} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
