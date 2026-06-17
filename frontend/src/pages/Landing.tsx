import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, BrainCircuit, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { uploadDataset, startPipeline } from "../services/api";

export default function Landing() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) { setError("Please upload a CSV file"); return; }
    if (!question.trim() || question.length < 10) { setError("Business question must be at least 10 characters"); return; }
    setLoading(true); setError("");
    try {
      const dataset = await uploadDataset(file);
      const run = await startPipeline(dataset.id, question.trim());
      navigate(`/pipeline/${run.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">FiveMinds</h1>
          <p className="text-slate-400 mt-2 text-lg">Upload your data. Ask a business question. Let AI agents analyze everything.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 hover:border-slate-500"}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <p className="text-slate-300 font-medium">Drop your CSV here or click to browse</p>
                <p className="text-slate-500 text-sm mt-1">Supports .csv, .xlsx (max 50MB)</p>
              </>
            )}
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">What do you want to know?</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What factors drive customer churn in Q3, and how can we reduce it by 15%?"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-28" />
            <p className="text-xs text-slate-500 mt-1">{question.length} chars (min 10)</p>
          </div>
          {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting Analysis...</> : <><>Run Analysis</><ArrowRight className="w-5 h-5" /></>}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[{l:"Data Engineering",d:"Clean & schema inference"},{l:"Statistics",d:"Correlations & tests"},{l:"ML + Strategy",d:"Models & recommendations"}].map((f) => (
            <div key={f.l} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-slate-200">{f.l}</p>
              <p className="text-xs text-slate-500 mt-1">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
