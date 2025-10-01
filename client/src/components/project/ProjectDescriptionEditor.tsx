import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SquarePen, Save, X } from "lucide-react";
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
    <div className="overflow-y-auto overflow-x-hidden w-full p-4">
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
              <button className="justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-slate-200 bg-white text-slate-700 hover:text-slate-900 h-9 rounded-md px-3 text-xs flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => setIsEditing(true)}
              >
                <SquarePen className="h-4 w-4" />
                Edit Description
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}