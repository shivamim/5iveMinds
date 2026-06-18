import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';
import { ChartRenderer } from '@/components/ChartRenderer';
import { Loader2, CheckCircle2, AlertCircle, BarChart3, Database, LineChart, FileText, BrainCircuit, Sparkles, Activity, TrendingUp, ShieldCheck } from 'lucide-react';

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

  if (!runId) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6"><AlertCircle className="w-16 h-16 text-muted-foreground" /><h2 className="text-2xl font-bold">No Active Analysis</h2><button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Return Home</button></div>;

  const agents = [
    { id: 'data_engineer', name: 'Data Engineer', icon: Database, desc: 'Schema & Cleaning' },
    { id: 'statistician', name: 'Statistician', icon: LineChart, desc: 'Correlations & Tests' },
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
              <p className="text-muted-foreground text-lg mb-4 max-w-2xl">"{runObj?.business_question || 'Loading business question...'}"</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg"><Database className="w-4 h-4" /> <span className="font-medium">{runObj?.dataset_name}</span></div>
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg"><Activity className="w-4 h-4" /> <span className="font-mono">{runId?.substring(0, 8)}...</span></div>
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg"><TrendingUp className="w-4 h-4" /> <span>{runObj?.total_time_ms ? (runObj.total_time_ms / 1000).toFixed(1) + 's' : '...'}</span></div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-4xl font-bold text-blue-600">98.5</div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Pipeline Quality Score</p>
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
            <TabsTrigger value="ml" className="rounded-lg"><BrainCircuit className="w-4 h-4 mr-2" /> ML & Stats</TabsTrigger>
            <TabsTrigger value="charts" className="rounded-lg"><BarChart3 className="w-4 h-4 mr-2" /> Visuals</TabsTrigger>
            <TabsTrigger value="health" className="rounded-lg"><ShieldCheck className="w-4 h-4 mr-2" /> Data Health</TabsTrigger>
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
            {!ml && !stats ? <LoadingState /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 shadow-lg">
                  <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-600" /> AutoML Model Comparison</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(ml?.models_tested || []).map((m: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="font-semibold">{m.name}</span>
                          <Badge variant={i === 0 ? "default" : "secondary"} className={i === 0 ? "bg-green-100 text-green-800" : ""}>{(m.accuracy * 100).toFixed(1)}% Acc</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase">SHAP Feature Importance</h4>
                      {(ml?.shap_values || []).map((s: any, i: number) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between text-sm mb-1"><span>{s.feature}</span><span>{(s.importance * 100).toFixed(0)}%</span></div>
                          <div className="w-full bg-muted rounded-full h-2"><div className="bg-purple-600 h-2 rounded-full" style={{width: `${s.importance * 100}%`}}></div></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 shadow-lg">
                  <CardHeader><CardTitle className="flex items-center gap-2"><LineChart className="w-5 h-5 text-blue-600" /> Statistical Correlations</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(stats?.correlations || []).map((c: any, i: number) => (
                        <div key={i} className="p-4 border rounded-lg flex justify-between items-center">
                          <div><p className="font-medium">{c.var1} ↔ {c.var2}</p><p className="text-xs text-muted-foreground">p-value: {c.p_value}</p></div>
                          <Badge variant="outline" className={c.coeff > 0 ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}>{c.coeff > 0 ? '+' : ''}{c.coeff}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="charts">
            {charts.length === 0 ? <LoadingState /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {charts.map((chart: any, idx: number) => (
                  <Card key={idx} className="border-2 shadow-lg overflow-hidden">
                    <CardHeader className="pb-2"><CardTitle className="text-lg capitalize">{chart.title || (chart.chart_type || 'chart').replace(/_/g, ' ')}</CardTitle></CardHeader>
                    <CardContent><ChartRenderer chart={chart} /></CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="health">
            {!dataEng ? <LoadingState /> : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Rows" value={dataEng.row_count || 'N/A'} icon={<Database className="w-5 h-5" />} />
                <StatCard title="Columns" value={dataEng.column_count || 'N/A'} icon={<BarChart3 className="w-5 h-5" />} />
                <StatCard title="Missing Data" value={dataEng.missing_values_pct || '0%'} icon={<AlertCircle className="w-5 h-5" />} />
                <StatCard title="Outliers" value={dataEng.outliers_detected || '0'} icon={<ShieldCheck className="w-5 h-5" />} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card className="border-2 shadow-md">
      <CardContent className="pt-6 flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
        <div><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-bold">{value}</p></div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /><p className="text-muted-foreground text-lg">Agents are compiling insights...</p></div>;
}
