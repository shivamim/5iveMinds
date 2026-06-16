import { useStore } from '@/stores/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Database, Wrench, AlertTriangle, FileUp } from 'lucide-react'

export default function DataEngineeringPage() {
  const { getAgentOutput, currentRun } = useStore()
  
  // CRITICAL: Read from the store, not hardcoded data
  const dataEngineerOutput = getAgentOutput('data_engineer')
  
  // If no pipeline data yet, show empty state
  if (!currentRun) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileUp className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Pipeline Running</h2>
        <p className="text-muted-foreground">Start an analysis from the Dashboard to see data engineering results.</p>
      </div>
    )
  }

  // If pipeline running but data_engineer not completed yet
  if (!dataEngineerOutput) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Database className="w-12 h-12 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-semibold">Waiting for Data Engineer...</h2>
        <p className="text-muted-foreground">The Data Engineer agent is analyzing your dataset schema, quality, and outliers.</p>
      </div>
    )
  }

  const schema = dataEngineerOutput.schema || {}
  const columns = dataEngineerOutput.columns || Object.keys(schema)
  const imputation = dataEngineerOutput.imputation || []
  const outlierDetails = dataEngineerOutput.outlier_details || []
  const qualityScore = dataEngineerOutput.quality_score
  const rowCount = dataEngineerOutput.row_count
  const columnCount = dataEngineerOutput.column_count
  const missingValuesPct = dataEngineerOutput.missing_values_pct

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Engineering</h1>
        <p className="text-muted-foreground">
          Upload data, schema inference, imputation, and outlier detection
        </p>
      </div>

      <Tabs defaultValue="schema" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="imputation">Imputation</TabsTrigger>
          <TabsTrigger value="outliers">Outliers</TabsTrigger>
        </TabsList>

        {/* Schema Tab */}
        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Inferred Schema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Badge variant="outline">{rowCount || '?'} rows</Badge>
                <Badge variant="outline">{columnCount || columns.length} columns</Badge>
                <Badge variant={qualityScore >= 90 ? 'default' : qualityScore >= 70 ? 'secondary' : 'destructive'}>
                  Quality: {qualityScore ?? 'N/A'}/100
                </Badge>
                <Badge variant={missingValuesPct === 0 ? 'default' : missingValuesPct > 5 ? 'destructive' : 'secondary'}>
                  Missing: {missingValuesPct ?? 0}%
                </Badge>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Null %</TableHead>
                    <TableHead>Unique</TableHead>
                    <TableHead>Sample</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((col: string) => {
                    const colSchema = schema[col] || {}
                    return (
                      <TableRow key={col}>
                        <TableCell className="font-medium">{col}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {colSchema.type || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{colSchema.null_pct ?? 0}%</TableCell>
                        <TableCell>{colSchema.unique_count ?? 'N/A'}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Imputation Tab */}
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
                  No imputation was needed. All columns have complete data.
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
                        <TableCell className="font-medium">{item.column}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.strategy}</Badge>
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

        {/* Outliers Tab */}
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
                  No outliers detected in the dataset.
                </div>
              ) : (
                <div className="space-y-4">
                  {outlierDetails.map((detail: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{detail.column}</h4>
                            <p className="text-sm text-muted-foreground">
                              {detail.count || detail.outlier_count || 0} outliers detected
                            </p>
                          </div>
                          <Badge variant="outline">
                            Method: {detail.method || 'IQR'}
                          </Badge>
                        </div>
                        {detail.values && (
                          <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                            Values: {Array.isArray(detail.values) 
                              ? detail.values.slice(0, 10).join(', ') 
                              : detail.values}
                          </div>
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
