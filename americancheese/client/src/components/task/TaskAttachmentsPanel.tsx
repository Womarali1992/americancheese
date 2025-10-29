import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, FileText, Download, X, Upload, Image, File, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { getStatusBgColor } from '@/lib/color-utils';

interface TaskAttachment {
  id: number;
  taskId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileContent: string;
  uploadedAt: string;
  notes: string | null;
  type: string;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo: string | null;
  projectId: number;
  completed: boolean;
  category: string;
  tier1Category: string;
  tier2Category: string;
  contactIds: string[] | null;
  materialIds: string[] | null;
  materialsNeeded: string | null;
  templateId: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
}

// Create a schema for attachment upload
const attachmentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().min(1, 'File size must be greater than 0'),
  fileContent: z.string().min(1, 'File content is required'),
  notes: z.string().optional(),
  type: z.string().default('document')
});

type AttachmentFormValues = z.infer<typeof attachmentSchema>;

interface TaskAttachmentsPanelProps {
  task: Task;
  className?: string;
}

export function TaskAttachmentsPanel({ task, className = '' }: TaskAttachmentsPanelProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch attachments for this task
  const { data: attachments = [], isLoading } = useQuery<TaskAttachment[]>({
    queryKey: [`/api/tasks/${task.id}/attachments`]
  });

  // Debug logging
  console.log(`TaskAttachmentsPanel for task ${task.id}: Found ${attachments.length} attachments`, attachments);

  // Set up react-hook-form
  const form = useForm<AttachmentFormValues>({
    defaultValues: {
      fileName: '',
      fileType: '',
      fileSize: 0,
      fileContent: '',
      notes: '',
      type: 'document'
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: AttachmentFormValues) => {
      return apiRequest(`/api/tasks/${task.id}/attachments`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task.id}/attachments`] });
      setUploadDialogOpen(false);
      form.reset();
      setSelectedFile(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/attachments/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task.id}/attachments`] });
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Read the file as base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result?.toString().split(',')[1] || '';
        
        form.setValue('fileName', file.name);
        form.setValue('fileType', file.type || 'application/octet-stream');
        form.setValue('fileSize', file.size);
        form.setValue('fileContent', base64);
        
        // Set type based on file mime type
        const type = file.type.includes('image') ? 'image' : 'document';
        form.setValue('type', type);
      };
    }
  };

  const onSubmit = (values: AttachmentFormValues) => {
    uploadMutation.mutate(values);
  };

  const filteredAttachments = activeTab === 'all' 
    ? attachments 
    : attachments.filter((attachment: TaskAttachment) => attachment.type === activeTab);

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this attachment?')) {
      deleteMutation.mutate(id);
    }
  };

  const getFileIcon = (type: string, fileType: string | undefined) => {
    if (type === 'image') return <Image className="h-6 w-6 text-blue-500" />;
    if (fileType && fileType.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Attachments</h3>
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Attachments ({attachments.length})
        </h3>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <UploadCloud className="h-4 w-4" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Attachment</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <FormLabel>File</FormLabel>
                  <Input 
                    type="file" 
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500">
                      {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                    </p>
                  )}
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add notes about this file..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setUploadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={uploadMutation.isPending || !selectedFile}
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {attachments.length > 0 ? (
        <>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="document">Documents</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-2">
                {filteredAttachments.map((attachment: TaskAttachment) => (
                  <Card key={attachment.id} className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {attachment.fileType?.startsWith('image/') ? (
                        <div 
                          className="w-12 h-12 rounded border overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewImage(`data:${attachment.fileType};base64,${attachment.fileContent}`)}
                        >
                          <img 
                            src={`data:${attachment.fileType};base64,${attachment.fileContent}`}
                            alt={attachment.fileName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        getFileIcon(attachment.type, attachment.fileType)
                      )}
                      <div>
                        <p className="font-medium">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(attachment.uploadedAt).toLocaleDateString()} • 
                          {Math.round(attachment.fileSize / 1024)}KB
                        </p>
                        {attachment.notes && (
                          <p className="text-xs text-gray-700 mt-1">{attachment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => {
                          // Create a data URL and open it
                          const dataUrl = `data:${attachment.fileType};base64,${attachment.fileContent}`;
                          window.open(dataUrl, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDelete(attachment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-md">
          <Paperclip className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No attachments yet</p>
          <p className="text-gray-400 text-sm">Upload documents, images, and other files</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      )}

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 max-h-[70vh] overflow-auto">
            {previewImage && (
              <img 
                src={previewImage} 
                alt="Full size preview"
                className="w-full h-auto rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}