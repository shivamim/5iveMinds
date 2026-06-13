import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChartComponent } from '@/components/charts'
import { Lightbulb, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

export function StrategyPage() {
  const recommendations = [
    {
      id: 1,
      title: 'Implement Proactive Retention Program',
      impact: 'High',
      effort: 'Medium',
      roi: '$450K/year',
      risk: 'Low',
      description: 'Target customers with satisfaction_score < 3 and tenure < 12 months with personalized outreach.',
    },
    {
      id: 2,
      title: 'Optimize Onboarding Flow',
      impact: 'High',
      effort: 'Low',
      roi: '$280K/year',
      risk: 'Low',
      description: 'First 90 days are critical. Improve tech support availability for new customers.',
    },
    {
      id: 3,
      title: 'Contract Incentive Restructure',
      impact: 'Medium',
      effort: 'High',
      roi: '$620K/year',
      risk: 'Medium',
      description: 'Month-to-month customers show 3x churn rate. Incentivize 1-year contracts.',
    },
  ]

  const priorityData = [
    { name: 'High Impact / Low Effort', value: 2 },
    { name: 'High Impact / High Effort', value: 1 },
    { name: 'Medium Impact / Low Effort', value: 3 },
    { name: 'Quick Wins', value: 4 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Strategic Insights</h1>
        <p className="text-muted-foreground">Business recommendations with ROI analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Total Potential ROI</span>
            </div>
            <p className="text-3xl font-bold">$1.35M</p>
            <p className="text-xs text-muted-foreground">Annual recurring impact</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Churn Reduction</span>
            </div>
            <p className="text-3xl font-bold">-24%</p>
            <p className="text-xs text-muted-foreground">Projected within 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">At-Risk Customers</span>
            </div>
            <p className="text-3xl font-bold">234</p>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recommendations</h2>
          {recommendations.map((rec) => (
            <Card key={rec.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold">{rec.title}</h3>
                  </div>
                  <Badge variant={rec.impact === 'High' ? 'default' : 'secondary'}>{rec.impact} Impact</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-muted-foreground">Effort: <span className="text-foreground font-medium">{rec.effort}</span></span>
                  <span className="text-muted-foreground">ROI: <span className="text-emerald-500 font-medium">{rec.roi}</span></span>
                  <span className="text-muted-foreground">Risk: <span className="text-foreground font-medium">{rec.risk}</span></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <PieChartComponent data={priorityData} />
      </div>
    </div>
  )
}
