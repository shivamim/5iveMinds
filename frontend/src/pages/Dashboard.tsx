import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';
import { ChartRenderer } from '@/components/ChartRenderer';
import { Loader2, CheckCircle2, AlertCircle, BarChart3, Database, LineChart, FileText, BrainCircuit, Sparkles } from 'lucide-react';

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');

  const { status, results, error, isComplete } = usePipeline({ 
    runId, 
    pollInterval: 3000, 
    autoFetch: !!runId 
  });

  const strategistOutput = getAgentOutput(results, 'strategist');
  const dataEngineerOutput = getAgentOutput(results, 'data_engineer');
  const mlOutput = getAgentOutput(results, 'ml_engineer');
  const charts = results?.charts || [];

  const agents = [
    { id: 'data_engineer', name: 'Data Engineer', icon: Database, desc: 'Cleaning & prep' },
    { id: 'statistician', name: 'Statistician', icon: LineChart, desc: 'Statistical analysis' },
    { id: 'ml_engineer', name: 'ML Engineer', icon: BrainCircuit, desc: 'Predictive modeling' },
    { id: 'designer', name: 'Designer', icon: BarChart3, desc: 'Data visualization' },
    { id: 'strategist', name: 'Strategist', icon: FileText, desc: 'Executive insights' },
  ];

  if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">No Active Analysis</h2>
        <button 
          onClick={() => navigate('/')} 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">FiveMinds Core</h1>
          <p className="text-muted-foreground mt-1">
            Run ID: <span className="font-mono text-blue-600">{runId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isComplete && !error ? (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Data
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full">
              <AlertCircle className="w-4 h-4" /> Pipeline Failed
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4" /> Analysis Complete
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {agents.map((agent) => {
          // ✅ FIXED: Backend wraps status inside { run: {...}, executions: [...] }
          const runObj = status?.run || status;
          const executions = runObj?.executions || status?.executions || [];
          const execStatus = Array.isArray(executions) 
            ? executions.find((e: any) => e.agent_name === agent.id)?.status || 'pending'
            : (executions[agent.id]?.status || 'pending');
          
          const Icon = agent.icon;
          return (
            <Card 
              key={agent.id} 
              className={
                execStatus === 'completed' ? 'border-green-200 bg-green-50/50' : 
                execStatus === 'running' ? 'border-blue-200 bg-blue-50/50' : ''
              }
            >
              <CardContent className="pt-4 pb-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-full mb-2 ${
                  execStatus === 'completed' ? 'bg-green-100 text-green-600' : 
                  execStatus === 'running' ? 'bg-blue-100 text-blue-600' : 
                  'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="font-semibold text-sm">{agent.name}</p>
                <p className="text-xs text-muted-foreground">{agent.desc}</p>
                <div className="mt-2">
                  {execStatus === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                  ) : execStatus === 'running' ? (
                    <Loader2 className="w-4 h-4 text-blue-600 mx-auto animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 mx-auto" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="diagnostics">Data Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-0">
          {!strategistOutput ? (
            <LoadingView message="Strategist is synthesizing insights..." isComplete={isComplete} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" /> Final Strategy Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {strategistOutput.report || strategistOutput.summary || JSON.stringify(strategistOutput, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visualizations" className="mt-0">
          {charts.length === 0 ? (
            <LoadingView message="Designer is generating charts..." isComplete={isComplete} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {charts.map((chart: any, idx: number) => (
                <Card key={idx} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      {/* ✅ FIXED: Safe fallback if chart_type is undefined */}
                      {(chart.chart_type || 'chart').replace(/_/g, ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartRenderer chart={chart} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="diagnostics" className="mt-0">
          {!dataEngineerOutput && !mlOutput ? (
            <LoadingView message="Agents are processing data..." isComplete={isComplete} />
          ) : (
            <div className="space-y-6">
              {dataEngineerOutput && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" /> Data Engineering Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <MetricCard title="Rows" value={dataEngineerOutput.row_count || 'N/A'} />
                      <MetricCard title="Columns" value={dataEngineerOutput.column_count || 'N/A'} />
                      <MetricCard title="Missing %" value={dataEngineerOutput.missing_values_pct || '0%'} />
                      <MetricCard title="Outliers" value={dataEngineerOutput.outliers_detected || '0'} />
                    </div>
                  </CardContent>
                </Card>
              )}
              {mlOutput && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-blue-600" /> Machine Learning Output
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                        {JSON.stringify(mlOutput, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingView({ message, isComplete }: { message: string, isComplete: boolean }) {
  if (isComplete) {
    return <div className="text-center py-12 text-muted-foreground">No data generated for this specific view.</div>;
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function MetricCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="bg-muted p-4 rounded-lg text-center">
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
