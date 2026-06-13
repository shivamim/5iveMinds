import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DistributionChart, CorrelationHeatmap } from '@/components/charts'

export function StatisticsPage() {
  const distData = [
    { bin: '0-10', count: 45 },
    { bin: '10-20', count: 89 },
    { bin: '20-30', count: 134 },
    { bin: '30-40', count: 178 },
    { bin: '40-50', count: 156 },
    { bin: '50-60', count: 123 },
    { bin: '60-70', count: 89 },
    { bin: '70-80', count: 67 },
    { bin: '80-90', count: 45 },
    { bin: '90-100', count: 23 },
  ]

  const corrData = [
    { x: 'age', y: 'age', value: 1.0 },
    { x: 'age', y: 'satisfaction', value: -0.34 },
    { x: 'age', y: 'tenure', value: 0.56 },
    { x: 'satisfaction', y: 'age', value: -0.34 },
    { x: 'satisfaction', y: 'satisfaction', value: 1.0 },
    { x: 'satisfaction', y: 'tenure', value: 0.12 },
    { x: 'tenure', y: 'age', value: 0.56 },
    { x: 'tenure', y: 'satisfaction', value: 0.12 },
    { x: 'tenure', y: 'tenure', value: 1.0 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistical Analysis</h1>
        <p className="text-muted-foreground">EDA, hypothesis testing, and correlation analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionChart data={distData} />
        <CorrelationHeatmap data={corrData} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hypothesis Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">T-test: Age vs Churn</span>
              <span className="text-emerald-500 font-mono">p = 0.003 (significant)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">Chi-square: Satisfaction vs Churn</span>
              <span className="text-emerald-500 font-mono">p = 0.001 (significant)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">ANOVA: Tenure groups</span>
              <span className="text-amber-500 font-mono">p = 0.052 (marginal)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
