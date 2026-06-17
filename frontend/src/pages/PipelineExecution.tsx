import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPipelineStatus } from "../services/api";
import { Loader2, CheckCircle2, XCircle, Clock, ArrowRight, Database, BarChart3, BrainCircuit, Lightbulb, FileText, Zap } from "lucide-react";

const AGENT_META: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  data_engineer:  { icon: Database,      label: "Data Engineer", color: "text-blue-400",   bg: "bg-blue-500/10" },
  statistician:   { icon: BarChart3,     label: "Statistician",  color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ml_engineer:    { icon: BrainCircuit,  label: "ML Engineer",   color: "text-purple-400",  bg: "bg-purple-500/10" },
  strategist:     { icon: Lightbulb,     label: "Strategist",    color: "text-amber-400",   bg: "bg-amber-500/10" },
  designer:       { icon: FileText,      label: "Designer",      color: "text-rose-400",    bg: "bg-rose-500/10" },
};
const AGENT_ORDER = ["data_engineer", "statistician", "ml_engineer", "strategist", "designer"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed:    "bg-red-500/10 text-red-400 border-red-500/20",
    running:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pending:   "bg-slate-700 text-slate-400 border-slate-600",
    queued:    "bg-slate-700 text-slate-400 border-slate-600",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] || map.pending}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default function PipelineExecution() {
  const { run_id } = useParams<{ run_id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!run_id) return;
    let timerId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const status = await getPipelineStatus(run_id);
        if (!mountedRef.current) return;
        setData(status);

        if (status.run.status === "completed") {
          setRedirecting(true);
          timerId = setTimeout(() => {
            navigate(`/dashboard/${run_id}`);
          }, 1500);
          return;
        }

        if (status.run.status === "failed") return;

        timerId = setTimeout(poll, 2000);
      } catch (err: any) {
        if (!mountedRef.current) return;
        setError(err.message || "Failed to fetch status");
      }
    };

    poll();
    return () => clearTimeout(timerId);
  }, [run_id, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pipeline Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-5 py-2.5 rounded-xl transition-colors">
            ← Start Over
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Connecting to pipeline...</p>
        </div>
      </div>
    );
  }

  const { run, executions, progress_percent } = data;
  const executionMap = Object.fromEntries((executions as any[]).map((e: any) => [e.agent_name, e]));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Running Analysis</h1>
            <p className="text-slate-400 text-sm truncate max-w-sm" title={run.business_question}>{run.business_question}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-300 font-medium">{redirecting ? "Completed! Redirecting..." : `Processing ${run.dataset_name}`}</span>
            <span className="font-mono text-blue-400 font-semibold">{Math.round(progress_percent)}%</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress_percent}%` }} />
          </div>
          {!redirecting && <p className="text-xs text-slate-600 mt-2">Polls every 2s</p>}
        </div>

        <div className="space-y-3">
          {AGENT_ORDER.map((agentKey) => {
            const exec = executionMap[agentKey];
            const meta = AGENT_META[agentKey];
            const Icon = meta.icon;
            const status = exec?.status || "pending";
            const isRunning = status === "running";
            const isDone = status === "completed";
            const isFailed = status === "failed";

            return (
              <div key={agentKey} className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-4 transition-all ${isRunning ? "border-blue-500/40 shadow-md shadow-blue-500/10" : isDone ? "border-emerald-500/20" : "border-slate-800"}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-100 text-sm">{meta.label}</span>
                    <div className="flex items-center gap-2">
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {isFailed && <XCircle className="w-4 h-4 text-red-500" />}
                      {isRunning && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                      {!isDone && !isFailed && !isRunning && <Clock className="w-4 h-4 text-slate-600" />}
                      <StatusBadge status={status} />
                    </div>
                  </div>
                  {typeof exec?.quality_score === "number" && (
                    <p className="text-xs text-slate-500 mt-0.5">Quality: <span className="text-slate-300">{exec.quality_score}%</span>{typeof exec.execution_time_ms === "number" ? ` · ${exec.execution_time_ms}ms` : ""}</p>
                  )}
                  {typeof exec?.error_message === "string" && exec.error_message && (
                    <p className="text-xs text-red-400 mt-0.5 truncate">{exec.error_message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {run.status === "completed" && (
          <div className="mt-8 flex justify-center">
            <button onClick={() => navigate(`/dashboard/${run_id}`)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20">
              View Results <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {run.status === "failed" && (
          <div className="mt-8 text-center">
            <p className="text-red-400 mb-4">Pipeline failed. Please check your data and try again.</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-5 py-2.5 rounded-xl transition-colors">← Try Again</Link>
          </div>
        )}
      </div>
    </div>
  );
}
