import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DataUpload } from '@/components/data/DataUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useStore } from '@/stores/appStore'
import { pipelineApi } from '@/lib/api'
import { Zap, ArrowRight, Brain, BarChart3, Shield, Clock, ChevronDown, Database } from 'lucide-react'

export function LandingPage() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // FIXED: Allow user to select which dataset to use
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)
  const [showDatasetDropdown, setShowDatasetDropdown] = useState(false)

  const navigate = useNavigate()
  const setCurrentRun = useStore((s) => s.setCurrentRun)
  const datasets = useStore((s) => s.datasets)

  // FIXED: Use selected dataset or first available
  const activeDataset = datasets.find(d => d.id === selectedDatasetId) || datasets[0] || null

  const handleStart = async () => {
    if (!question.trim()) return

    if (datasets.length === 0) {
      setError('Please upload a dataset first before starting the analysis.')
      return
    }

    // FIXED: Use the explicitly selected or default dataset
    const datasetToUse = activeDataset
    if (!datasetToUse) {
      setError('Please select a dataset to analyze.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await pipelineApi.start({
        dataset_id: datasetToUse.id,
        business_question: question,
      })
      // Map backend response to our PipelineRun type
      const runData = response.data
      setCurrentRun({
        id: runData.id,
        status: runData.status,
        business_question: runData.business_question,
        // FIXED: Include dataset_id in the run data
        dataset_id: runData.dataset_id || datasetToUse.id,
        dataset_name: runData.dataset_name || datasetToUse.filename,
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
      } else if (error.response?.status === 404) {
        msg = 'Dataset not found. It may have been deleted. Please upload again.'
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

          {/* FIXED: Dataset selector when multiple datasets uploaded */}
          {datasets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="max-w-2xl mx-auto mb-6"
            >
              <div className="relative">
                <button
                  onClick={() => setShowDatasetDropdown(!showDatasetDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-background hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {activeDataset?.filename || 'Select dataset'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeDataset
                          ? `${activeDataset.row_count.toLocaleString()} rows, ${activeDataset.column_count} columns`
                          : 'Choose a dataset for analysis'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {datasets.length > 1 && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {datasets.length} datasets
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showDatasetDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {showDatasetDropdown && datasets.length > 1 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg overflow-hidden">
                    {datasets.map((dataset) => (
                      <button
                        key={dataset.id}
                        onClick={() => {
                          setSelectedDatasetId(dataset.id)
                          setShowDatasetDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors ${
                          dataset.id === activeDataset?.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">{dataset.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {dataset.row_count.toLocaleString()} rows, {dataset.column_count} columns
                          </p>
                        </div>
                        {dataset.id === activeDataset?.id && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

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
                disabled={loading || !question.trim() || !activeDataset}
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
            {activeDataset && (
              <p className="text-emerald-500 text-sm mt-2">
                Analyzing: {activeDataset.filename} ({activeDataset.row_count.toLocaleString()} rows, {activeDataset.column_count} columns)
                {selectedDatasetId && datasets.length > 1 && ' — selected from dropdown'}
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
