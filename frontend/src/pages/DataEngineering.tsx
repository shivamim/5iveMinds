// src/pages/DataEngineering.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPipelineResults } from "../services/api";
import { Database, Table, AlertTriangle, CheckCircle, Wrench } from "lucide-react";

export default function DataEngineering() {
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

  const de = data.executions?.data_engineer || {};
  const schemaInferred = de.schema_inferred === true;
  // The actual schema may live in de.schema, de.inferred_schema, or de.dataset_schema
  const rawSchema = de.schema || de.inferred_schema || de.dataset_schema || {};
  const hasSchema = typeof rawSchema === "object" && rawSchema !== null && !Array.isArray(rawSchema);
  const columns = hasSchema ? Object.entries(rawSchema) as [string, any][] : [];
  const quality = de.quality_checks || {};
  const outliers = de.outliers_detected ?? 0;
  const imputation = Array.isArray(de.imputation_log) ? de.imputation_log : [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6"><Database className="w-6 h-6 text-blue-400" /> Data Engineering</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Schema Inferred</p>
          <div className="flex items-center gap-2 mt-1">
            {schemaInferred ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
            <span className="text-xl font-bold">{schemaInferred ? "Yes" : "No"}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Columns Analyzed</p>
          <p className="text-xl font-bold mt-1">{typeof de.columns_analyzed === "number" ? de.columns_analyzed : "-"}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-500">Outliers Detected</p>
          <p className="text-xl font-bold mt-1">{typeof outliers === "number" ? outliers : JSON.stringify(outliers)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Table className="w-4 h-4" /> Inferred Schema</h3>
          {columns.length === 0 ? <p className="text-slate-500 text-sm">No schema data available.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-left py-2">Column</th><th className="text-left py-2">Type</th></tr></thead>
                <tbody>
                  {columns.map(([col, type]) => (
                    <tr key={col} className="border-b border-slate-800/50"><td className="py-2 text-slate-300">{col}</td><td className="py-2 text-slate-400">{typeof type === "string" ? type : JSON.stringify(type)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Quality Checks</h3>
          {Object.keys(quality).length === 0 ? <p className="text-slate-500 text-sm">No quality checks recorded.</p> : (
            <div className="space-y-2">
              {Object.entries(quality).map(([k, v]: [string, any]) => (
                <div key={k} className="flex justify-between text-sm border-b border-slate-800/50 py-2">
                  <span className="text-slate-300 capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="text-slate-400">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Wrench className="w-4 h-4" /> Imputation Log</h3>
        {imputation.length === 0 ? <p className="text-slate-500 text-sm">No imputation performed.</p> : (
          <ul className="text-sm space-y-1">
            {imputation.map((entry: any, i: number) => (
              <li key={i} className="text-slate-400">• {typeof entry === "string" ? entry : JSON.stringify(entry)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
