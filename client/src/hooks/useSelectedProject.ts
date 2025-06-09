import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SelectedProjectResponse {
  selectedProjectId: number | null;
}

interface SetSelectedProjectResponse {
  success: boolean;
  selectedProjectId: number | null;
  message: string;
}

export function useSelectedProject() {
  const queryClient = useQueryClient();
  
  // Query to get the currently selected project from session
  const { data: sessionData, isLoading } = useQuery<SelectedProjectResponse>({
    queryKey: ["/api/session/selected-project"],
    retry: false,
  });

  // Mutation to update the selected project in session
  const updateSelectedProjectMutation = useMutation({
    mutationFn: async (projectId: number | null) => {
      return await apiRequest("/api/session/selected-project", {
        method: "POST",
        body: { projectId },
      }) as SetSelectedProjectResponse;
    },
    onSuccess: () => {
      // Invalidate the session query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/session/selected-project"] });
    },
  });

  const selectedProjectId = sessionData?.selectedProjectId || null;

  const setSelectedProject = (projectId: number | null) => {
    updateSelectedProjectMutation.mutate(projectId);
  };

  return {
    selectedProjectId,
    setSelectedProject,
    isLoading,
    isUpdating: updateSelectedProjectMutation.isPending,
  };
}