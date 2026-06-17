import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPipelineResults } from "../services/api";
import { BarChart3, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Statistics() {
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

  const stats = data.executions?.statistician || {};
  const correlations: any[] = stats.correlations || [];
  const insights: any[] = stats.insights || [];
  const tests: any[] = stats.hypothesis_tests || [];

  const corrChart = correlations.slice(0, 10).map((c: any, i: number) => ({
    name: c.column1 && c.column2 ? `${c.column1}-${c.column2}` : `Pair-${i}`,
    value: typeof c.correlation === "number" ? Math.abs(c.correlation) : 0,
    raw: typeof c.correlation === "number" ? c.correlation : 0,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6"><BarChart3 className="w-6 h-6 text-emerald-400" /> Statistics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Top Correlations (Absolute)</h3>
          {corrChart.length === 0 ? <p className="text-slate-500 text-sm">No correlation data.</p> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={corrChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#94a3b8" }} domain={[0, 1]} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Bar dataKey="value">
                    {corrChart.map((_, i) => <Cell key={i} fill={corrChart[i].raw > 0 ? "#10b981" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Correlation Matrix</h3>
          {correlations.length === 0 ? <p className="text-slate-500 text-sm">No data.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-left py-2">Col A</th><th className="text-left py-2">Col B</th><th className="text-left py-2">r</th></tr></thead>
                <tbody>
                  {correlations.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="py-2 text-slate-300">{c.column1 || "?"}</td>
                      <td className="py-2 text-slate-300">{c.column2 || "?"}</td>
                      <td className="py-2 font-mono">{typeof c.correlation === "number" ? c.correlation.toFixed(3) : "?"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Insights</h3>
          {insights.length === 0 ? <p className="text-slate-500 text-sm">No insights generated.</p> : (
            <ul className="space-y-2">
              {insights.map((ins: any, i: number) => (
                <li key={i} className="text-sm text-slate-300 border-l-2 border-emerald-500 pl-3">
                  {typeof ins === "string" ? ins : ins.description || JSON.stringify(ins)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Hypothesis Tests</h3>
          {tests.length === 0 ? <p className="text-slate-500 text-sm">No tests recorded.</p> : (
            <div className="space-y-2">
              {tests.map((t: any, i: number) => (
                <div key={i} className="text-sm border-b border-slate-800/50 py-2">
                  <p className="text-slate-300 font-medium">{t.test_name || t.name || `Test ${i + 1}`}</p>
                  <p className="text-slate-500">p-value: {t.p_value != null ? t.p_value.toFixed(4) : "N/A"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
