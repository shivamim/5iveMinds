// src/pages/Report.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPipelineResults, exportReport } from "../services/api";
import { FileText, Download } from "lucide-react";

export default function Report() {
  const { run_id } = useParams<{ run_id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!run_id) return;
    getPipelineResults(run_id)
      .then((res) => { setData(res); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [run_id]);

  const handleExport = async (format: "pdf" | "excel" | "pptx" | "html") => {
    if (!run_id) return;
    setExporting(format);
    try {
      const blob = await exportReport(run_id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${run_id}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!data) return null;

  const report = data.reports?.[0];
  const content = report?.content || "No report generated yet.";
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  const rendered = lines.map((line: string, i: number) => {
    if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.replace("# ", "")}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold mt-5 mb-2 text-indigo-300">{line.replace("## ", "")}</h2>;
    if (line.startsWith("- ")) return <li key={i} className="ml-4 text-slate-300">{line.replace("- ", "")}</li>;
    if (line.trim() === "") return <div key={i} className="h-2" />;
    // Handle inline bold
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className="text-slate-300">
        {parts.map((part, idx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <span key={idx} className="font-semibold text-slate-200">{part.slice(2, -2)}</span>;
          }
          return <span key={idx}>{part}</span>;
        })}
      </p>
    );
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-rose-400" /> Executive Report</h1>
        <div className="flex gap-2">
          {(["pdf", "excel", "pptx", "html"] as const).map((fmt) => (
            <button key={fmt} onClick={() => handleExport(fmt)} disabled={exporting === fmt}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 disabled:opacity-50 flex items-center gap-1">
              <Download className="w-3 h-3" /> {exporting === fmt ? "..." : fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        {rendered}
      </div>
    </div>
  );
}
