import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPipelineResults } from "../services/api";
import { LayoutDashboard, Database, BarChart3, BrainCircuit, Lightbulb, FileText, ArrowRight, Clock, Star } from "lucide-react";

const AGENTS = [
  { key: "data_engineer", label: "Data Engineer", icon: Database, color: "bg-blue-500/10 text-blue-400 border-blue-500/20", path: "data-engineering" },
  { key: "statistician", label: "Statistician", icon: BarChart3, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", path: "statistics" },
  { key: "ml_engineer", label: "ML Engineer", icon: BrainCircuit, color: "bg-purple-500/10 text-purple-400 border-purple-500/20", path: "ml" },
  { key: "strategist", label: "Strategist", icon: Lightbulb, color: "bg-amber-500/10 text-amber-400 border-amber-500/20", path: "strategy" },
  { key: "designer", label: "Designer", icon: FileText, color: "bg-rose-500/10 text-rose-400 border-rose-500/20", path: "report" },
];

export default function Dashboard() {
  const { run_id } = useParams<{ run_id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!run_id) return;
    getPipelineResults(run_id)
      .then((res) => { setData(res); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [run_id]);

  if (loading) return <div className="p-8 text-slate-400">Loading results...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!data) return null;

  const run = data.run;
  const rawScore = run.quality_score_avg;
  const qScore = rawScore != null ? (rawScore > 100 ? rawScore / 100 : rawScore) : null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><LayoutDashboard className="w-8 h-8 text-indigo-400" /> Dashboard</h1>
        <p className="text-slate-400 mt-1">{run.dataset_name} — {run.business_question}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Quality Score</p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-2xl font-bold">{qScore != null ? `${qScore.toFixed(1)}%` : "N/A"}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Total Time</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className="text-2xl font-bold">{run.total_time_ms ? `${(run.total_time_ms / 1000).toFixed(1)}s` : "N/A"}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-3 h-3 rounded-full ${run.status === "completed" ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-2xl font-bold capitalize">{run.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((agent) => {
          const exec = data.executions?.[agent.key];
          const Icon = agent.icon;
          return (
            <Link key={agent.key} to={`/${agent.path}/${run_id}`} className="group bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 transition-all">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${agent.color}`}><Icon className="w-6 h-6" /></div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
              <h3 className="font-semibold mt-3">{agent.label}</h3>
              <p className="text-xs text-slate-500 mt-1 capitalize">{exec ? `${exec.status} • ${exec.quality_score != null ? exec.quality_score + "%" : "no score"}` : "No data"}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
