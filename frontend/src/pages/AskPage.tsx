import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
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
    if (!question.trim()) { setError('Please provide a business question.'); return; }

    const datasetId = localStorage.getItem('lastDatasetId');
    if (!datasetId) { setError('No dataset found. Please upload a file first.'); return; }

    setIsProcessing(true);
    setError(null);

    try {
      const pipelineResponse = await startPipeline({ dataset_id: datasetId, goal: question, query: question } as any);
      const runId = pipelineResponse.id || pipelineResponse.run_id;
      localStorage.setItem('lastRunId', runId);
      navigate(`/dashboard?run=${runId}`);
    } catch (err) {
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
          <CardDescription>Data successfully processed! What strategic insights, ML predictions, or ROI analyses do you want our agents to uncover?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="e.g., Identify the top 3 factors driving customer churn and project the ROI of a retention campaign..."
            className="min-h-[150px] text-lg mb-6" value={question} onChange={(e) => setQuestion(e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button variant="outline" onClick={() => setQuestion('Predict customer churn for the next quarter and identify key risk factors.')}>
              <Sparkles className="mr-2 w-4 h-4" /> Predict Churn
            </Button>
            <Button variant="outline" onClick={() => setQuestion('Analyze sales trends and recommend inventory optimization strategies.')}>
              <Sparkles className="mr-2 w-4 h-4" /> Sales Strategy
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" 
            disabled={!question.trim() || isProcessing} onClick={handleSubmit}
          >
            {isProcessing ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : <BrainCircuit className="mr-2 w-5 h-5" />}
            {isProcessing ? 'Initializing 5-Agent Pipeline...' : 'Run Full Analysis Pipeline'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
