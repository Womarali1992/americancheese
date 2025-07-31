import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";

interface ProjectDescriptionEditorProps {
  project: Project;
  onDescriptionUpdate?: () => void;
}

export function ProjectDescriptionEditor({ 
  project,
  onDescriptionUpdate 
}: ProjectDescriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(project.description || '');
  const { toast } = useToast();

  const updateDescriptionMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      return apiRequest(`/api/projects/${project.id}`, 'PATCH', {
        description: newDescription
      });
    },
    onSuccess: () => {
      // Invalidate and refetch project data
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      setIsEditing(false);
      onDescriptionUpdate?.();
      
      toast({
        title: "Success",
        description: "Project description updated successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Error updating project description:', error);
      toast({
        title: "Error",
        description: "Failed to update project description",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    updateDescriptionMutation.mutate(description);
  };

  const handleCancel = () => {
    setDescription(project.description || '');
    setIsEditing(false);
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">Project Description</h4>
          </div>
          
          <div>
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a description for this project..."
                  className="min-h-[100px] resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateDescriptionMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateDescriptionMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateDescriptionMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600 text-sm leading-relaxed min-h-[60px]">
                  {project.description || 'No description provided. Click edit to add a description for this project.'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Edit className="h-4 w-4" />
                  Edit Description
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}