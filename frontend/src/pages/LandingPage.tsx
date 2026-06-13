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
  const navigate = useNavigate()
  const setCurrentRun = useStore((s) => s.setCurrentRun)

  const handleStart = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const response = await pipelineApi.start({
        dataset_id: 'temp-dataset-id', // Will be replaced with actual
        business_question: question,
      })
      setCurrentRun(response.data)
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to start pipeline:', error)
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
      {/* Hero */}
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
              get a boardroom-ready analytics pipeline in under 5 seconds.
            </p>
          </motion.div>

          {/* Upload + Question */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <DataUpload />

            <Card>
              <CardContent className="p-6">
                <label className="text-sm font-medium mb-2 block">Business Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Which customers are most likely to churn in the next 30 days?"
                  className="w-full min-h-[100px] rounded-lg border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleStart}
                  disabled={!question.trim() || loading}
                >
                  {loading ? 'Starting Pipeline...' : (
                    <>
                      Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-16"
          >
            {features.map((feature, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur">
                <CardContent className="p-6 text-center">
                  <feature.icon className="h-8 w-8 text-primary mx-auto mb-3" />
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
