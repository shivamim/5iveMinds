import { useSearchParams } from 'react-router-dom';
import { Table, Wand2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';
import type { DataEngineerOutput } from '@/types';

export function DataEngineering() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');

  const { results, isComplete } = usePipeline({
    runId,
    pollInterval: 5000,
    autoFetch: !!runId,
  });

  const deOutput = getAgentOutput(results, 'data_engineer') as DataEngineerOutput | null;
  const schema = deOutput?.schema as Record<string, { type: string; nullable: boolean }> | undefined;
  const imputationLog = deOutput?.imputation_log || [];
  const outlierDetails = deOutput?.outlier_details || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Engineering Diagnostics</h1>
        <p className="text-gray-500 mt-1">Review schema inference, automated imputation, and outlier detection from your pipeline run.</p>
      </div>

      {!runId ? (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-yellow-800 text-center font-medium">
            No pipeline is currently active. Please start a run from the Home page.
          </CardContent>
        </Card>
      ) : (
        <>
          {deOutput && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatBox label="Rows Analyzed" value={deOutput.row_count || 0} />
              <StatBox label="Columns Detected" value={deOutput.column_count || 0} />
              <StatBox label="Missing % Handled" value={`${deOutput.missing_values_pct || 0}%`} />
              <StatBox label="Outliers Addressed" value={deOutput.outliers_detected || 0} />
            </div>
          )}

          <Tabs defaultValue="schema" className="space-y-4">
            <TabsList className="bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="schema" className="data-[state=active]:bg-white rounded-md">
                <Table className="w-4 h-4 mr-2" /> Inferred Schema
              </TabsTrigger>
              <TabsTrigger value="imputation" className="data-[state=active]:bg-white rounded-md">
                <Wand2 className="w-4 h-4 mr-2" /> Imputation Log
              </TabsTrigger>
              <TabsTrigger value="outliers" className="data-[state=active]:bg-white rounded-md">
                <AlertTriangle className="w-4 h-4 mr-2" /> Outlier Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schema">
              <Card>
                <CardHeader>
                  <CardTitle>Data Types & Schema</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isComplete && !schema ? (
                    <LoadingState message="Data Engineer agent is analyzing schema..." />
                  ) : !schema || Object.keys(schema).length === 0 ? (
                    <EmptyState icon={<Table className="w-12 h-12" />} title="No Schema Data" description="Schema data is currently unavailable." />
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-700">Column Name</th>
                            <th className="py-3 px-4 font-semibold text-gray-700">Data Type</th>
                            <th className="py-3 px-4 font-semibold text-gray-700">Nullable</th>
                            <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {Object.entries(schema).map(([colName, colInfo]) => (
                            <tr key={colName} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900">{colName}</td>
                              <td className="py-3 px-4"><Badge variant="secondary">{colInfo.type}</Badge></td>
                              <td className="py-3 px-4 text-gray-600">{colInfo.nullable ? 'Yes' : 'No'}</td>
                              <td className="py-3 px-4"><Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Analyzed</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="imputation">
              <Card>
                <CardHeader><CardTitle>Automated Imputation Log</CardTitle></CardHeader>
                <CardContent>
                  {!isComplete && !imputationLog.length ? (
                    <LoadingState message="Applying data imputation strategies..." />
                  ) : !imputationLog.length ? (
                    <EmptyState icon={<Wand2 className="w-12 h-12" />} title="No Imputation Required" description="The dataset did not require significant missing value imputation." />
                  ) : (
                    <div className="space-y-3">
                      {imputationLog.map((log, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono text-gray-800">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outliers">
              <Card>
                <CardHeader><CardTitle>Outlier Detection</CardTitle></CardHeader>
                <CardContent>
                  {!isComplete && !outlierDetails.length ? (
                    <LoadingState message="Scanning for statistical anomalies..." />
                  ) : !outlierDetails.length ? (
                    <EmptyState icon={<AlertTriangle className="w-12 h-12" />} title="No Outliers Detected" description="Data falls within normal statistical boundaries." />
                  ) : (
                    <div className="space-y-3">
                      {outlierDetails.map((detail, i) => (
                        <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm font-mono text-yellow-900">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(detail, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 text-center">
      <p className="text-3xl font-bold text-gray-900">{String(value)}</p>
      <p className="text-sm font-medium text-gray-500 mt-2 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-gray-300 mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto">{description}</p>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 animate-pulse">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
}
