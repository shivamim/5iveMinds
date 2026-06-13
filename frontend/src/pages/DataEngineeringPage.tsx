import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DataUpload } from '@/components/data/DataUpload'

export function DataEngineeringPage() {
  const [activeTab, setActiveTab] = useState('upload')
  const schemaData = {
    columns: [
      { name: 'customer_id', type: 'int64', nulls: 0, unique: 1000 },
      { name: 'age', type: 'int64', nulls: 12, unique: 45 },
      { name: 'satisfaction_score', type: 'float64', nulls: 0, unique: 89 },
      { name: 'tenure', type: 'int64', nulls: 5, unique: 34 },
      { name: 'churn', type: 'object', nulls: 0, unique: 2 },
    ]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Engineering</h1>
        <p className="text-muted-foreground">Upload data, schema inference, imputation, and outlier detection</p>
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
                    {schemaData.columns.map((col) => (
                      <tr key={col.name} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-xs">{col.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                            {col.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">{col.nulls}</td>
                        <td className="py-3 px-4">{col.unique}</td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-500 text-xs">Valid</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imputation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Missing Value Imputation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Upload a dataset to see imputation recommendations. The Data Engineer agent will
                automatically detect missing values and suggest the best imputation strategy.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outlier Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Upload a dataset to detect outliers. The system uses statistical methods and
                isolation forests to identify anomalous data points.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
