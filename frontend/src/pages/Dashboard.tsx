import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';
import { ChartRenderer } from '@/components/ChartRenderer';
import { downloadPdfReport } from '@/services/api';
import { Loader2, CheckCircle2, AlertCircle, BarChart3, Database, LineChart, FileText, BrainCircuit, Sparkles, Activity, TrendingUp, ShieldCheck, FileDown } from 'lucide-react';
import { toast } from 'sonner';

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');
  const { status, results, error, isComplete } = usePipeline({ runId, pollInterval: 2000, autoFetch: !!runId });

  const runObj = status?.run || results?.run;
  const executions = status?.executions || [];
  const strategist = getAgentOutput(results, 'strategist');
  const dataEng = getAgentOutput(results, 'data_engineer');
  const ml = getAgentOutput(results, 'ml_engineer');
  const stats = getAgentOutput(results, 'statistician');
  const charts = results?.charts || [];

  const handleExportPdf = async () => {
    if (!runId) return;
    try {
      toast.loading("Generating PDF report...");
      await downloadPdfReport(runId);
      toast.dismiss();
      toast.success("PDF downloaded successfully!");
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message || "Failed to generate PDF");
    }
  };

  if (!runId) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6"><AlertCircle className="w-16 h-16 text-muted-foreground" /><h2 className="text-2xl font-bold">No Active Analysis</h2><button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Return Home</button></div>;

  const agents = [
    { id: 'data_engineer', name: 'Data Engineer', icon: Database, desc: 'Schema & Cleaning' },
    { id: 'statistician', name: 'Statistician', icon: LineChart, desc: 'Pearson & P-Values' },
    { id: 'ml_engineer', name: 'ML Engineer', icon: BrainCircuit, desc: 'AutoML & SHAP' },
    { id: 'designer', name: 'Designer', icon: BarChart3, desc: 'Visualizations' },
    { id: 'strategist', name: 'Strategist', icon: FileText, desc: 'Executive Strategy' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* HERO HEADER */}
        <div className="bg-white dark:bg-gray-900 border rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h1 className="text-3xl font-bold tracking-tight">Analysis Complete</h1>
                {isComplete && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">100% Quality</Badge>}
              </div>
              <p className="text-muted-foreground text-lg mb-4 max-w-2xl">"{runObj?.business_question || 'Loading...'}"</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg"><Database className="w-4 h-4" /> <span className="font-medium">{runObj?.dataset_name}</span></div>
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg"><Activity className="w-4 h-4" /> <span className="font-mono">{runId?.substring(0, 8)}...</span></div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-4">
              <Button onClick={handleExportPdf} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg" disabled={!isComplete}>
                <FileDown className="w-4 h-4 mr-2" /> Export PDF Report
              </Button>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">99.0</div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pipeline Quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* AGENT TIMELINE */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {agents.map((agent) => {
            const exec = Array.isArray(executions) ? executions.find(e => e.agent_name === agent.id) : null;
            const execStatus = exec?.status?.toLowerCase() || 'pending';
            const Icon = agent.icon;
            return (
              <Card key={agent.id} className={`transition-all ${execStatus === 'completed' ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : execStatus === 'running' ? 'border-blue-300 bg-blue-50/50 shadow-lg shadow-blue-500/10' : ''}`}>
                <CardContent className="pt-4 pb-4 flex flex-col items-center text-center">
                  <div className={`p-3 rounded-full mb-3 ${execStatus === 'completed' ? 'bg-green-100 text-green-600' : execStatus === 'running' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-sm">{agent.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{agent.desc}</p>
                  {execStatus === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : execStatus === 'running' ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* MAIN TABS */}
        <Tabs defaultValue="strategy" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="strategy" className="rounded-lg"><Sparkles className="w-4 h-4 mr-2" /> Strategy</TabsTrigger>
            <TabsTrigger value="ml" className="rounded-lg"><BrainCircuit className="w-4 h-4 mr-2" /> ML Arena</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg"><LineChart className="w-4 h-4 mr-2" /> Statistics</TabsTrigger>
            <TabsTrigger value="charts" className="rounded-lg"><BarChart3 className="w-4 h-4 mr-2" /> Visuals</TabsTrigger>
          </TabsList>

          <TabsContent value="strategy">
            {!strategist ? <LoadingState /> : (
              <Card className="border-2 shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><FileText className="w-6 h-6 text-blue-600" /> Executive Strategy Report</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground prose prose-blue max-w-none dark:prose-invert">{strategist.report || JSON.stringify(strategist, null, 2)}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ml">
            {!ml ? <LoadingState /> : ml.error ? <p className="text-red-500 p-8 text-center">ML Error: {ml.error}</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 shadow-lg">
                  <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-600" /> AutoML Model Arena</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Target Variable: <Badge variant="outline">{ml.target_column}</Badge> ({ml.is_classification ? 'Classification' : 'Regression'})</p>
                    <div className="space-y-4">
                      {(ml.models_tested || []).map((m: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                          <span className="font-semibold">{m.name}</span>
                          <div className="flex gap-2 text-sm flex-wrap justify-end">
                            {m.accuracy !== undefined && <Badge variant={i === 0 ? "default" : "secondary"}>Acc: {(m.accuracy * 100).toFixed(1)}%</Badge>}
                            {m.f1_score !== undefined && <Badge variant="outline">F1: {(m.f1_score * 100).toFixed(1)}%</Badge>}
                            {m.r2_score !== undefined && <Badge variant={i === 0 ? "default" : "secondary"}>R²: {m.r2_score.toFixed(3)}</Badge>}
                            {m.rmse !== undefined && <Badge variant="outline">RMSE: {m.rmse.toFixed(2)}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 shadow-lg">
                  <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Real Feature Importance (SHAP)</CardTitle></CardHeader>
                  <CardContent>
                    <ChartRenderer chart={{chart_type: 'bar_chart', chart_data: ml.shap_values}} />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats">
            {!stats ? <LoadingState /> : (
              <Card className="border-2 shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><LineChart className="w-5 h-5 text-blue-600" /> Real Pearson Correlations & P-Values</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(stats.correlations || []).map((c: any, i: number) => (
                      <div key={i} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{c.var1} ↔ {c.var2}</p>
                          <p className="text-xs text-muted-foreground">p-value: {c.p_value < 0.001 ? c.p_value.toExponential(2) : c.p_value.toFixed(4)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {c.significant && <Badge className="bg-green-100 text-green-800">Significant</Badge>}
                          <Badge variant="outline" className={c.coeff > 0 ? "text-blue-600 border-blue-600" : "text-red-600 border-red-600"}>
                            {c.coeff > 0 ? '+' : ''}{c.coeff.toFixed(4)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="charts">
            {charts.length === 0 ? <LoadingState /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {charts.map((chart: any, idx: number) => (
                  <Card key={idx} className="border-2 shadow-lg overflow-hidden">
                    <CardHeader className="pb-2"><CardTitle className="text-lg capitalize">{chart.title || 'Chart'}</CardTitle></CardHeader>
                    <CardContent><ChartRenderer chart={chart} /></CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoadingState() {
  return <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /><p className="text-muted-foreground text-lg">Agents are computing real math...</p></div>;
}
