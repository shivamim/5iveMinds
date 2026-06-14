import { useCallback, useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { datasetApi } from '@/lib/api'
import { useStore } from '@/stores/appStore'
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from 'lucide-react'

interface DataUploadProps {
  onUploadComplete?: (dataset: { id: string; filename: string; row_count: number; column_count: number; file_size_bytes: number }) => void
}

interface UploadResponse {
  id: string
  filename: string
  row_count: number
  column_count: number
  file_size_bytes: number
  uploaded_at?: string
}

export function DataUpload({ onUploadComplete }: DataUploadProps = {}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploaded, setUploaded] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const addDataset = useStore((s) => s.addDataset)

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploading(true)
      setProgress(0)
      setError(null)
      setUploaded(null)

      try {
        const response = await datasetApi.upload(file, (percent: number) => {
          setProgress(percent)
        })

        const data = response.data as UploadResponse

        const dataset = {
          id: data.id,
          filename: data.filename,
          file_size_bytes: data.file_size_bytes,
          row_count: data.row_count,
          column_count: data.column_count,
          uploaded_at: data.uploaded_at || new Date().toISOString(),
        }

        setUploaded({ id: data.id, name: data.filename })
        addDataset(dataset)

        if (onUploadComplete) {
          onUploadComplete(dataset)
        }

        setProgress(100)
      } catch (err: any) {
        console.error('Upload failed:', err)

        let errorMessage = 'Upload failed. Please try again.'

        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          errorMessage = 'Upload was cancelled.'
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Upload timed out. The file may be too large or the server is unreachable.'
        } else if (err.response) {
          const status = err.response.status
          const detail = err.response.data?.detail || err.response.data?.message

          if (status === 413) {
            errorMessage = 'File too large. Maximum size is 50MB.'
          } else if (status === 401) {
            errorMessage = 'Authentication required. Please log in.'
          } else if (status === 403) {
            errorMessage = 'Access denied. Check your permissions.'
          } else if (detail) {
            errorMessage = `Server error: ${detail}`
          } else {
            errorMessage = `Server error (${status}). Please try again.`
          }
        } else if (err.request) {
          errorMessage = 'Cannot connect to server. Please check your internet connection and ensure the backend API URL is configured correctly in your environment variables (VITE_API_URL).'
        }

        setError(errorMessage)
        setProgress(0)
      } finally {
        setUploading(false)
        abortControllerRef.current = null
      }
    },
    [addDataset, onUploadComplete]
  )

  const handleRemove = () => {
    setUploaded(null)
    setError(null)
    setProgress(0)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  })

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!uploaded && !error && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200
                ${isDragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
                }
                ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`
                  p-4 rounded-full transition-colors
                  ${isDragActive ? 'bg-primary/10' : 'bg-muted'}
                `}>
                  <Upload className={`
                    h-8 w-8 transition-colors
                    ${isDragActive ? 'text-primary' : 'text-muted-foreground'}
                  `} />
                </div>
                <div>
                  <p className="font-medium">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your CSV file'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse. Supports CSV, Excel (.xlsx, .xls) up to 50MB
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {uploading && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                      <span className="font-medium">Uploading...</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {uploaded && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium">{uploaded.name}</p>
                      <p className="text-sm text-muted-foreground">Uploaded successfully</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemove}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-500">Upload Failed</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemove}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
