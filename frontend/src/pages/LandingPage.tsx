import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DataUpload } from '@/components/data/DataUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Zap, ArrowRight, Brain, BarChart3, Shield, Clock } from 'lucide-react'

export function LandingPage() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const setCurrentRun = useStore((s) => s.setCurrentRun)
  const datasets = useStore((s) => s.datasets)

  const handleStart = async () => {
    if (!question.trim()) return

    if (datasets.length === 0) {
      setError('Please upload a dataset first before starting the analysis.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await pipelineApi.start({
        dataset_id: datasets[0].id,
        business_question: question,
      })
      // Map backend response to our PipelineRun type
      const runData = response.data
      setCurrentRun({
        id: runData.id,
        status: runData.status,
        business_question: runData.business_question,
        dataset_name: runData.dataset_name || datasets[0].filename,
        total_time_ms: runData.total_time_ms,
        quality_score_avg: runData.quality_score_avg,
        started_at: runData.started_at,
        completed_at: runData.completed_at,
      })
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Failed to start pipeline:', error)
      let msg = 'Failed to start analysis. Please check that the backend API is running and accessible.'
      if (error.response?.data?.detail) {
        msg = `Server error: ${error.response.data.detail}`
      } else if (error.request) {
        msg = 'Cannot connect to backend. Please check your API URL configuration (VITE_API_URL).'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Brain, title: '5 AI Agents', desc: 'Data Engineer, Statistician, ML Engineer, Strategist, Designer' },
    { icon: BarChart3, title: 'AutoML', desc: '5-model comparison with SHAP explainability' },
    { icon: Shield, title: 'Quality Gates', desc: 'Reflection engine with retry logic' },
    { icon: Clock, title: '< 5 Seconds', desc: 'Full pipeline from raw data to boardroom report' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5" />
        <div className="relative max-w-5xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              v2.0 — Now on FastAPI + React
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">FiveMinds</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Five agents. One mind. Zero manual work. Upload your data, ask a business question,
              and watch our multi-agent system deliver a complete analysis in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <DataUpload />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="What would you like to know about your data?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                className="flex-1 px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                onClick={handleStart}
                disabled={loading || !question.trim()}
                className="px-6"
              >
                {loading ? (
                  'Starting...'
                ) : (
                  <>
                    Start Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
            {datasets.length > 0 && (
              <p className="text-emerald-500 text-sm mt-2">
                Dataset ready: {datasets[0].filename} ({datasets[0].row_count.toLocaleString()} rows, {datasets[0].column_count} columns)
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {features.map((feature, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
