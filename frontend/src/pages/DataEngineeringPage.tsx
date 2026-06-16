import { useState } from 'react'
import { useStore } from '@/stores/appStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DataUpload } from '@/components/data/DataUpload'
import { FileQuestion } from 'lucide-react'

export function DataEngineeringPage() {
  const [activeTab, setActiveTab] = useState('upload')
  // FIXED: Read data_engineer output from store instead of hardcoded data
  const getAgentOutput = useStore((s) => s.getAgentOutput)
  const agentExecutions = useStore((s) => s.agentExecutions)

  const dataEngineerOutput = getAgentOutput('data_engineer')
  const execution = agentExecutions.find((e) => e.agent_name === 'data_engineer')

  // Parse schema from agent output_data if available
  const schemaColumns = dataEngineerOutput?.schema
    ? (dataEngineerOutput.schema as Array<{
        name: string
        type: string
        nulls?: number
        unique?: number
      }>)
    : dataEngineerOutput?.columns
      ? (dataEngineerOutput.columns as Array<{
          name: string
          type: string
          nulls?: number
          unique?: number
        }>)
      : null

  // Parse cleaning summary
  const cleaningSummary = dataEngineerOutput?.cleaning_summary as Record<
    string,
    unknown
  > | null
  const outlierInfo = dataEngineerOutput?.outliers as
    | Array<{
        column: string
        count: number
        method: string
      }>
    | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Engineering</h1>
        <p className="text-muted-foreground">
          Upload data, schema inference, imputation, and outlier detection
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="imputation">Imputation</TabsTrigger>
          <TabsTrigger value="outliers">Outliers</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Dataset</CardTitle>
            </CardHeader>
            <CardContent>
              <DataUpload />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inferred Schema</CardTitle>
            </CardHeader>
            <CardContent>
              {execution?.status === 'running' ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Analyzing schema...
                </div>
              ) : schemaColumns && schemaColumns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Column</th>
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-left py-3 px-4 font-medium">Nulls</th>
                        <th className="text-left py-3 px-4 font-medium">Unique</th>
                        <th className="text-left py-3 px-4 font-medium">Quality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schemaColumns.map((col, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3 px-4 font-mono">{col.name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-xs">
                              {col.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">{col.nulls ?? 0}</td>
                          <td className="py-3 px-4">{col.unique ?? '—'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs ${
                                (col.nulls ?? 0) === 0
                                  ? 'text-emerald-500'
                                  : (col.nulls ?? 0) < 10
                                    ? 'text-amber-500'
                                    : 'text-red-500'
                              }`}
                            >
                              {(col.nulls ?? 0) === 0
                                ? 'Clean'
                                : (col.nulls ?? 0) < 10
                                  ? 'Minor issues'
                                  : 'Needs attention'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="Run a pipeline to see the inferred schema from your dataset. The Data Engineer agent will analyze column types, null counts, and data quality." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imputation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Imputation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {execution?.status === 'running' ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Running imputation...
                </div>
              ) : cleaningSummary ? (
                <div className="space-y-4">
                  {Object.entries(cleaningSummary).map(([key, value], i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Run a pipeline to see imputation results. The Data Engineer agent handles missing values using median (numeric) and mode (categorical) strategies." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outlier Detection</CardTitle>
            </CardHeader>
            <CardContent>
              {execution?.status === 'running' ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Detecting outliers...
                </div>
              ) : outlierInfo && outlierInfo.length > 0 ? (
                <div className="space-y-3">
                  {outlierInfo.map((o, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <span className="font-medium">{o.column}</span>
                        <p className="text-xs text-muted-foreground">Method: {o.method}</p>
                      </div>
                      <span className="text-amber-500 font-mono">
                        {o.count} outliers
                      </span>
                    </div>
                  ))}
                </div>
              ) : dataEngineerOutput?.outlier_count ? (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">
                    Outliers detected:{' '}
                    <span className="font-mono">
                      {String(dataEngineerOutput.outlier_count)}
                    </span>
                  </p>
                </div>
              ) : (
                <EmptyState message="Run a pipeline to see outlier detection results. The Data Engineer agent identifies outliers using IQR and Z-score methods." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
      <p className="text-muted-foreground max-w-md mx-auto">{message}</p>
    </div>
  )
}
