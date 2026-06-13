import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FeatureImportanceChart, ModelComparisonChart, MetricsRadar } from '@/components/charts'
import { Trophy } from 'lucide-react'

export function MLResultsPage() {
  const features = [
    { name: 'satisfaction_score', importance: 0.043 },
    { name: 'tenure', importance: 0.038 },
    { name: 'age', importance: 0.029 },
    { name: 'monthly_charges', importance: 0.025 },
    { name: 'contract_type', importance: 0.021 },
    { name: 'payment_method', importance: 0.018 },
    { name: 'tech_support', importance: 0.015 },
    { name: 'online_security', importance: 0.012 },
  ]

  const models = [
    { model: 'Random Forest', accuracy: 0.73, f1: 0.68, cv: 0.71 },
    { model: 'Gradient Boosting', accuracy: 0.71, f1: 0.66, cv: 0.70 },
    { model: 'Extra Trees', accuracy: 0.70, f1: 0.65, cv: 0.69 },
    { model: 'Logistic Reg', accuracy: 0.68, f1: 0.63, cv: 0.67 },
    { model: 'KNN', accuracy: 0.65, f1: 0.60, cv: 0.64 },
  ]

  const metrics = [
    { metric: 'Accuracy', value: 73, fullMark: 100 },
    { metric: 'F1 Score', value: 68, fullMark: 100 },
    { metric: 'CV Score', value: 71, fullMark: 100 },
    { metric: 'Precision', value: 72, fullMark: 100 },
    { metric: 'Recall', value: 65, fullMark: 100 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ML Results</h1>
        <p className="text-muted-foreground">AutoML model selection and SHAP explainability</p>
      </div>

      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/10">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Model</p>
              <p className="text-xl font-bold">RandomForestClassifier</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">CV: 0.71</Badge>
                <Badge variant="outline">Acc: 0.73</Badge>
                <Badge variant="outline">F1: 0.68</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeatureImportanceChart data={features} />
        <ModelComparisonChart data={models} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsRadar data={metrics} />
        <Card>
          <CardHeader>
            <CardTitle>SHAP Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {features.slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-mono w-32 truncate">{f.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(f.importance / 0.043) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{f.importance.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
