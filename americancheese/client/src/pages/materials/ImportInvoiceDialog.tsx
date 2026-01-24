import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, FileText, AlertCircle, CheckCircle2, Sparkles, Image, FileImage } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ImportInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
}

interface ImportResult {
  imported: number;
  total: number;
  supplier?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  errors?: string[];
  materials?: any[];
}

export function ImportInvoiceDialog({ open, onOpenChange, projectId }: ImportInvoiceDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Reset state when dialog opens or closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setFile(null);
        setPreview(null);
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

      const response = await fetch(`/api/projects/${projectId}/materials/import-invoice`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to import invoice');
      }
      
      return response.json();
    },
    onMutate: () => {
      setIsUploading(true);
      setError(null);
      
      // Simulate progress - AI processing takes time
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        if (progress >= 85) {
          clearInterval(interval);
        }
        setUploadProgress(progress);
      }, 200);
      
      return () => clearInterval(interval);
    },
    onSuccess: (data) => {
      setUploadProgress(100);
      setUploadResult({
        imported: data.imported,
        total: data.total,
        supplier: data.supplier,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        errors: data.errors,
        materials: data.materials
      });
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'materials'] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      setIsUploading(false);
      setError(error.message || 'Failed to import invoice');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setError(null);
      
      if (droppedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(droppedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = () => {
    if (!file) {
      setError('Please select an invoice file to upload');
      return;
    }
    
    if (!projectId) {
      setError('Project ID is required. Please select a project first.');
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF file.');
      return;
    }
    
    importMutation.mutate(file);
  };

  const getFileIcon = () => {
    if (!file) return <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />;
    if (file.type.startsWith('image/')) return <Image className="mx-auto h-12 w-12 text-primary" />;
    return <FileText className="mx-auto h-12 w-12 text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Import Invoice with AI
          </DialogTitle>
          <DialogDescription>
            Upload an invoice image or PDF and AI will automatically extract materials from it.
          </DialogDescription>
        </DialogHeader>

        {!projectId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Project Required</AlertTitle>
            <AlertDescription>
              Please select a project before importing materials from an invoice.
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
          <div className="space-y-4">
            <Alert variant="default" className={uploadResult.errors && uploadResult.errors.length > 0 ? "border-yellow-600" : "border-green-600"}>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Import Complete</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>Successfully imported {uploadResult.imported} of {uploadResult.total} materials.</p>
                  
                  {(uploadResult.supplier || uploadResult.invoiceNumber || uploadResult.invoiceDate) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {uploadResult.supplier && (
                        <Badge variant="secondary" className="text-xs">
                          Supplier: {uploadResult.supplier}
                        </Badge>
                      )}
                      {uploadResult.invoiceNumber && (
                        <Badge variant="secondary" className="text-xs">
                          Invoice #: {uploadResult.invoiceNumber}
                        </Badge>
                      )}
                      {uploadResult.invoiceDate && (
                        <Badge variant="secondary" className="text-xs">
                          Date: {uploadResult.invoiceDate}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium text-yellow-700">
                        {uploadResult.errors.length} items could not be imported
                      </summary>
                      <ul className="mt-2 text-sm space-y-1 max-h-32 overflow-y-auto text-yellow-600">
                        {uploadResult.errors.map((err, index) => (
                          <li key={index} className="text-xs">{err}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            {uploadResult.materials && uploadResult.materials.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Imported Materials:</h4>
                <div className="space-y-1">
                  {uploadResult.materials.slice(0, 10).map((material, index) => (
                    <div key={index} className="text-xs flex justify-between items-center py-1 border-b border-muted last:border-0">
                      <span className="font-medium truncate flex-1">{material.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {material.quantity} {material.unit} @ ${material.cost?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                  {uploadResult.materials.length > 10 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      ...and {uploadResult.materials.length - 10} more items
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!uploadResult && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isUploading 
                ? 'bg-amber-50/50 border-amber-200' 
                : 'hover:bg-amber-50/30 hover:border-amber-300 cursor-pointer'
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
              accept="image/*,.pdf"
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div className="space-y-4">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-medium text-amber-700">Analyzing invoice...</div>
                  <div className="text-sm text-amber-600">AI is extracting materials from your invoice</div>
                </div>
                <Progress value={uploadProgress} className="h-2 w-full bg-amber-100" />
              </div>
            ) : (
              <>
                {file ? (
                  <div className="space-y-3">
                    {preview ? (
                      <div className="relative mx-auto max-w-[200px] max-h-[200px] overflow-hidden rounded-lg border shadow-sm">
                        <img 
                          src={preview} 
                          alt="Invoice preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      getFileIcon()
                    )}
                    <div className="text-lg font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]?.toUpperCase() || 'File'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click upload to analyze with AI
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <FileImage className="h-8 w-8 text-amber-600" />
                      <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500" />
                    </div>
                    <div className="text-lg font-medium">Upload an invoice</div>
                    <div className="text-sm text-muted-foreground">
                      Drag and drop or click to browse
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-normal">JPEG</Badge>
                      <Badge variant="outline" className="font-normal">PNG</Badge>
                      <Badge variant="outline" className="font-normal">GIF</Badge>
                      <Badge variant="outline" className="font-normal">WebP</Badge>
                      <Badge variant="outline" className="font-normal">PDF</Badge>
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
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze with AI
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


