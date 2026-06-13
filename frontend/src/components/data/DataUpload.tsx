import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { datasetApi } from '@/lib/api'
import { useStore } from '@/stores/appStore'
import { Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

export function DataUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploaded, setUploaded] = useState<{ id: string; name: string } | null>(null)
  const addDataset = useStore((s) => s.addDataset)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(interval)
          return 90
        }
        return p + 10
      })
    }, 200)

    try {
      const response = await datasetApi.upload(file)
      clearInterval(interval)
      setProgress(100)
      setUploaded({ id: response.data.id, name: file.name })
      addDataset(response.data)
    } catch (error) {
      console.error('Upload failed:', error)
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }, [addDataset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/octet-stream': ['.parquet'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  })

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          {!uploaded ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center gap-4 rounded-lg p-8 transition-colors cursor-pointer ${
                  isDragActive ? 'bg-primary/10 border-primary' : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <input {...getInputProps()} />
                <div className="p-4 rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your dataset'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse (CSV, Excel, Parquet up to 50MB)
                  </p>
                </div>
              </div>

              {uploading && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">Uploading... {progress}%</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-500/10">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">{uploaded.name}</p>
                  <p className="text-sm text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Upload complete
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setUploaded(null)
                  setProgress(0)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
