import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Loader2, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { startPipeline } from '@/services/api';

export function AskPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q) { setError('Please provide a business question.'); return; }
    // Enforce backend min_length=10
    if (q.length < 10) { setError('Question must be at least 10 characters.'); return; }

    const datasetId = localStorage.getItem('lastDatasetId');
    if (!datasetId) { setError('No dataset found. Please upload a file first.'); return; }

    setIsProcessing(true);
    setError(null);

    try {
      // Send business_question to match backend Pydantic schema
      const pipelineResponse = await startPipeline({
        dataset_id: datasetId,
        business_question: q,
      });
      
      const runId = pipelineResponse.id || (pipelineResponse as any).run_id;
      if (!runId) throw new Error('Backend did not return a run ID');
      
      localStorage.setItem('lastRunId', runId);
      navigate(`/dashboard?run=${runId}`);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to start pipeline');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/upload')}>
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Upload
      </Button>
      
      <Card className="border-2 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Step 2: Ask Your Business Question</CardTitle>
          <CardDescription>
            Data successfully processed! What strategic insights, ML predictions, or ROI analyses do you want our agents to uncover?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="e.g., Identify the top 3 factors driving customer churn and project the ROI of a retention campaign... (min 10 characters)"
            className="min-h-[150px] text-lg mb-6" 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button variant="outline" onClick={() => setQuestion('Predict customer churn for the next quarter and identify key risk factors.')}>
              <Sparkles className="mr-2 w-4 h-4" /> Predict Churn
            </Button>
            <Button variant="outline" onClick={() => setQuestion('Analyze sales trends and recommend inventory optimization strategies.')}>
              <Sparkles className="mr-2 w-4 h-4" /> Sales Strategy
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Pipeline Error:</p>
                <p className="text-sm font-mono mt-1 break-words">{error}</p>
              </div>
            </div>
          )}

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" 
            disabled={!question.trim() || isProcessing} 
            onClick={handleSubmit}
          >
            {isProcessing ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : <BrainCircuit className="mr-2 w-5 h-5" />}
            {isProcessing ? 'Initializing 5-Agent Pipeline...' : 'Run Full Analysis Pipeline'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
