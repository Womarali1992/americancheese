import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";

interface ImportMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
}

export function ImportMaterialsDialog({ open, onOpenChange, projectId }: ImportMaterialsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    imported: number;
    total: number;
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Reset state when dialog opens or closes
  React.useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setTimeout(() => {
        setFile(null);
        setError(null);
        setUploadResult(null);
        setUploadProgress(0);
      }, 300);
    }
  }, [open]);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/projects/${projectId}/materials/import-csv`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to import materials');
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
      
      // Invalidate materials queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'materials'] });
      }
      
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      setIsUploading(false);
      setError(error.message || 'Failed to import materials');
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
    
    if (!projectId) {
      setError('Project ID is required. Please select a project first.');
      return;
    }
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are supported');
      return;
    }
    
    importMutation.mutate(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Materials from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with material data to bulk import multiple materials at once.
          </DialogDescription>
        </DialogHeader>

        {!projectId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Project Required</AlertTitle>
            <AlertDescription>
              Please select a project before importing materials.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadResult && (
          <Alert variant="default" className={uploadResult.errors && uploadResult.errors.length > 0 ? "border-yellow-600 text-yellow-600" : "border-green-600 text-green-600"}>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Upload Complete</AlertTitle>
            <AlertDescription>
              Successfully imported {uploadResult.imported} of {uploadResult.total} materials.
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-2">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">
                      {uploadResult.errors.length} errors occurred
                    </summary>
                    <ul className="mt-2 text-sm space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.errors.map((err, index) => (
                        <li key={index} className="text-xs">{err}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

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

        <DialogFooter className="flex gap-2 items-center justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            {uploadResult ? 'Close' : 'Cancel'}
          </Button>
          
          {!uploadResult && !isUploading && (
            <Button 
              onClick={handleUpload} 
              disabled={!file || !projectId || isUploading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Materials
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}