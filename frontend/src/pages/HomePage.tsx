import { useNavigate } from 'react-router-dom';
import { Upload, BrainCircuit, Sparkles, ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Production-Grade Multi-Agent AI Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          From Raw CSV to <span className="text-blue-600">Executive Strategy</span><br/>in 30 Seconds.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Upload your data, ask complex business questions, and let 5 specialized AI agents handle data engineering, ML, statistics, and strategic insights instantly.
        </p>
        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 shadow-lg shadow-blue-600/20"
          onClick={() => navigate('/upload')}
        >
          Start New Analysis <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>

      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6 text-center">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">1. Upload Data</h3>
              <p className="text-muted-foreground">Drop your CSV or Excel file. Our Data Engineer agent instantly cleans and prepares it.</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6 text-center">
              <BrainCircuit className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">2. Ask Anything</h3>
              <p className="text-muted-foreground">Define your business goal in plain English. The Strategist and ML Engineer agents get to work.</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6 text-center">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">3. Get Insights</h3>
              <p className="text-muted-foreground">Receive boardroom-ready reports, charts, and actionable ROI projections in seconds.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
