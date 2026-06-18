import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';
import { 
  Loader2, CheckCircle2, AlertCircle, BarChart3, 
  Database, LineChart, FileText, BrainCircuit, Bot, Sparkles 
} from 'lucide-react';

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');

  const { status, results, error, isComplete } = usePipeline({
    runId,
    pollInterval: 3000,
    autoFetch: !!runId,
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gray-50 rounded-2xl border border-dashed border-gray-300 m-6">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">No Active Analysis</h2>
        <p className="text-gray-500 mt-2 mb-6">Please upload a dataset to begin the intelligence pipeline.</p>
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
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-gray-50/50">
      
      <div className="w-full md:w-80 border-r border-gray-200 bg-white flex flex-col shadow-sm z-10">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">FiveMinds Core</h2>
          </div>
          <p className="text-xs text-gray-500 font-mono truncate">Run ID: {runId}</p>
          
          <div className="mt-4 flex items-center">
             {!isComplete && !error ? (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 w-full justify-center py-1">
                <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Analyzing Data
              </Badge>
            ) : error ? (
              <Badge variant="destructive" className="w-full justify-center py-1">
                <AlertCircle className="w-3 h-3 mr-2" /> Pipeline Failed
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-full justify-center py-1">
                <CheckCircle2 className="w-3 h-3 mr-2" /> Analysis Complete
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {agents.map((agent) => {
              const execStatus = status?.executions?.find(e => e.agent_name === agent.id)?.status || 'pending';
              const Icon = agent.icon;
              
              return (
                <Card key={agent.id} className={`border transition-all duration-300 ${
                  execStatus === 'running' ? 'border-blue-300 shadow-md bg-blue-50/30' : 
                  execStatus === 'completed' ? 'border-green-200 bg-white' : 'border-gray-100 bg-gray-50/50 opacity-70'
                }`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        execStatus === 'running' ? 'bg-blue-100 text-blue-700' :
                        execStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.desc}</p>
                      </div>
                    </div>
                    <div>
                      {execStatus === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                       execStatus === 'running' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> :
                       <div className="w-2 h-2 rounded-full bg-gray-300" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/30">
        <div className="p-6 h-full flex flex-col">
          
          <Tabs defaultValue="executive" className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Intelligence Output</h1>
              <TabsList className="bg-white border border-gray-200 shadow-sm">
                <TabsTrigger value="executive" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Executive Summary</TabsTrigger>
                <TabsTrigger value="charts" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Visualizations</TabsTrigger>
                <TabsTrigger value="diagnostics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Data Diagnostics</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-6 h-full">
                
                <TabsContent value="executive" className="mt-0 h-full outline-none">
                  {!strategistOutput ? (
                    <LoadingView message="The Strategist agent is compiling your final business report..." isComplete={isComplete} />
                  ) : (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                        <Bot className="w-8 h-8 text-blue-600 bg-blue-100 p-1.5 rounded-lg" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Final Strategy Report</h3>
                          <p className="text-sm text-gray-500">Synthesized from all agent findings</p>
                        </div>
                      </div>
                      <div className="prose prose-blue max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-gray-700 text-base leading-relaxed bg-transparent border-0 p-0 m-0">
                          {JSON.stringify(strategistOutput.report || strategistOutput.summary || strategistOutput, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="charts" className="mt-0 h-full outline-none">
                  {charts.length === 0 ? (
                    <LoadingView message="The Designer agent is generating optimal visualizations..." isComplete={isComplete} />
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
                      {charts.map((chart: any, idx: number) => (
                        <Card key={idx} className="border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3">
                            <CardTitle className="text-base font-semibold capitalize flex items-center">
                              <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
                              {chart.chart_type.replace(/_/g, ' ')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="w-full h-64 bg-slate-50 border border-dashed border-slate-200 rounded flex flex-col items-center justify-center text-slate-400">
                              <LineChart className="w-8 h-8 mb-2 opacity-50" />
                              <p className="text-sm font-medium">Chart Data Rendered Here</p>
                              <pre className="text-xs mt-2 overflow-hidden max-w-[200px] truncate">
                                {JSON.stringify(chart.chart_data)}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="diagnostics" className="mt-0 h-full outline-none">
                  {!dataEngineerOutput && !mlOutput ? (
                    <LoadingView message="Agents are processing technical data metrics..." isComplete={isComplete} />
                  ) : (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      
                      {dataEngineerOutput && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center border-b pb-2">
                            <Database className="w-5 h-5 mr-2 text-blue-600" /> Data Engineering Metrics
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard title="Total Rows" value={(dataEngineerOutput as any).row_count || 'N/A'} />
                            <MetricCard title="Features" value={(dataEngineerOutput as any).column_count || 'N/A'} />
                            <MetricCard title="Missing %" value={`${(dataEngineerOutput as any).missing_values_pct || 0}%`} />
                            <MetricCard title="Anomalies" value={(dataEngineerOutput as any).outliers_detected || 0} />
                          </div>
                        </div>
                      )}

                      {mlOutput && (
                        <div className="space-y-4 pt-4">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center border-b pb-2">
                            <BrainCircuit className="w-5 h-5 mr-2 text-purple-600" /> Machine Learning Output
                          </h3>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                             <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                               {JSON.stringify(mlOutput, null, 2)}
                             </pre>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </TabsContent>

              </div>
            </ScrollArea>
          </Tabs>
          
        </div>
      </div>
    </div>
  );
}

function LoadingView({ message, isComplete }: { message: string, isComplete: boolean }) {
  if (isComplete) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
        <FileText className="w-12 h-12 text-gray-300" />
        <p>No data generated for this specific view.</p>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col items-center justify-center text-blue-600 space-y-4">
      <div className="relative">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-white p-3 rounded-full border border-blue-100 shadow-sm">
          <BrainCircuit className="w-8 h-8 text-blue-600 animate-pulse" />
        </div>
      </div>
      <p className="font-medium text-gray-600 animate-pulse">{message}</p>
    </div>
  );
}

function MetricCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
