import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, BrainCircuit, Loader2, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { uploadDataset, startPipeline } from '@/services/api';

export function HomePage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !question.trim()) {
      setError('Please provide both a dataset and a business question.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const uploadResponse = await uploadDataset(file);
      const datasetId = uploadResponse.id || uploadResponse.dataset_id; 
      localStorage.setItem('lastDatasetId', datasetId);

      const pipelineResponse = await startPipeline({
        dataset_id: datasetId,
        goal: question,
        query: question 
      } as any);

      const runId = pipelineResponse.id || pipelineResponse.run_id;
      localStorage.setItem('lastRunId', runId);

      navigate(`/dashboard?run=${runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during execution.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200">
            <BrainCircuit className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            FiveMinds AI Intelligence
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your raw data, ask complex business questions, and let our multi-agent AI system handle data engineering, analysis, and strategy instantly.
          </p>
        </div>

        <Card className="shadow-lg border-gray-200">
          <CardHeader>
            <CardTitle>Start New Analysis</CardTitle>
            <CardDescription>Upload your CSV/Excel file and define your objective.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer 
                  ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload" 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex flex-col items-center space-y-2">
                    <FileSpreadsheet className="w-10 h-10 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-900">{file.name}</p>
                    <p className="text-xs text-blue-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100">
                      <Upload className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Click to upload dataset</p>
                      <p className="text-xs text-gray-500 mt-1">Supports CSV, XLSX up to 50MB</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">What do you want to know from this data?</label>
                <Textarea 
                  placeholder="e.g., Analyze the sales trends over the last year and predict next quarter's revenue..."
                  className="min-h-[120px] resize-none focus-visible:ring-blue-500"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium shadow-md transition-all hover:shadow-lg" 
                disabled={isProcessing || !file || !question.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Initializing AI Agents...
                  </>
                ) : (
                  <>
                    Run Intelligence Pipeline
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
