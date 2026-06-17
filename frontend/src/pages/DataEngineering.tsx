import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Table, Wand2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePipeline, getAgentOutput } from '@/hooks/usePipeline';
import { uploadDataset } from '@/services/api';
import type { DataEngineerOutput } from '@/types';

export function DataEngineering() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { results } = usePipeline({
    runId,
    pollInterval: 5000,
    autoFetch: !!runId,
  });

  const deOutput = getAgentOutput(results, 'data_engineer') as DataEngineerOutput | null;
  const schema = deOutput?.schema as Record<string, { type: string; nullable: boolean }> | undefined;
  const imputationLog = deOutput?.imputation_log || [];
  const outlierDetails = deOutput?.outlier_details || [];

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const response = await uploadDataset(file);
      localStorage.setItem('lastDatasetId', response.id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Engineering</h1>
        <p className="text-gray-500 mt-1">Upload data, schema inference, imputation, and outlier detection</p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="upload" className="data-[state=active]:bg-white">
            <Upload className="w-4 h-4 mr-1" /> Upload
          </TabsTrigger>
          <TabsTrigger value="schema" className="data-[state=active]:bg-white">
            <Table className="w-4 h-4 mr-1" /> Schema
          </TabsTrigger>
          <TabsTrigger value="imputation" className="data-[state=active]:bg-white">
            <Wand2 className="w-4 h-4 mr-1" /> Imputation
          </TabsTrigger>
          <TabsTrigger value="outliers" className="data-[state=active]:bg-white">
            <AlertTriangle className="w-4 h-4 mr-1" /> Outliers
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Dataset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                <p className="text-gray-400 text-sm mt-1">CSV, Excel files up to 50MB</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              {file && (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button onClick={handleUpload} disabled={uploading} size="sm">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              )}

              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {uploadError}
                </div>
              )}

              {/* Quick Stats */}
              {deOutput && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <StatBox label="Rows" value={deOutput.row_count || 0} />
                  <StatBox label="Columns" value={deOutput.column_count || 0} />
                  <StatBox label="Missing %" value={`${deOutput.missing_values_pct || 0}%`} />
                  <StatBox label="Outliers" value={deOutput.outliers_detected || 0} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schema Tab */}
        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Inferred Schema</CardTitle>
            </CardHeader>
            <CardContent>
              {!schema || Object.keys(schema).length === 0 ? (
                <EmptyState
                  icon={<Table className="w-12 h-12" />}
                  title="No Schema Available"
                  description="Run a pipeline to see the inferred schema from your dataset. The Data Engineer agent will analyze column types, null counts, and data quality."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Column Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Data Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Nullable</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(schema).map(([colName, colInfo]) => (
                        <tr key={colName} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{colName}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="text-xs">
                              {colInfo.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{colInfo.nullable ? 'Yes' : 'No'}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                              Analyzed
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Imputation Tab */}
        <TabsContent value="imputation">
          <Card>
            <CardHeader>
              <CardTitle>Imputation Log</CardTitle>
            </CardHeader>
            <CardContent>
              {!imputationLog || imputationLog.length === 0 ? (
                <EmptyState
                  icon={<Wand2 className="w-12 h-12" />}
                  title="No Imputation Data"
                  description="Run a pipeline to see imputation actions taken by the Data Engineer agent."
                />
              ) : (
                <div className="space-y-2">
                  {imputationLog.map((log, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <pre className="text-gray-700 whitespace-pre-wrap">{JSON.stringify(log, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outliers Tab */}
        <TabsContent value="outliers">
          <Card>
            <CardHeader>
              <CardTitle>Outlier Detection</CardTitle>
            </CardHeader>
            <CardContent>
              {!outlierDetails || outlierDetails.length === 0 ? (
                <EmptyState
                  icon={<AlertTriangle className="w-12 h-12" />}
                  title="No Outliers Detected"
                  description={deOutput ? `Analyzed ${deOutput.columns_analyzed || 0} columns. No significant outliers found.` : 'Run a pipeline to see outlier detection results.'}
                />
              ) : (
                <div className="space-y-2">
                  {outlierDetails.map((detail, i) => (
                    <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                      <pre className="text-gray-700 whitespace-pre-wrap">{JSON.stringify(detail, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
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
