import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreateLaborDialog } from "@/pages/labor/CreateLaborDialog";
import { useToast } from "@/hooks/use-toast";

interface AddLaborFromContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: number;
}

interface Project {
  id: number;
  name: string;
  location: string;
  status: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  description?: string;
}

export function AddLaborFromContactDialog({
  open,
  onOpenChange,
  contactId
}: AddLaborFromContactDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch contact details to pre-fill labor record
  const { data: contact } = useQuery({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: contactId > 0 && open,
  });
  
  // Fetch projects for the dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: open,
  });
  
  // Pre-select the first project if available
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(
    projects.length > 0 ? projects[0].id : undefined
  );
  
  // Update project selection when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);
  
  return (
    <CreateLaborDialog
      open={open}
      onOpenChange={onOpenChange}
      projectId={selectedProjectId}
      preselectedContactId={contactId}
    />
  );
}