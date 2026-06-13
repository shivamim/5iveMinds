import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, FileSpreadsheet, Presentation, Globe } from 'lucide-react'

export function ReportPage() {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: string) => {
    setExporting(format)
    // API call would go here
    setTimeout(() => setExporting(null), 2000)
  }

  const reportContent = `
# Executive Summary

## Churn Prediction Analysis

### Key Findings
- **Best Model**: RandomForestClassifier achieved 73% accuracy with 0.68 F1-score
- **Top Predictor**: Customer satisfaction score (SHAP importance: 0.043)
- **At-Risk Segment**: 234 customers identified with >70% churn probability

### Business Impact
- **Potential Revenue Recovery**: $1.35M annually through targeted retention
- **Churn Reduction Target**: 24% within 6 months of implementation
- **ROI on ML Program**: 4.2x within first year

### Recommendations (Prioritized)
1. **Proactive Retention Program** — Target low-satisfaction, low-tenure customers
2. **Onboarding Optimization** — First 90 days are critical for long-term retention  
3. **Contract Incentive Restructure** — Month-to-month shows 3x churn vs annual

### Model Performance
| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| Accuracy | 0.73 | 0.70 | Exceeds |
| F1 Score | 0.68 | 0.65 | Exceeds |
| CV Score | 0.71 | 0.68 | Exceeds |
| Precision | 0.72 | 0.70 | Exceeds |
| Recall | 0.65 | 0.60 | Exceeds |
  `

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Report</h1>
          <p className="text-muted-foreground">Generated boardroom-ready analytics report</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'}>
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={exporting === 'excel'}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pptx')} disabled={exporting === 'pptx'}>
            <Presentation className="h-4 w-4 mr-2" /> PPT
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('html')} disabled={exporting === 'html'}>
            <Globe className="h-4 w-4 mr-2" /> HTML
          </Button>
        </div>
      </div>

      <Tabs defaultValue="executive">
        <TabsList>
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
          <TabsTrigger value="technical">Technical Details</TabsTrigger>
          <TabsTrigger value="appendix">Appendix</TabsTrigger>
        </TabsList>

        <TabsContent value="executive">
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {reportContent.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mb-4">{line.slice(2)}</h1>
                  if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(3)}</h2>
                  if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>
                  if (line.startsWith('- **')) {
                    const match = line.match(/- \*\*(.*?)\*\*:\s*(.*)/)
                    return (
                      <div key={i} className="flex gap-2 mb-2">
                        <span className="text-primary">•</span>
                        <span><strong>{match?.[1]}:</strong> {match?.[2]}</span>
                      </div>
                    )
                  }
                  if (line.trim() === '') return <div key={i} className="h-2" />
                  return <p key={i} className="mb-2">{line}</p>
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Model Architecture & Hyperparameters</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
{`RandomForestClassifier(
  n_estimators=200,
  max_depth=12,
  min_samples_split=5,
  min_samples_leaf=2,
  max_features='sqrt',
  bootstrap=True,
  class_weight='balanced'
)`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appendix">
          <Card>
            <CardHeader>
              <CardTitle>Data Lineage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Full data transformation log available in technical export.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
