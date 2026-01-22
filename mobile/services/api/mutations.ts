import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { InsertProject, Project } from "@/shared/types";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertProject) =>
      apiClient.post<Project>("/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
