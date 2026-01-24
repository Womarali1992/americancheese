import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SquarePen, Save, X, FileCode2, ChevronDown } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ContextEditor } from "@/components/context/ContextEditor";
import type { ContextData } from "@shared/context-types";

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
  const [contextOpen, setContextOpen] = useState(false);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const { toast } = useToast();

  // Fetch project context
  const { data: projectContext } = useQuery({
    queryKey: ['/api/projects', project?.id, 'context'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project?.id}/context`);
      if (!response.ok) throw new Error('Failed to fetch project context');
      return response.json();
    },
    enabled: !!project?.id,
  });

  // Update local state when context is loaded
  useEffect(() => {
    if (projectContext?.context) {
      setContextData(projectContext.context);
    }
  }, [projectContext]);

  // Save context mutation
  const updateContextMutation = useMutation({
    mutationFn: async (context: ContextData) => {
      return apiRequest(`/api/projects/${project.id}/context`, 'PUT', { context });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project.id, 'context'] });
      toast({
        title: "Success",
        description: "AI Context saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save AI Context",
        variant: "destructive",
      });
    },
  });

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
    <div className="bg-green-50 rounded-lg shadow-sm shadow-green-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 gap-3">
        <div className="flex items-start sm:items-center gap-2 flex-1">
          <div className="h-full w-1 rounded-full bg-green-500 mr-2 self-stretch hidden sm:block"></div>
          <div className="w-1 h-12 rounded-full bg-green-500 mr-2 self-start block sm:hidden"></div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 leading-tight">Project Description</h3>
            <div className="mt-2">
              <div className="space-y-3">
                <div>
                    {isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Enter a description for this project..."
                          className="min-h-[100px] resize-none border-slate-200 focus:border-green-500 focus:ring-green-500"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={updateDescriptionMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
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
                        <button className="justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-slate-200 bg-white text-slate-700 hover:text-slate-900 h-9 rounded-md px-3 text-xs flex items-center gap-1 hover:bg-green-50 hover:border-green-300"
                          onClick={() => setIsEditing(true)}
                        >
                          <SquarePen className="h-4 w-4" />
                          Edit Description
                        </button>
                      </div>
                    )}
                </div>

                {/* AI Context Section */}
                <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 mt-3 rounded-md border border-dashed border-slate-300 hover:border-green-400 hover:bg-green-50/50 transition-colors">
                    <FileCode2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">AI Context</span>
                    {contextData && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        Configured
                      </Badge>
                    )}
                    <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${contextOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="border rounded-md p-3 bg-white">
                      <ContextEditor
                        entityId={project.id}
                        entityType="project"
                        initialContext={contextData || undefined}
                        onChange={(context) => {
                          setContextData(context);
                          updateContextMutation.mutate(context);
                        }}
                        compact
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
