import { useSearchParams } from 'react-router-dom';
import { Table, Wand2, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';
import type { DataEngineerOutput } from '@/types';

export function DataEngineering() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');

  const { results, isComplete } = usePipeline({ runId, pollInterval: 5000, autoFetch: !!runId });

  const deOutput = getAgentOutput(results, 'data_engineer') as DataEngineerOutput | null;
  const schema = deOutput?.schema as Record<string, any> | undefined;
  const imputationLog = deOutput?.imputation_log || [];
  const outlierDetails = deOutput?.outlier_details || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Data Engineering Diagnostics</h1>
        <p className="text-muted-foreground mt-2">Review schema inference, automated imputation, and outlier detection from your active pipeline run.</p>
      </div>

      {!runId ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-xl border-2 border-dashed">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Active Pipeline</h2>
          <p className="text-muted-foreground text-center max-w-md">
            You don't need to upload your CSV here. Data is automatically processed in the main pipeline. 
            Please start a new analysis from the Home page to view engineering diagnostics.
          </p>
        </div>
      ) : (
        <>
          {deOutput && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatBox label="Rows Processed" value={deOutput.row_count || 'N/A'} />
              <StatBox label="Columns Analyzed" value={deOutput.column_count || 'N/A'} />
              <StatBox label="Missing Data" value={deOutput.missing_values_pct || '0%'} />
              <StatBox label="Outliers Found" value={deOutput.outliers_detected || 0} />
            </div>
          )}

          <Tabs defaultValue="schema" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="schema">Inferred Schema</TabsTrigger>
              <TabsTrigger value="imputation">Imputation Log</TabsTrigger>
              <TabsTrigger value="outliers">Outlier Details</TabsTrigger>
            </TabsList>

            <TabsContent value="schema" className="mt-0">
              {!isComplete && !schema ? (<LoadingState message="Inferring schema..." />) : !schema || Object.keys(schema).length === 0 ? (
                <EmptyState icon={<Table className="w-12 h-12 text-muted-foreground" />} title="No Schema Data" description="Schema data is currently unavailable." />
              ) : (
                <Card>
                  <CardHeader><CardTitle>Data Types & Schema</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-xs uppercase">
                          <tr><th className="px-4 py-3">Column Name</th><th className="px-4 py-3">Data Type</th><th className="px-4 py-3">Nullable</th><th className="px-4 py-3">Status</th></tr>
                        </thead>
                        <tbody>
                          {Object.entries(schema).map(([colName, colInfo]: [string, any]) => (
                            <tr key={colName} className="border-b">
                              <td className="px-4 py-3 font-medium">{colName}</td>
                              <td className="px-4 py-3"><Badge variant="outline">{colInfo.type}</Badge></td>
                              <td className="px-4 py-3">{colInfo.nullable ? 'Yes' : 'No'}</td>
                              <td className="px-4 py-3"><Badge className="bg-green-100 text-green-800">Analyzed</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="imputation" className="mt-0">
              {!isComplete && !imputationLog.length ? (<LoadingState message="Processing missing values..." />) : !imputationLog.length ? (
                <EmptyState icon={<Wand2 className="w-12 h-12 text-muted-foreground" />} title="No Imputation Required" description="The dataset did not require significant missing value imputation." />
              ) : (
                <Card>
                  <CardHeader><CardTitle>Automated Imputation Log</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]"><pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">{JSON.stringify(imputationLog, null, 2)}</pre></ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="outliers" className="mt-0">
              {!isComplete && !outlierDetails.length ? (<LoadingState message="Detecting outliers..." />) : !outlierDetails.length ? (
                <EmptyState icon={<AlertTriangle className="w-12 h-12 text-muted-foreground" />} title="No Outliers Detected" description="Data falls within normal statistical boundaries." />
              ) : (
                <Card>
                  <CardHeader><CardTitle>Outlier Detection</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]"><pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">{JSON.stringify(outlierDetails, null, 2)}</pre></ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <p className="text-3xl font-bold text-blue-600">{String(value)}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-muted-foreground">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
