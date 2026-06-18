import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { uploadDataset } from '@/services/api';

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const response = await uploadDataset(file);
      const datasetId = response.id || response.dataset_id;
      localStorage.setItem('lastDatasetId', datasetId);
      navigate('/ask');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
      </Button>
      
      <Card className="border-2 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Step 1: Upload Your Dataset</CardTitle>
          <CardDescription>Drop your raw CSV or Excel file below. Our Data Engineer agent will handle schema inference, cleaning, and imputation automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors mb-6"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              id="file-upload" type="file" accept=".csv,.xlsx,.xls" className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-16 h-16 text-green-600" />
                <p className="font-semibold text-lg">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-16 h-16 text-muted-foreground" />
                <p className="font-semibold text-lg">Click to upload dataset</p>
                <p className="text-sm text-muted-foreground">Supports CSV, XLSX up to 50MB</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" 
            disabled={!file || isUploading} onClick={handleUpload}
          >
            {isUploading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
            {isUploading ? 'Processing & Cleaning Data...' : 'Upload & Continue to Question'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
