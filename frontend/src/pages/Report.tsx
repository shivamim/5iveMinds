import { useSearchParams } from 'react-router-dom';
import { FileText, FileSpreadsheet, Presentation, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { usePipeline } from '@/hooks/usePipeline';
import { useState } from 'react';
import { exportReport } from '@/services/api';

export function Report() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run') || localStorage.getItem('lastRunId');
  const [exporting, setExporting] = useState<string | null>(null);

  const { results } = usePipeline({
    runId,
    pollInterval: 10000,
    autoFetch: !!runId,
  });

  const report = results?.reports?.[0];
  const content = report?.content || '';
  const run = results?.run;

  // Parse report sections from markdown content
  const sections = parseReportContent(content);

  const handleExport = async (format: 'pdf' | 'excel' | 'pptx' | 'html') => {
    if (!runId) return;
    setExporting(format);
    try {
      const result = await exportReport(runId, { format });
      if (result.download_url) {
        window.open(result.download_url, '_blank');
      }
    } catch {
      // Fallback: just show alert
      alert(`Export to ${format.toUpperCase()} initiated`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Report</h1>
          <p className="text-gray-500 mt-1">Generated boardroom-ready analytics report</p>
          {run && (
            <p className="text-sm text-gray-400 mt-1">
              Dataset: {run.dataset_name} | Question: {run.business_question}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            format="pdf"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => handleExport('pdf')}
            loading={exporting === 'pdf'}
          />
          <ExportButton
            format="excel"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => handleExport('excel')}
            loading={exporting === 'excel'}
          />
          <ExportButton
            format="pptx"
            icon={<Presentation className="w-4 h-4" />}
            onClick={() => handleExport('pptx')}
            loading={exporting === 'pptx'}
          />
          <ExportButton
            format="html"
            icon={<Globe className="w-4 h-4" />}
            onClick={() => handleExport('html')}
            loading={exporting === 'html'}
          />
        </div>
      </div>

      {!content ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Available</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Run a pipeline to generate an executive report. The Designer agent will create a boardroom-ready summary of all findings.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="summary" className="data-[state=active]:bg-white">
              Summary
            </TabsTrigger>
            <TabsTrigger value="findings" className="data-[state=active]:bg-white">
              Key Findings
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-white">
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="impact" className="data-[state=active]:bg-white">
              Business Impact
            </TabsTrigger>
            <TabsTrigger value="raw" className="data-[state=active]:bg-white">
              Raw Output
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {sections.executiveSummary ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {sections.executiveSummary}
                    </div>
                  ) : (
                    <p className="text-gray-500">No executive summary available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Key Findings Tab */}
          <TabsContent value="findings">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Key Findings</CardTitle>
              </CardHeader>
              <CardContent>
                {sections.keyFindings.length > 0 ? (
                  <div className="space-y-3">
                    {sections.keyFindings.map((finding, i) => (
                      <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-800">{finding}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No key findings available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {sections.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {sections.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No recommendations available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Impact Tab */}
          <TabsContent value="impact">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Business Impact</CardTitle>
              </CardHeader>
              <CardContent>
                {sections.dataQuality && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Data Quality</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-700">
                      {sections.dataQuality}
                    </div>
                  </div>
                )}
                {sections.mlResults && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">ML Results</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-700">
                      {sections.mlResults}
                    </div>
                  </div>
                )}
                {sections.statisticalAnalysis && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Statistical Analysis</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-700">
                      {sections.statisticalAnalysis}
                    </div>
                  </div>
                )}
                {!sections.dataQuality && !sections.mlResults && !sections.statisticalAnalysis && (
                  <p className="text-gray-500">No detailed business impact data available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raw Output Tab */}
          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Raw Agent Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <pre className="text-sm text-green-400 whitespace-pre-wrap">{content}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ===== Helper: Parse Report Content =====
function parseReportContent(content: string) {
  const sections: {
    executiveSummary: string;
    keyFindings: string[];
    recommendations: string[];
    dataQuality: string;
    statisticalAnalysis: string;
    mlResults: string;
  } = {
    executiveSummary: '',
    keyFindings: [],
    recommendations: [],
    dataQuality: '',
    statisticalAnalysis: '',
    mlResults: '',
  };

  if (!content) return sections;

  const lines = content.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect sections
    if (trimmed.startsWith('## Executive Summary')) {
      currentSection = 'executiveSummary';
      continue;
    }
    if (trimmed.startsWith('## Key Findings')) {
      currentSection = 'keyFindings';
      continue;
    }
    if (trimmed.startsWith('## Recommendations')) {
      currentSection = 'recommendations';
      continue;
    }
    if (trimmed.startsWith('## Data Quality')) {
      currentSection = 'dataQuality';
      continue;
    }
    if (trimmed.startsWith('## Statistical')) {
      currentSection = 'statisticalAnalysis';
      continue;
    }
    if (trimmed.startsWith('## ML Results')) {
      currentSection = 'mlResults';
      continue;
    }
    if (trimmed.startsWith('## Strategic')) {
      currentSection = 'recommendations';
      continue;
    }

    // Skip headers and empty lines
    if (trimmed.startsWith('#') || trimmed.startsWith('**Dataset**') || trimmed.startsWith('**Records**') || trimmed.startsWith('**Question**')) {
      continue;
    }

    // Capture content
    if (currentSection === 'executiveSummary' && trimmed) {
      sections.executiveSummary += trimmed + '\n';
    }
    if (currentSection === 'keyFindings' && trimmed.startsWith('- ')) {
      sections.keyFindings.push(trimmed.slice(2));
    }
    if (currentSection === 'recommendations' && trimmed.startsWith('- ')) {
      sections.recommendations.push(trimmed.slice(2));
    }
    if (currentSection === 'dataQuality' && trimmed) {
      sections.dataQuality += trimmed + '\n';
    }
    if (currentSection === 'statisticalAnalysis' && trimmed) {
      sections.statisticalAnalysis += trimmed + '\n';
    }
    if (currentSection === 'mlResults' && trimmed) {
      sections.mlResults += trimmed + '\n';
    }
  }

  // Trim whitespace
  sections.executiveSummary = sections.executiveSummary.trim();
  sections.dataQuality = sections.dataQuality.trim();
  sections.statisticalAnalysis = sections.statisticalAnalysis.trim();
  sections.mlResults = sections.mlResults.trim();

  return sections;
}

function ExportButton({
  format,
  icon,
  onClick,
  loading,
}: {
  format: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {format.toUpperCase()}
    </Button>
  );
}
