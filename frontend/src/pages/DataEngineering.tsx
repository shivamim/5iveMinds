import { useSearchParams } from 'react-router-dom';
import { Table, Wand2, AlertTriangle, Loader2, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';

export function DataEngineering() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');
  const { results, isComplete } = usePipeline({ runId, pollInterval: 3000, autoFetch: !!runId });

  const deOutput = getAgentOutput(results, 'data_engineer') as any;
  const schema = deOutput?.schema || {};
  const schemaEntries = Object.entries(schema);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3"><Database className="w-8 h-8 text-blue-600" /> Data Engineering Diagnostics</h1>
        <p className="text-muted-foreground mt-2">Review schema inference, automated imputation, and outlier detection.</p>
      </div>

      {!runId || (!isComplete && !deOutput) ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" /><p>Data Engineer is analyzing schema...</p></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatBox label="Rows Processed" value={deOutput?.row_count || 'N/A'} />
            <StatBox label="Columns Analyzed" value={deOutput?.column_count || 'N/A'} />
            <StatBox label="Missing Data" value={deOutput?.missing_values_pct || '0%'} />
            <StatBox label="Outliers Found" value={deOutput?.outliers_detected || 0} />
          </div>

          <Tabs defaultValue="schema" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="schema">Inferred Schema</TabsTrigger>
              <TabsTrigger value="imputation">Imputation Log</TabsTrigger>
              <TabsTrigger value="outliers">Outlier Details</TabsTrigger>
            </TabsList>

            <TabsContent value="schema">
              {schemaEntries.length === 0 ? <EmptyState icon={<Table className="w-12 h-12" />} title="No Schema Data" /> : (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-xs uppercase">
                        <tr><th className="px-4 py-3">Column Name</th><th className="px-4 py-3">Data Type</th><th className="px-4 py-3">Nullable</th><th className="px-4 py-3">Unique Values</th></tr>
                      </thead>
                      <tbody>
                        {schemaEntries.map(([colName, colInfo]: [string, any]) => (
                          <tr key={colName} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium">{colName}</td>
                            <td className="px-4 py-3"><Badge variant="outline">{colInfo.type || 'unknown'}</Badge></td>
                            <td className="px-4 py-3">{colInfo.nullable ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-3">{colInfo.unique_count || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="imputation">
              <Card><CardContent className="pt-6"><ScrollArea className="h-[400px]"><pre className="bg-muted p-4 rounded-lg text-xs">{JSON.stringify(deOutput?.imputation_log || [], null, 2)}</pre></ScrollArea></CardContent></Card>
            </TabsContent>

            <TabsContent value="outliers">
              <Card><CardContent className="pt-6"><ScrollArea className="h-[400px]"><pre className="bg-muted p-4 rounded-lg text-xs">{JSON.stringify(deOutput?.outlier_details || [], null, 2)}</pre></ScrollArea></CardContent></Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-blue-600">{String(value)}</p><p className="text-sm text-muted-foreground mt-1">{label}</p></CardContent></Card>;
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">{icon}<h3 className="text-xl font-semibold mt-4">{title}</h3></div>;
}
