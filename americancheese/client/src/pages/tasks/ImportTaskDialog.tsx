import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, FileCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImportTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: number;
  defaultTaskId?: number; // For CSV update mode - update existing task
}

interface ImportResult {
  success: boolean;
  message: string;
  taskId?: number;
  imported?: {
    subtasks?: number;
    subtasksUpdated?: number;
    subtasksCreated?: number;
    contacts?: number;
    materials?: number;
    laborEntries?: number;
  };
}

type FileType = 'xml' | 'csv' | null;

export function ImportTaskDialog({ open, onOpenChange, defaultProjectId, defaultTaskId }: ImportTaskDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>(null);
  const [projectId, setProjectId] = useState<string>(defaultProjectId?.toString() || '');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for selection
  const [projects, setProjects] = useState<any[]>([]);
  React.useEffect(() => {
    if (open) {
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => setProjects(data))
        .catch(err => console.error('Failed to fetch projects:', err));
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isXML = file.type === 'text/xml' || file.name.endsWith('.xml');
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');

      if (isXML) {
        setSelectedFile(file);
        setFileType('xml');
        setImportResult(null);
      } else if (isCSV) {
        setSelectedFile(file);
        setFileType('csv');
        setImportResult(null);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an XML or CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !fileType) {
      toast({
        title: "No File Selected",
        description: "Please select an XML or CSV file to import",
        variant: "destructive",
      });
      return;
    }

    // For new tasks (XML or CSV without defaultTaskId), require project selection
    if (!projectId && !defaultTaskId) {
      toast({
        title: "No Project Selected",
        description: "Please select a target project for the imported task",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (projectId) {
        formData.append('projectId', projectId);
      }
      if (defaultTaskId && fileType === 'csv') {
        formData.append('taskId', defaultTaskId.toString());
      }

      // Choose endpoint based on file type
      const endpoint = fileType === 'csv' ? '/api/tasks/import-csv' : '/api/tasks/import';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setImportResult(result);
        toast({
          title: "Import Successful",
          description: result.message || "Task imported successfully",
        });

        // Invalidate queries to refresh the task list
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: ['/api/projects', parseInt(projectId), 'tasks'] });
        }
        if (result.taskId) {
          queryClient.invalidateQueries({ queryKey: [`/api/tasks/${result.taskId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/tasks/${result.taskId}/subtasks`] });
        }

        // Reset file selection after successful import
        setSelectedFile(null);
        setFileType(null);
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import task",
        variant: "destructive",
      });
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "Import failed"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null);
      setFileType(null);
      setImportResult(null);
      onOpenChange(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-5 w-5 text-slate-400" />;
    if (fileType === 'csv') return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    return <FileCode className="h-5 w-5 text-blue-600" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Import Task
          </DialogTitle>
          <DialogDescription>
            Upload a file to import task data. Supports XML (full data) or CSV (spreadsheet format for bulk editing).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Selection - only show if no defaultTaskId (update mode) */}
          {!defaultTaskId && (
            <div className="space-y-2">
              <Label htmlFor="project">Target Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Import File</Label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="file-upload"
                className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {selectedFile ? (
                    <>
                      {getFileIcon()}
                      <span className="text-sm text-slate-700 font-medium">{selectedFile.name}</span>
                      {fileType && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          fileType === 'csv' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {fileType.toUpperCase()}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-slate-400" />
                      <span className="text-sm text-slate-500">Click to select XML or CSV file</span>
                    </>
                  )}
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xml,text/xml,.csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>XML:</strong> Full export with all data (subtasks, comments, materials, labor)</p>
              <p><strong>CSV:</strong> Spreadsheet format - edit in Excel/Sheets, then re-import</p>
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div
              className={`p-4 rounded-lg border ${
                importResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      importResult.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      importResult.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {importResult.message}
                  </p>
                  {importResult.success && importResult.imported && (
                    <div className="mt-2 text-xs text-green-600 space-y-1">
                      {importResult.imported.subtasks !== undefined && (
                        <p>• {importResult.imported.subtasks} subtasks imported</p>
                      )}
                      {importResult.imported.subtasksCreated !== undefined && (
                        <p>• {importResult.imported.subtasksCreated} new subtasks created</p>
                      )}
                      {importResult.imported.subtasksUpdated !== undefined && (
                        <p>• {importResult.imported.subtasksUpdated} subtasks updated</p>
                      )}
                      {importResult.imported.contacts !== undefined && (
                        <p>• {importResult.imported.contacts} contacts imported</p>
                      )}
                      {importResult.imported.materials !== undefined && (
                        <p>• {importResult.imported.materials} materials imported</p>
                      )}
                      {importResult.imported.laborEntries !== undefined && (
                        <p>• {importResult.imported.laborEntries} labor entries imported</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            {importResult?.success ? 'Close' : 'Cancel'}
          </Button>
          {!importResult?.success && (
            <Button
              onClick={handleImport}
              disabled={!selectedFile || (!projectId && !defaultTaskId) || isImporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {fileType === 'csv' ? 'CSV' : fileType === 'xml' ? 'XML' : 'Task'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
