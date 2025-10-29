import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface ImportQuotesDialogProps {
  supplierId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportQuotesDialog({ supplierId, open, onOpenChange }: ImportQuotesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: boolean;
    message: string;
    imported?: number;
    total?: number;
    errors?: string[];
    materials?: any[];
  } | null>(null);
  
  const { toast } = useToast();
  
  // Get all projects to select one
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  }) as { data: any[] };
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  // Get info about the supplier
  const { data: supplier = {} } = useQuery({
    queryKey: ["/api/contacts", supplierId],
  }) as { data: any };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      // Reset previous results when a new file is selected
      setUploadResults(null);
    }
  };
  
  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a CSV file first",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    setUploadResults(null);
    
    try {
      // Create FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('supplierId', String(supplierId));
      formData.append('isQuote', 'true'); // Mark as quotes
      
      // Upload the file
      const response = await fetch(`/api/projects/${selectedProjectId}/quotes/import-csv`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setUploadResults({
          success: true,
          message: result.message,
          imported: result.imported,
          total: result.total,
          errors: result.errors,
          materials: result.materials,
        });
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
        
        toast({
          title: "Success",
          description: `Successfully imported ${result.imported} of ${result.total} materials as quotes`,
        });
      } else {
        setUploadResults({
          success: false,
          message: result.message || "Failed to import quotes",
          errors: result.errors,
        });
        
        toast({
          title: "Error",
          description: result.message || "Failed to import quotes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing quotes:", error);
      setUploadResults({
        success: false,
        message: "An error occurred while importing quotes",
      });
      
      toast({
        title: "Error",
        description: "An error occurred while importing quotes",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleClose = () => {
    // Reset state when closing the dialog
    setFile(null);
    setUploadResults(null);
    setUploading(false);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import Quote Materials</DialogTitle>
          <DialogDescription>
            Upload a CSV file with materials from {supplier?.name || "supplier"}.
            Each row will be imported as a quote from this supplier.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>1. Select Project</Label>
            <select 
              className="w-full p-2 border rounded-md"
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(parseInt(e.target.value) || null)}
            >
              <option value="">Select a project</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>2. Select CSV File</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-4">
                Expected format: Material Name, Quantity, Unit, Cost per Unit, Type, Category, etc.
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="max-w-xs"
              />
              {file && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  Selected file: {file.name}
                </p>
              )}
            </div>
          </div>
          
          {uploadResults && (
            <Alert variant={uploadResults.success ? "default" : "destructive"}>
              {uploadResults.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {uploadResults.success ? "Import Successful" : "Import Failed"}
              </AlertTitle>
              <AlertDescription>
                {uploadResults.message}
                {uploadResults.imported && uploadResults.total && (
                  <p>
                    Imported {uploadResults.imported} of {uploadResults.total} materials.
                  </p>
                )}
                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc pl-5 text-sm">
                      {uploadResults.errors.slice(0, 3).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {uploadResults.errors.length > 3 && (
                        <li>...and {uploadResults.errors.length - 3} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || !selectedProjectId || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Quotes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}