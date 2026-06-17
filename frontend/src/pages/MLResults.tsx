import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPipelineResults } from "../services/api";
import { BrainCircuit, Trophy, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MLResults() {
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

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!data) return null;

  const ml = data.executions?.ml_engineer || {};
  const models: any[] = ml.models_evaluated || [];
  const feat = ml.feature_importance || {};
  const best = ml.best_model || "N/A";
  const r2 = ml.best_r2 != null ? ml.best_r2 : null;

  const featChart = Object.entries(feat).map(([name, value]) => ({ name, value: typeof value === "number" ? value : 0 })).sort((a, b) => b.value - a.value).slice(0, 10);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6"><BrainCircuit className="w-6 h-6 text-purple-400" /> ML Results</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Best Model</p>
          <div className="flex items-center gap-2 mt-1"><Trophy className="w-5 h-5 text-amber-400" /><span className="text-xl font-bold">{best}</span></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">R² Score</p>
          <div className="flex items-center gap-2 mt-1"><TrendingUp className="w-5 h-5 text-emerald-400" /><span className="text-xl font-bold">{r2 != null ? r2.toFixed(4) : "N/A"}</span></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Models Evaluated</p>
          <p className="text-xl font-bold mt-1">{models.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Feature Importance</h3>
          {featChart.length === 0 ? <p className="text-slate-500 text-sm">No feature importance data.</p> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: "#94a3b8" }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Model Comparison</h3>
          {models.length === 0 ? <p className="text-slate-500 text-sm">No models evaluated.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-left py-2">Model</th><th className="text-left py-2">R²</th><th className="text-left py-2">RMSE</th></tr></thead>
                <tbody>
                  {models.map((m: any, i: number) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="py-2 text-slate-300">{m.name || m.model || `Model ${i + 1}`}</td>
                      <td className="py-2 font-mono">{m.r2 != null ? m.r2.toFixed(4) : "N/A"}</td>
                      <td className="py-2 font-mono">{m.rmse != null ? m.rmse.toFixed(4) : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
