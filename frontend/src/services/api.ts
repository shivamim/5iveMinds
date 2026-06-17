// src/services/api.ts
const API_BASE = (() => {
  const saved = typeof window !== "undefined" ? localStorage.getItem("api_url") : null;
  return saved || (import.meta.env.VITE_API_URL as string) || "http://localhost:8000/api/v1";
})();

export async function uploadDataset(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/datasets/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json() as Promise<{
    id: string; filename: string; row_count: number; column_count: number;
    file_size_bytes: number; dataset_schema: Record<string, any>; uploaded_at: string;
  }>;
}

export async function startPipeline(datasetId: string, businessQuestion: string) {
  const res = await fetch(`${API_BASE}/pipeline/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id: datasetId, business_question: businessQuestion, hitl_agents: [], custom_config: {} }),
  });
  if (!res.ok) throw new Error(`Pipeline start failed: ${res.status}`);
  return res.json() as Promise<{
    id: string; status: string; dataset_id: string; dataset_name: string;
    business_question: string; started_at: string | null;
  }>;
}

export async function getPipelineStatus(runId: string) {
  const res = await fetch(`${API_BASE}/pipeline/${runId}/status`);
  if (!res.ok) throw new Error(`Status failed: ${res.status}`);
  return res.json() as Promise<{
    run: { id: string; status: string; dataset_name: string; business_question: string; quality_score_avg: number | null; total_time_ms: number | null; };
    executions: Array<{ id: string; agent_name: string; status: string; quality_score: number | null; execution_time_ms: number | null; output_data: any; error_message: string | null; started_at: string | null; completed_at: string | null; }>;
    progress_percent: number;
  }>;
}

export async function getPipelineResults(runId: string) {
  const res = await fetch(`${API_BASE}/pipeline/${runId}/results`);
  if (!res.ok) throw new Error(`Results failed: ${res.status}`);
  return res.json() as Promise<{
    run: { id: string; status: string; dataset_name: string; business_question: string; quality_score_avg: number | null; total_time_ms: number | null; };
    executions: Record<string, any>;
    charts: Array<{ id: string; agent_name: string; chart_type: string; chart_data: any; plotly_spec: any }>;
    reports: Array<{ id: string; report_type: string; content: string; generated_at: string }>;
  }>;
}

export async function getPipelineHistory() {
  const res = await fetch(`${API_BASE}/pipeline/history?limit=50&offset=0`);
  if (!res.ok) throw new Error(`History failed: ${res.status}`);
  return res.json() as Promise<Array<{
    id: string; status: string; dataset_name: string; business_question: string;
    started_at: string | null; completed_at: string | null; total_time_ms: number | null; quality_score_avg: number | null;
  }>>;
}

export async function deletePipelineRun(runId: string) {
  const res = await fetch(`${API_BASE}/pipeline/${runId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
}

export async function exportReport(runId: string, format: "pdf" | "excel" | "pptx" | "html") {
  const res = await fetch(`${API_BASE}/reports/${runId}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, sections: ["all"] }),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.blob();
}
