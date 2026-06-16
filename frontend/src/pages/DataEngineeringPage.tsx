import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Database, Wrench, AlertTriangle, FileUp } from 'lucide-react'

export default function DataEngineeringPage() {
  const { getAgentOutput, currentRun, setAgentExecutions, agentExecutions } = useStore()
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!currentRun?.id) return
    const loadData = async () => {
      const existing = getAgentOutput('data_engineer')
      if (existing && Object.keys(existing).length > 0) return

      setFetching(true)
      try {
        const res = await pipelineApi.getStatus(currentRun.id)
        const executions = res.data?.executions ?? []
        if (executions.length > 0) {
          setAgentExecutions(executions)
        }
      } catch (err) {
        console.error('Failed to fetch agent data:', err)
      } finally {
        setFetching(false)
      }
    }
    loadData()
  }, [currentRun?.id, setAgentExecutions, getAgentOutput])

  const dataEngineerOutput = useMemo(() => getAgentOutput('data_engineer') || {}, [agentExecutions, getAgentOutput])

  const schema = dataEngineerOutput.schema || dataEngineerOutput.inferred_schema || {}
  const columns = dataEngineerOutput.columns || Object.keys(schema)
  const imputation = dataEngineerOutput.imputation || dataEngineerOutput.imputation_log || []
  const outlierDetails = dataEngineerOutput.outlier_details || dataEngineerOutput.outliers || []
  const qualityScore = dataEngineerOutput.quality_score ?? dataEngineerOutput.data_quality_score ?? null
  const rowCount = dataEngineerOutput.row_count ?? 0
  const columnCount = dataEngineerOutput.column_count ?? columns.length
  const missingValuesPct = dataEngineerOutput.missing_values_pct ?? 0
  const columnQuality = dataEngineerOutput.column_quality || []

  const hasData = columns.length > 0 || Object.keys(schema).length > 0 || qualityScore !== null

  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileUp className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Pipeline Running</h2>
        <p className="text-muted-foreground">Start an analysis from the Dashboard to see data engineering results.</p>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Database className="w-12 h-12 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-semibold">Waiting for Data Engineer...</h2>
        <p className="text-muted-foreground">
          {fetching ? 'Fetching results from server...' : 'The Data Engineer agent is analyzing your dataset.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Engineering</h1>
        <p className="text-muted-foreground">Schema inference, cleaning, imputation, and outlier detection</p>
      </div>

      <Tabs defaultValue="schema" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="imputation">Imputation</TabsTrigger>
          <TabsTrigger value="outliers">Outliers</TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Inferred Schema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{rowCount || '?'} rows</Badge>
                <Badge variant="outline">{columnCount || columns.length} columns</Badge>
                <Badge variant={qualityScore >= 90 ? 'default' : qualityScore >= 70 ? 'secondary' : 'destructive'}>
                  Quality: {qualityScore ?? 'N/A'}/100
                </Badge>
                <Badge variant={missingValuesPct === 0 ? 'default' : missingValuesPct > 5 ? 'destructive' : 'secondary'}>
                  Missing: {missingValuesPct ?? 0}%
                </Badge>
              </div>

              {columns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Database className="h-8 w-8 opacity-50" />
                  <p>Schema details are not available in this agent output.</p>
                  <p className="text-xs">The agent reported quality score {qualityScore} but did not return column-level schema metadata.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Null %</TableHead>
                      <TableHead>Unique</TableHead>
                      <TableHead>Sample Values</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columns.map((col: string) => {
                      const colSchema = schema[col] || {}
                      const colQuality = columnQuality.find((c: any) => c.column === col) || {}
                      return (
                        <TableRow key={col}>
                          <TableCell className="font-medium">{col}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {colSchema.type || colQuality.type || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{colSchema.null_pct ?? colQuality.null_pct ?? 0}%</TableCell>
                          <TableCell>{colSchema.unique_count ?? colQuality.unique_count ?? 'N/A'}</TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                            {Array.isArray(colSchema.sample_values)
                              ? colSchema.sample_values.slice(0, 3).join(', ')
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imputation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Imputation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imputation.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No imputation was needed. All columns have complete data.</p>
                  <p className="text-xs mt-1">Missing values: {missingValuesPct}%</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Values Filled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imputation.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.column || item.col || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{item.strategy || item.method || '—'}</Badge>
                        </TableCell>
                        <TableCell>{item.filled_count || item.count || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Outlier Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {outlierDetails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No outliers detected in the dataset.</p>
                  <p className="text-xs mt-1">All numeric columns fall within expected ranges.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outlierDetails.map((detail: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{detail.column || detail.col || '—'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {detail.count || detail.outlier_count || 0} outliers detected
                            </p>
                          </div>
                          <Badge variant="outline">Method: {detail.method || 'IQR'}</Badge>
                        </div>
                        {detail.values && (
                          <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                            Values: {Array.isArray(detail.values) ? detail.values.slice(0, 10).join(', ') : detail.values}
                          </div>
                        )}
                        {detail.note && (
                          <p className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">{detail.note}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
