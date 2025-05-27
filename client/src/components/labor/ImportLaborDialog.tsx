import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportLaborDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
}

interface UploadResult {
  imported: number;
  total: number;
  errors: string[];
}

export default function ImportLaborDialog({ 
  open, 
  onOpenChange, 
  projectId 
}: ImportLaborDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setFile(null);
        setError(null);
        setUploadResult(null);
        setUploadProgress(0);
        setIsUploading(false);
      }, 300);
    }
  }, [open]);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Get the auth token from cookies
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('cm-app-auth-token='))
        ?.split('=')[1];
      
      const response = await fetch('/api/labor/import-csv', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken || ''}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to import labor records');
      }
      
      return response.json();
    },
    onMutate: () => {
      setIsUploading(true);
      setError(null);
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress >= 90) {
          clearInterval(interval);
        }
        setUploadProgress(progress);
      }, 100);
      
      return () => clearInterval(interval);
    },
    onSuccess: (data) => {
      setUploadProgress(100);
      setUploadResult({
        imported: data.imported,
        total: data.total,
        errors: data.errors
      });
      
      // Invalidate labor queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/labor'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.imported} of ${data.total} labor records`,
      });
      
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      setIsUploading(false);
      setError(error.message || 'Failed to import labor records');
      
      toast({
        title: "Import Failed",
        description: error.message || 'Failed to import labor records',
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = () => {
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are supported');
      return;
    }
    
    importMutation.mutate(file);
  };

  const downloadTemplate = () => {
    // Create CSV template with sample data
    const csvTemplate = `fullName,company,tier1Category,tier2Category,phone,email,projectId,taskId,contactId,taskDescription,areaOfWork,startDate,endDate,startTime,endTime,totalHours,laborCost,unitsCompleted,status
John Smith,ABC Construction,structural,framing,555-0123,john@abcconstruction.com,1,101,1,Install wall framing,Living Room,2024-01-15,2024-01-15,08:00,17:00,8,640.00,150 sq ft,completed
Jane Doe,XYZ Contractors,systems,electrical,555-0456,jane@xyzcontractors.com,1,102,2,Install electrical outlets,Kitchen,2024-01-16,2024-01-16,09:00,15:00,6,480.00,12 outlets,in_progress`;

    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'labor_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Labor Records from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with labor data to bulk import multiple labor records at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">Need a template?</div>
                <div className="text-sm text-blue-700">Download our CSV template with sample data</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadTemplate}
              className="bg-white hover:bg-blue-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <Alert variant={uploadResult.errors.length > 0 ? "destructive" : "default"}>
              {uploadResult.errors.length > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    Successfully imported {uploadResult.imported} of {uploadResult.total} labor records
                  </div>
                  {uploadResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-medium">Errors:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {uploadResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <li>... and {uploadResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* File Upload Area */}
          {!uploadResult && (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                isUploading ? 'bg-background/50 border-primary/20' : 'hover:bg-accent hover:border-primary/50 cursor-pointer'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".csv"
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <div className="text-lg font-medium">Uploading...</div>
                  <Progress value={uploadProgress} className="h-2 w-full" />
                </div>
              ) : (
                <>
                  {file ? (
                    <div className="space-y-2">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-primary" />
                      <div className="text-lg font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • CSV
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="text-lg font-medium">Choose a CSV file</div>
                      <div className="text-sm text-muted-foreground">
                        Drag and drop or click to browse
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Expected Format Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium mb-2">Expected CSV Format:</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Required columns: fullName, company, tier1Category, tier2Category, projectId, startDate, endDate</div>
              <div>Optional columns: phone, email, taskId, contactId, taskDescription, areaOfWork, startTime, endTime, totalHours, laborCost, unitsCompleted, status</div>
              <div>Tier1 categories: structural, systems, sheathing, finishings</div>
              <div>Date format: YYYY-MM-DD, Time format: HH:MM</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {file && !uploadResult && (
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Import Labor Records'}
              </Button>
            )}
            {uploadResult && (
              <Button onClick={() => onOpenChange(false)}>
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}