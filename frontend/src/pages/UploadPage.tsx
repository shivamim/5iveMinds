import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, FileSpreadsheet, ArrowLeft, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { uploadDataset } from '@/services/api';

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;
    
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const extension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    if (!validTypes.includes(extension)) {
      setError(`Invalid file type: ${extension}. Please upload CSV or Excel files.`);
      return;
    }
    
    // Validate file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.');
      return;
    }
    
    setError(null);
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    if (file.size === 0) { 
      setError('Selected file is empty. Please pick a valid CSV/XLSX.'); 
      return; 
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const response = await uploadDataset(file);
      const datasetId = response.id || response.dataset_id;
      if (!datasetId) throw new Error('Upload succeeded but no dataset ID returned');
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
          <CardDescription>
            Drop your raw CSV or Excel file below. Our Data Engineer agent will handle 
            schema inference, cleaning, and imputation automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-6 ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'hover:bg-muted/50'
            }`}
            onClick={() => document.getElementById('file-upload')?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input 
              id="file-upload" 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              className="hidden" 
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-16 h-16 text-green-600" />
                <p className="font-semibold text-lg">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-16 h-16 text-muted-foreground" />
                <p className="font-semibold text-lg">
                  {dragOver ? 'Drop file here' : 'Click or drag to upload dataset'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV, XLSX up to 50MB
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Upload Error:</p>
                <p className="text-sm font-mono mt-1 break-words">{error}</p>
              </div>
            </div>
          )}

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" 
            disabled={!file || isUploading} 
            onClick={handleUpload}
          >
            {isUploading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
            {isUploading ? 'Processing & Saving to Database...' : 'Upload & Continue to Question'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
