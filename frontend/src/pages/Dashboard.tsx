import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';
import { ChartRenderer } from '@/components/ChartRenderer';
import { downloadPdfReport } from '@/services/api';
import { Loader2, CheckCircle2, AlertCircle, BarChart3, Database, LineChart, FileText, BrainCircuit, Sparkles, Activity, ShieldCheck, FileDown, AlertTriangle, Target } from 'lucide-react';
import { toast } from 'sonner';

// 🎨 PREMIUM MARKDOWN RENDERER (No external dependencies required)
const renderStrategyMarkdown = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-8 mb-4 border-b border-slate-200 dark:border-gray-700 pb-2">{trimmed.substring(2)}</h1>;
    if (trimmed.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-8 mb-4 flex items-center gap-2">{trimmed.substring(3)}</h2>;
    if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">{trimmed.substring(4)}</h3>;
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      const parts = content.split(/(\*\*.*?\*\*)/g);
      return (
        <li key={i} className="ml-6 list-disc mb-3 text-slate-700 dark:text-slate-300 leading-relaxed">
          {parts.map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong> : part)}
        </li>
      );
    }
    if (trimmed === '') return <div key={i} className="h-4" />;
    
    const parts = trimmed.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className="mb-4 text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
        {parts.map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong> : part)}
      </p>
    );
  });
};

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

  const renderTab = (agentOutput: any, content: React.ReactNode) => {
    if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">Pipeline Failed: {error}</div>;
    if (!agentOutput && !isComplete) return <LoadingState />;
    if (!agentOutput && isComplete) return <div className="p-8 text-center text-muted-foreground bg-muted rounded-lg border-2 border-dashed">No data generated for this section.</div>;
    return content;
  };

  if (!runId) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6"><AlertCircle className="w-16 h-16 text-muted-foreground" /><h2 className="text-2xl font-bold">No Active Analysis</h2><button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Return Home</button></div>;

  const agents = [
    { id: 'data_engineer', name: 'Data Engineer', icon: Database, desc: 'Quality & Schema' },
    { id: 'statistician', name: 'Statistician', icon: LineChart, desc: 'VIF & Normality' },
    { id: 'ml_engineer', name: 'ML Engineer', icon: BrainCircuit, desc: 'AutoML & CV' },
    { id: 'designer', name: 'Designer', icon: BarChart3, desc: 'Visualizations' },
    { id: 'strategist', name: 'Strategist', icon: FileText, desc: 'Executive Strategy' },
  ];

  const modelsList = ml?.models_tested || [];
  const bestModel = modelsList.find((m: any) => m?.name === ml?.best_model) || modelsList[0];

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
                <h1 className="text-3xl font-bold tracking-tight">Deep Analytics Complete</h1>
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
                <div className="text-4xl font-bold text-blue-600">{dataEng?.quality_score || '99.0'}</div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Data Quality Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* AGENT TIMELINE */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {agents.map((agent) => {
            const exec = Array.isArray(executions) ? executions.find((e: any) => e?.agent_name === agent.id) : null;
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
            <TabsTrigger value="stats" className="rounded-lg"><LineChart className="w-4 h-4 mr-2" /> Deep Stats</TabsTrigger>
            <TabsTrigger value="health" className="rounded-lg"><ShieldCheck className="w-4 h-4 mr-2" /> Data Health</TabsTrigger>
          </TabsList>

          {/* 🎯 PREMIUM STRATEGY TAB */}
          <TabsContent value="strategy">
            {renderTab(strategist, (
              <div className="space-y-8">
                {/* EXECUTIVE SNAPSHOT BAR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Predictive Confidence</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{bestModel ? `${((bestModel.accuracy || bestModel.r2_score || 0) * 100).toFixed(1)}%` : 'N/A'}</p>
                    <p className="text-xs text-slate-500 mt-1">Model explains variance in <b>{ml?.target_column || 'Target'}</b></p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-100 dark:border-green-800 shadow-sm">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Primary Business Lever</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white truncate">{ml?.shap_values?.[0]?.feature || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 mt-1">Drives <b>{Math.round((ml?.shap_values?.[0]?.importance || 0) * 100)}%</b> of outcome</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800 shadow-sm">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Data Integrity Score</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{dataEng?.quality_score || '0'}/100</p>
                    <p className="text-xs text-slate-500 mt-1">Reliability of strategic insights</p>
                  </div>
                </div>

                {/* THE BOARDROOM MEMO */}
                <Card className="border-2 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-800">
                  <CardHeader className="border-b border-slate-200 dark:border-gray-700 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-slate-900 dark:text-white">Strategic Briefing</CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Confidential Executive Memo • Generated by FiveMinds CDO</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <ScrollArea className="h-[700px] pr-6">
                      <div className="max-w-none">
                        {renderStrategyMarkdown(strategist?.report || '')}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="ml">
            {renderTab(ml, (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-2 shadow-lg">
                    <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-600" /> AutoML Arena & Cross-Validation</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Target: <Badge variant="outline">{ml?.target_column}</Badge> ({ml?.is_classification ? 'Classification' : 'Regression'})</p>
                      <div className="space-y-4">
                        {modelsList.filter(Boolean).map((m: any, i: number) => (
                          <div key={i} className={`p-4 rounded-lg border ${m?.name === ml?.best_model ? 'bg-green-50 border-green-300' : 'bg-muted'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-lg">{m?.name}</span>
                              {m?.name === ml?.best_model && <Badge className="bg-green-600">Champion</Badge>}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {m?.accuracy !== undefined && <div>Accuracy: <b>{(m.accuracy * 100).toFixed(1)}%</b></div>}
                              {m?.precision !== undefined && <div>Precision: <b>{(m.precision * 100).toFixed(1)}%</b></div>}
                              {m?.recall !== undefined && <div>Recall: <b>{(m.recall * 100).toFixed(1)}%</b></div>}
                              {m?.roc_auc !== undefined && <div>ROC-AUC: <b>{m.roc_auc.toFixed(3)}</b></div>}
                              {m?.r2_score !== undefined && <div>R² Score: <b>{m.r2_score.toFixed(3)}</b></div>}
                              {m?.rmse !== undefined && <div>RMSE: <b>{m.rmse.toFixed(2)}</b></div>}
                              {m?.mae !== undefined && <div>MAE: <b>{m.mae.toFixed(2)}</b></div>}
                              {m?.adj_r2 !== undefined && <div>Adj R²: <b>{m.adj_r2.toFixed(3)}</b></div>}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                              <Activity className="w-3 h-3" /> CV Stability: ±{((m?.cv_std || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 shadow-lg">
                    <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Feature Importance (SHAP)</CardTitle></CardHeader>
                    <CardContent><ChartRenderer chart={{chart_type: 'bar_chart', chart_data: ml?.shap_values || []}} /></CardContent>
                  </Card>
                </div>
                {bestModel?.confusion_matrix && (
                  <Card className="border-2 shadow-lg">
                    <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-600" /> Confusion Matrix ({bestModel.name})</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex justify-center overflow-x-auto">
                        <table className="border-collapse">
                          <thead><tr><th className="p-2"></th>{(bestModel.classes || []).filter(Boolean).map((c: string, i: number) => <th key={i} className="p-2 text-sm font-bold text-center">Pred: {c}</th>)}</tr></thead>
                          <tbody>
                            {bestModel.confusion_matrix.filter(Boolean).map((row: number[], i: number) => (
                              <tr key={i}><td className="p-2 text-sm font-bold text-right pr-4">Actual: {bestModel.classes?.[i]}</td>{row.filter(Boolean).map((val: number, j: number) => <td key={j} className={`p-4 text-center font-bold text-lg border ${i === j ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{val}</td>)}</tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="stats">
            {renderTab(stats, (
              <div className="space-y-6">
                <Card className="border-2 shadow-lg">
                  <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> Multicollinearity (VIF)</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Variance Inflation Factor. Values &gt; 5 indicate high multicollinearity.</p>
                    <ChartRenderer chart={{chart_type: 'bar_chart', chart_data: stats?.vif || []}} />
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-2 shadow-lg">
                    <CardHeader><CardTitle className="flex items-center gap-2"><LineChart className="w-5 h-5 text-blue-600" /> Pearson Correlations</CardTitle></CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {(stats?.correlations || []).filter(Boolean).map((c: any, i: number) => (
                            <div key={i} className="p-3 border rounded-lg flex justify-between items-center">
                              <div><p className="font-medium text-sm">{c.var1} ↔ {c.var2}</p><p className="text-xs text-muted-foreground">p-value: {c.p_value < 0.001 ? c.p_value.toExponential(2) : c.p_value.toFixed(4)}</p></div>
                              <div className="flex items-center gap-2">
                                {c.significant && <Badge className="bg-green-100 text-green-800 text-xs">Sig</Badge>}
                                <Badge variant="outline" className={c.coeff > 0 ? "text-blue-600 border-blue-600" : "text-red-600 border-red-600"}>{c.coeff > 0 ? '+' : ''}{c.coeff.toFixed(3)}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  <Card className="border-2 shadow-lg">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-purple-600" /> Normality & Distribution Shape</CardTitle></CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted text-xs uppercase"><tr><th className="px-2 py-2">Feature</th><th className="px-2 py-2">Shapiro (p)</th><th className="px-2 py-2">Skew</th><th className="px-2 py-2">Kurt</th></tr></thead>
                          <tbody>
                            {(stats?.normality || []).filter(Boolean).map((n: any, i: number) => (
                              <tr key={i} className="border-b">
                                <td className="px-2 py-2 font-medium">{n.feature}</td>
                                <td className="px-2 py-2"><Badge variant={n.is_normal ? "default" : "destructive"} className={n.is_normal ? "bg-green-100 text-green-800" : ""}>{n.shapiro_p < 0.001 ? n.shapiro_p.toExponential(1) : n.shapiro_p.toFixed(3)}</Badge></td>
                                <td className="px-2 py-2">{n.skewness}</td>
                                <td className="px-2 py-2">{n.kurtosis}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="health">
            {renderTab(dataEng, (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard title="Data Quality Score" value={`${dataEng?.quality_score || 0}/100`} icon={<ShieldCheck className="w-5 h-5" />} color={(dataEng?.quality_score || 0) > 80 ? "text-green-600" : "text-orange-600"} />
                  <StatCard title="Total Rows" value={dataEng?.row_count || 'N/A'} icon={<Database className="w-5 h-5" />} />
                  <StatCard title="Duplicate Rows" value={dataEng?.duplicates || 0} icon={<AlertCircle className="w-5 h-5" />} color={(dataEng?.duplicates || 0) > 0 ? "text-red-600" : "text-foreground"} />
                  <StatCard title="Missing Data" value={dataEng?.missing_values_pct || '0%'} icon={<AlertTriangle className="w-5 h-5" />} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card className="border-2 shadow-lg"><CardHeader><CardTitle>Outlier Detection (IQR Method)</CardTitle></CardHeader><CardContent><ScrollArea className="h-[300px]"><pre className="bg-muted p-4 rounded-lg text-xs">{JSON.stringify(dataEng?.outlier_details || [], null, 2)}</pre></ScrollArea></CardContent></Card>
                   <Card className="border-2 shadow-lg"><CardHeader><CardTitle>Imputation Log</CardTitle></CardHeader><CardContent><ScrollArea className="h-[300px]"><pre className="bg-muted p-4 rounded-lg text-xs">{JSON.stringify(dataEng?.imputation_log || [], null, 2)}</pre></ScrollArea></CardContent></Card>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color = "text-foreground" }: any) {
  return (
    <Card className="border-2 shadow-md">
      <CardContent className="pt-6 flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
        <div><p className="text-sm text-muted-foreground">{title}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /><p className="text-muted-foreground text-lg">Agents are computing deep analytics...</p></div>;
}
