import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPipelineResults } from "../services/api";
import { Lightbulb, Target, ShieldAlert, ListChecks } from "lucide-react";

export default function Strategy() {
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

  const st = data.executions?.strategist || {};
  const insights: any[] = st.business_insights || [];
  const actions: any[] = st.recommended_actions || [];
  const roi = st.roi_projections || {};
  const risks: any[] = st.risk_matrix || [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6"><Lightbulb className="w-6 h-6 text-amber-400" /> Strategy</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {["conservative", "moderate", "optimistic"].map((k) => (
          <div key={k} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-sm text-slate-500 capitalize">{k} ROI</p>
            <p className="text-2xl font-bold mt-1">{roi[k] != null ? `${roi[k]}%` : "N/A"}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Business Insights</h3>
          {insights.length === 0 ? <p className="text-slate-500 text-sm">No insights.</p> : (
            <ul className="space-y-3">
              {insights.map((ins: any, i: number) => (
                <li key={i} className="text-sm text-slate-300 border-l-2 border-amber-500 pl-3">
                  {typeof ins === "string" ? ins : ins.title || ins.description || JSON.stringify(ins)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-400" /> Risk Matrix</h3>
          {risks.length === 0 ? <p className="text-slate-500 text-sm">No risks recorded.</p> : (
            <div className="space-y-2">
              {risks.map((r: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-slate-800/50 py-2">
                  <span className="text-slate-300">{r.risk || r.name || `Risk ${i + 1}`}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${r.impact === "high" || r.likelihood === "high" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {r.likelihood || "?"} / {r.impact || "?"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4" /> Recommended Actions</h3>
        {actions.length === 0 ? <p className="text-slate-500 text-sm">No actions recommended.</p> : (
          <div className="space-y-3">
            {actions.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 w-2 h-2 rounded-full ${(a.priority || "").toLowerCase() === "high" ? "bg-red-500" : "bg-amber-500"}`} />
                <div>
                  <p className="text-slate-200 font-medium">{a.recommendation || a.action || a.title || `Action ${i + 1}`}</p>
                  <p className="text-slate-500 text-xs">{a.timeline || a.description || ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
