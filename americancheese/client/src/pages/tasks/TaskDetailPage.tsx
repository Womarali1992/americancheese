import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  User,
  CheckCircle,
  CheckSquare,
  Clock,
  Edit,
  Package,
  Users,
  ChevronRight,
  Building,
  Tag,
  Clipboard,
  File,
  DollarSign,
  Brain,
  PlayCircle,
  PauseCircle,
  Upload,
  Plus,
  Combine,
  Download,
  FileSpreadsheet,
  FileCode,
  ChevronDown,
  Copy
} from 'lucide-react';
import { Task, Labor, Contact, Material } from '@shared/schema';
import { Layout } from '@/components/layout/Layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryBadge } from '@/components/ui/category-badge';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { getStatusBgColor, getStatusBorderColor } from '@/lib/unified-color-system';
import { useTheme } from '@/hooks/useTheme';
import { hexToRgbWithOpacity } from '@/lib/unified-color-system';
import { TaskLabor } from '@/components/task/TaskLabor';
import { TaskMaterialsDetailView } from '@/components/materials/TaskMaterialsDetailView';
import { TaskMaterials } from '@/components/task/TaskMaterials';
import { AddSectionMaterialsDialog } from '@/components/materials/AddSectionMaterialsDialog';
import { CreateLaborDialog } from '@/pages/labor/CreateLaborDialog';
import { TaskAttachmentsPanel } from '@/components/task/TaskAttachmentsPanel';
import { TaskChecklist } from '@/components/task/TaskChecklist';
import { TaskChecklistManager } from '@/components/task/TaskChecklistManager';
import { CommentableDescription } from '@/components/CommentableDescription';
import { SubtaskManager } from '@/components/task/SubtaskManager';
import { SpecialSectionsManager } from '@/components/task/SpecialSectionsManager';
import { ConsolidatedTaskSections } from '@/components/task/ConsolidatedTaskSections';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ItemDetailPopup } from '@/components/task/ItemDetailPopup';
import { EditTaskDialog } from './EditTaskDialog';
import { ScheduleTaskDialog } from '@/components/calendar/ScheduleTaskDialog';
import { ContextEditor } from '@/components/context';
import { getCalendarSchedulePrefix } from '@/components/task/TaskTimeDisplay';
import { ContextData, createEmptyContext } from '../../../../shared/context-types';
import { CreateContactDialog } from '@/pages/contacts/CreateContactDialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { apiRequest } from '@/lib/queryClient';
import { PageDragExport, ExportableSection, ExportSection } from '@/components/ui/page-drag-export';
import { useTaskPageExport, formatTaskPageExport, formatTaskPageExportCSV, formatSectionExport } from '@/hooks/useTaskPageExport';

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedLabor, setSelectedLabor] = useState<Labor | null>(null);

  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false);
  const [isLaborDialogOpen, setIsLaborDialogOpen] = useState(false);
  const [isAttachmentsDialogOpen, setIsAttachmentsDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [taskContextOpen, setTaskContextOpen] = useState(true); // Task context open by default
  const [projectContext, setProjectContext] = useState<ContextData | null>(null);
  const [taskContext, setTaskContext] = useState<ContextData | null>(null);

  const numericTaskId = parseInt(taskId);

  // Status options with their respective icons and colors
  const statusOptions = [
    { value: 'not_started', label: 'Not Started', icon: PauseCircle, color: 'text-slate-500' },
    { value: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'text-yellow-500' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-500' }
  ];

  // Fetch task details
  const { data: task, isLoading: isLoadingTask } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: numericTaskId > 0,
    staleTime: 0, // Force refresh to ensure we get latest data
  });

  // Project-aware theme colors for this task (only after task is loaded)
  const { getColor } = useTheme(task?.projectId);
  const tier1Color = task?.tier1Category ? getColor.tier1(task.tier1Category) : undefined;
  const tier2Color = task?.tier2Category ? getColor.tier2(task.tier2Category, task.tier1Category || undefined) : undefined;
  const primaryColor = tier2Color || tier1Color;

  // Debug logging for task data
  React.useEffect(() => {
    if (task) {
      console.log(`Debug - Task ${taskId} data:`, task);
      console.log(`Debug - Task materialIds:`, task.materialIds);
      console.log(`Debug - Task materialIds length:`, task.materialIds?.length);
    }
  }, [task, taskId]);

  // Fetch project name (for the breadcrumb)
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch full project details (including structuredContext) for the task's project
  const { data: projectDetails } = useQuery({
    queryKey: ['/api/projects', task?.projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${task?.projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
    enabled: !!task?.projectId,
  });

  // Fetch associated materials for this task
  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
    enabled: numericTaskId > 0,
  });

  // Filter materials for this task
  const taskMaterials = materials.filter(material => {
    if (!material.taskIds) return false;
    // Handle taskIds being either a string[] or number[]
    const materialTaskIds = material.taskIds.map(id =>
      typeof id === 'string' ? parseInt(id) : id
    );
    return materialTaskIds.includes(numericTaskId);
  });

  // Fetch associated contacts for this task
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Filter contacts for this task
  const taskContacts = contacts.filter(contact => {
    if (!task?.contactIds) return false;
    // Handle contactIds being either a string[] or number[]
    const taskContactIds = task.contactIds.map(id =>
      typeof id === 'string' ? parseInt(id) : id
    );
    return taskContactIds?.includes(contact.id);
  });

  // Fetch additional data for export
  const { subtasks, checklistItems, laborEntries, attachments } = useTaskPageExport(numericTaskId, numericTaskId > 0);

  // Create export content generator
  const getExportContent = useCallback(() => {
    if (!task) return '';

    // Find project from projects array inside callback to avoid reference before declaration
    const projectForExport = projects.find((p: any) => p.id === task.projectId);

    return formatTaskPageExport({
      task,
      project: projectForExport ? { id: projectForExport.id, name: projectForExport.name } : undefined,
      subtasks,
      checklistItems,
      laborEntries,
      attachments,
      materials: taskMaterials,
      contacts: taskContacts,
      projectContext: projectContext || undefined,
    });
  }, [task, projects, subtasks, checklistItems, laborEntries, attachments, taskMaterials, taskContacts, projectContext]);

  // Create export sections for granular export
  const exportSections: ExportSection[] = React.useMemo(() => {
    if (!task) return [];

    const data = {
      task,
      subtasks,
      checklistItems,
      laborEntries,
      attachments,
      materials: taskMaterials,
      contacts: taskContacts,
      projectContext: projectContext || undefined,
    };

    return [
      {
        id: 'description',
        label: 'Description',
        getContent: () => formatSectionExport('description', data),
      },
      {
        id: 'context',
        label: 'AI Context',
        getContent: () => formatSectionExport('context', data),
      },
      {
        id: 'subtasks',
        label: 'Checklist',
        getContent: () => formatSectionExport('subtasks', data),
      },
      {
        id: 'blockers',
        label: 'Blocker Board',
        getContent: () => formatSectionExport('blockers', data),
      },
      {
        id: 'special',
        label: 'Special Sections',
        getContent: () => formatSectionExport('special', data),
      },
      {
        id: 'resources',
        label: 'Resources & Assets',
        getContent: () => formatSectionExport('resources', data),
      },
      {
        id: 'materials',
        label: 'Materials',
        getContent: () => formatSectionExport('materials', data),
      },
      {
        id: 'labor',
        label: 'Labor',
        getContent: () => formatSectionExport('labor', data),
      },
      {
        id: 'attachments',
        label: 'Attachments',
        getContent: () => formatSectionExport('attachments', data),
      },
    ];
  }, [task, subtasks, checklistItems, laborEntries, attachments, taskMaterials, taskContacts, projectContext]);

  // Initialize project context when project details are loaded
  useEffect(() => {
    if (projectDetails?.structuredContext) {
      try {
        const parsed = JSON.parse(projectDetails.structuredContext);
        setProjectContext(parsed);
      } catch {
        setProjectContext(createEmptyContext(`project-${projectDetails.id}`, 'project'));
      }
    } else if (projectDetails) {
      setProjectContext(createEmptyContext(`project-${projectDetails.id}`, 'project'));
    }
  }, [projectDetails]);

  // Initialize task context when task is loaded
  useEffect(() => {
    if (task?.structuredContext) {
      try {
        const parsed = JSON.parse(task.structuredContext);
        setTaskContext(parsed);
      } catch {
        setTaskContext(createEmptyContext(`task-${task.id}`, 'task'));
      }
    } else if (task) {
      setTaskContext(createEmptyContext(`task-${task.id}`, 'task'));
    }
  }, [task]);

  // Mutation to save project context
  const saveContextMutation = useMutation({
    mutationFn: async (context: ContextData) => {
      if (!projectDetails?.id) throw new Error('No project ID');
      const response = await apiRequest(`/api/projects/${projectDetails.id}/context`, "PUT", { context });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Context Saved",
        description: "Project AI context has been updated.",
      });
      // Invalidate project query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectDetails?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save context.",
        variant: "destructive",
      });
    },
  });

  // Handle context change with auto-save
  const handleContextChange = (newContext: ContextData) => {
    setProjectContext(newContext);
    saveContextMutation.mutate(newContext);
  };

  // Mutation to save task context
  const saveTaskContextMutation = useMutation({
    mutationFn: async (context: ContextData) => {
      if (!task?.id) throw new Error('No task ID');
      const response = await apiRequest(`/api/tasks/${task.id}/context`, "PUT", { context });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Context Saved",
        description: "Task AI context has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save task context.",
        variant: "destructive",
      });
    },
  });

  // Handle task context change with auto-save
  const handleTaskContextChange = (newContext: ContextData) => {
    setTaskContext(newContext);
    saveTaskContextMutation.mutate(newContext);
  };

  // Mutation to clone task
  const cloneTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task?.id) throw new Error('No task ID');
      const response = await apiRequest(`/api/tasks/${task.id}/clone`, "POST");
      return response.json();
    },
    onSuccess: (clonedTask: Task) => {
      toast({
        title: "Task Cloned",
        description: `Created "${clonedTask.title}" with subtasks and checklists.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${task?.projectId}/tasks`] });
      navigate(`/tasks/${clonedTask.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clone task.",
        variant: "destructive",
      });
    },
  });

  // Handle clone click
  const handleCloneTask = () => {
    cloneTaskMutation.mutate();
  };

  // Handle edit click
  const handleEditTask = () => {
    setIsEditDialogOpen(true);
  };

  // Create CSV export content generator
  const getExportContentCSV = useCallback(() => {
    if (!task) return '';

    const projectForExport = projects.find((p: any) => p.id === task.projectId);

    return formatTaskPageExportCSV({
      task,
      project: projectForExport ? { id: projectForExport.id, name: projectForExport.name } : undefined,
      subtasks,
      checklistItems,
      laborEntries,
      attachments,
      materials: taskMaterials,
      contacts: taskContacts,
      projectContext: projectContext || undefined,
    });
  }, [task, projects, subtasks, checklistItems, laborEntries, attachments, taskMaterials, taskContacts, projectContext]);

  // Handle export/download (XML)
  const handleExportTaskXML = () => {
    if (!task) return;

    const exportContent = getExportContent();
    const fileName = `task-${task.id}-${task.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.xml`;

    // Create blob and download
    const blob = new Blob([exportContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Task exported to ${fileName}`,
      variant: "default",
    });
  };

  // Handle export/download (CSV)
  const handleExportTaskCSV = () => {
    if (!task) return;

    const exportContent = getExportContentCSV();
    const fileName = `task-${task.id}-${task.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`;

    // Create blob and download
    const blob = new Blob([exportContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Task exported to ${fileName} - edit in Excel/Sheets and re-import`,
      variant: "default",
    });
  };

  // Handle status change from select dropdown
  const handleTaskStatusChange = async (newStatus: string) => {
    if (!task || newStatus === task.status) return;

    setIsUpdatingStatus(true);

    try {
      const updateData = {
        status: newStatus,
        // If the new status is completed, also set completed flag to true
        completed: newStatus === 'completed'
      };

      const response = await fetch(`/api/tasks/${numericTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast({
          title: "Task Status Updated",
          description: `Task has been marked as "${newStatus.replace('_', ' ').toUpperCase()}"`,
          variant: "default",
        });

        // Invalidate queries to refresh the tasks list
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        if (task.projectId) {
          queryClient.invalidateQueries({ queryKey: ['/api/projects', task.projectId, 'tasks'] });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to update task status. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Something went wrong while updating the task status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle calendar toggle
  const handleCalendarToggle = async () => {
    if (!task) return;

    const newCalendarActive = !(task.calendarActive ?? false);

    try {
      const response = await fetch(`/api/tasks/${numericTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ calendarActive: newCalendarActive })
      });

      if (response.ok) {
        toast({
          title: newCalendarActive ? "Task Added to Calendar" : "Task Removed from Calendar",
          description: newCalendarActive 
            ? "This task will now appear on the calendar view."
            : "This task will no longer appear on the calendar view.",
          variant: "default",
        });

        // Invalidate queries to refresh the task and calendar
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        if (task.projectId) {
          queryClient.invalidateQueries({ queryKey: ['/api/projects', task.projectId, 'tasks'] });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to update calendar visibility. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating calendar visibility:", error);
      toast({
        title: "Error",
        description: "Something went wrong while updating calendar visibility. Please try again.",
        variant: "destructive",
      });
    }
  };



  // Handle labor click
  const handleLaborClick = (labor: Labor) => {
    setSelectedLabor(labor);
  };

  // Handle material click
  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material);
  };

  // Handle contact click
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
  };

  // Handle adding labor
  const handleAddLabor = () => {
    setIsLaborDialogOpen(true);
  };

  // Handle contact created - link it to the task
  const handleContactCreated = async (contactId: number) => {
    if (!task) return;

    const currentContactIds = task.contactIds || [];
    const currentNumericIds = currentContactIds.map(id =>
      typeof id === 'string' ? parseInt(id) : id
    );

    // Add the new contact ID if not already present
    if (!currentNumericIds.includes(contactId)) {
      const updatedContactIds = [...currentNumericIds, contactId];

      try {
        const response = await fetch(`/api/tasks/${numericTaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactIds: updatedContactIds })
        });

        if (response.ok) {
          toast({
            title: "Contact Added",
            description: "Contact has been linked to this task.",
          });
          queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
          queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
        }
      } catch (error) {
        console.error("Error linking contact to task:", error);
      }
    }
  };

  // Handle adding materials through section materials dialog
  const handleAddSectionMaterials = (materialIds: number[]) => {
    if (!task) return;

    // Update the task with the new material IDs
    const currentMaterialIds = task.materialIds || [];
    const currentNumericIds = currentMaterialIds.map(id =>
      typeof id === 'string' ? parseInt(id) : id
    );

    // Combine existing IDs with new ones, avoiding duplicates
    const uniqueIds = Array.from(new Set([...currentNumericIds, ...materialIds]));

    // Update the task with the new material IDs
    fetch(`/api/tasks/${numericTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        materialIds: uniqueIds
      })
    })
      .then(response => {
        if (response.ok) {
          toast({
            title: "Materials Added",
            description: `Added ${materialIds.length} materials to task "${task.title}".`,
            variant: "default",
          });

          // Invalidate queries to refresh the task data
          queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          if (task.projectId) {
            queryClient.invalidateQueries({ queryKey: ['/api/projects', task.projectId, 'tasks'] });
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to add materials. Please try again.",
            variant: "destructive",
          });
        }
      })
      .catch(error => {
        console.error("Error adding materials to task:", error);
        toast({
          title: "Error",
          description: "Something went wrong while adding materials. Please try again.",
          variant: "destructive",
        });
      });
  };

  // Handle updating referenced tasks
  const handleUpdateReferencedTasks = (referencedTaskIds: string[]) => {
    if (!task) return;

    fetch(`/api/tasks/${numericTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        referencedTaskIds
      })
    })
      .then(response => {
        if (response.ok) {
          toast({
            title: "Referenced Tasks Updated",
            description: "Task references have been updated.",
            variant: "default",
          });

          // Invalidate queries to refresh the task data
          queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        } else {
          toast({
            title: "Error",
            description: "Failed to update task references. Please try again.",
            variant: "destructive",
          });
        }
      })
      .catch(error => {
        console.error("Error updating referenced tasks:", error);
        toast({
          title: "Error",
          description: "Something went wrong while updating task references.",
          variant: "destructive",
        });
      });
  };

  if (isLoadingTask) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 rounded-md"></div>
            <div className="h-32 bg-gray-200 rounded-md"></div>
            <div className="h-64 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">Task not found</h2>
            <p className="text-gray-500 mt-2">The task you're looking for doesn't exist or has been removed.</p>
            <Button
              className="mt-4"
              onClick={() => navigate('/tasks')}
            >
              Back to Tasks
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Get project for this task
  const project = projects.find((p: any) => p.id === task.projectId);

  // Calculate progress
  const now = new Date();
  const start = new Date(task.startDate);
  const end = new Date(task.endDate);

  let progress = 0;
  if (task.status === "completed") progress = 100;
  else if (task.status === "not_started") progress = 0;
  else {
    // If task hasn't started yet
    if (now < start) progress = 0;
    // If task has ended
    else if (now > end) progress = task.status === "in_progress" ? 90 : 100;
    else {
      // Calculate progress based on dates
      const totalDuration = end.getTime() - start.getTime();
      const elapsedDuration = now.getTime() - start.getTime();
      progress = Math.round((elapsedDuration / totalDuration) * 100);
      progress = Math.min(progress, 100);
    }
  }

  return (
    <Layout>
      <PageDragExport
        getExportContent={getExportContent}
        exportTitle={task.title}
        sections={exportSections}
        exportFileOptions={[
          {
            label: 'Export as XML',
            format: 'full data',
            icon: <FileCode className="h-4 w-4" />,
            onExport: handleExportTaskXML,
          },
          {
            label: 'Export as CSV',
            format: 'spreadsheet',
            icon: <FileSpreadsheet className="h-4 w-4" />,
            onExport: handleExportTaskCSV,
          },
        ]}
      >
        <div className="w-full min-w-0 space-y-8 sm:space-y-10 overflow-x-hidden pb-10">

          {/* Hero Header Section */}
          <div className="relative">
            {/* Top Navigation / Breadcrumbs */}
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link href="/tasks" className="hover:text-slate-900 transition-colors flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Back to Tasks
              </Link>
              <span className="text-slate-300">|</span>
              {project && (
                <Link href={`/projects/${project.id}`} className="hover:text-slate-900 transition-colors font-medium">
                  {project.name}
                </Link>
              )}
              {task.tier1Category && (
                <>
                  <span className="text-slate-300">/</span>
                  <Link href={`/tasks?tier1=${encodeURIComponent(task.tier1Category)}`} className="hover:text-slate-900 transition-colors capitalize">
                    {task.tier1Category}
                  </Link>
                </>
              )}
              {task.tier2Category && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-900 font-medium capitalize">
                    {task.tier2Category}
                  </span>
                </>
              )}
            </div>

            {/* Title & Main Actions */}
            <div
              className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 py-4"
              style={{
                borderTop: primaryColor ? `8px solid ${primaryColor}CC` : 'none',
                borderBottom: primaryColor ? `8px solid ${primaryColor}CC` : 'none'
              }}
            >
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                    {(() => {
                      const schedulePrefix = getCalendarSchedulePrefix(task.calendarStartDate, task.calendarStartTime);
                      return schedulePrefix ? (
                        <><span className="text-cyan-700">{schedulePrefix}</span> {task.title}</>
                      ) : task.title;
                    })()}
                  </h1>

                  {/* Meta Information Row */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: primaryColor || '#cbd5e1' }} />
                      <span className="capitalize font-medium text-slate-700">{task.status?.replace(/_/g, ' ') || 'Not Started'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{formatDate(task.startDate)}</span>
                      <ChevronRight className="h-3 w-3 text-slate-300" />
                      <span>{formatDate(task.endDate)}</span>
                    </div>

                    {(task.estimatedCost || task.actualCost) && (
                      <div className="flex items-center gap-1.5 font-medium">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="text-slate-900">{formatCurrency(task.actualCost || 0)}</span>
                        <span className="text-slate-400 font-normal">of {formatCurrency(task.estimatedCost || 0)}</span>
                      </div>
                    )}

                    {/* Quick Add Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                        onClick={() => setIsMaterialsDialogOpen(true)}
                      >
                        <Package className="h-3.5 w-3.5 mr-1" />
                        Add Material
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                        onClick={() => setIsContactDialogOpen(true)}
                      >
                        <Users className="h-3.5 w-3.5 mr-1" />
                        Add Contact
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Badges / Tags Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {task.tier1Category && (
                    <CategoryBadge
                      category={task.tier1Category}
                      type="tier1"
                      className="text-xs px-2.5 py-0.5"
                      color={tier1Color || null}
                      onClick={() => navigate(`/tasks?tier1=${encodeURIComponent(task.tier1Category || '')}`)}
                    />
                  )}
                  {task.tier2Category && (
                    <CategoryBadge
                      category={task.tier2Category}
                      type="tier2"
                      className="text-xs px-2.5 py-0.5"
                      color={tier2Color || null}
                      onClick={() => navigate(`/tasks?tier1=${encodeURIComponent(task.tier1Category || '')}&tier2=${encodeURIComponent(task.tier2Category || '')}`)}
                    />
                  )}

                  {taskContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handleContactClick(contact)}
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center -ml-1">
                        <User className="h-3 w-3 text-slate-500" />
                      </div>
                      <span>{contact.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
                {/* Calendar Schedule Button */}
                <Button
                  variant="outline"
                  size="default"
                  className={cn(
                    "h-10 px-3 md:px-4 font-medium shadow-sm text-sm",
                    task.calendarActive ?? false
                      ? "border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900 hover:border-cyan-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                  )}
                  onClick={() => setIsScheduleDialogOpen(true)}
                  title={(task.calendarActive ?? false) ? "Edit calendar schedule" : "Schedule on calendar"}
                >
                  <Calendar className={cn(
                    "h-4 w-4 md:mr-2",
                    (task.calendarActive ?? false) ? "text-cyan-600" : "text-slate-400"
                  )} />
                  <span className="hidden md:inline">{(task.calendarActive ?? false) ? "On Calendar" : "Add to Calendar"}</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 px-3 md:px-4 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 shadow-sm text-sm"
                    >
                      <Edit className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Edit</span>
                      <ChevronDown className="ml-1 md:ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditTask} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCloneTask}
                      className="cursor-pointer"
                      disabled={cloneTaskMutation.isPending}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {cloneTaskMutation.isPending ? "Cloning..." : "Clone Task"}
                    </DropdownMenuItem>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</div>
                    {statusOptions.map(option => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleTaskStatusChange(option.value)}
                        className={cn(
                          "cursor-pointer",
                          task.status === option.value && "bg-slate-100"
                        )}
                        disabled={isUpdatingStatus}
                      >
                        <option.icon className={`mr-2 h-4 w-4 ${option.color}`} />
                        <span className={option.value === 'completed' ? 'font-medium text-emerald-600' : ''}>{option.label}</span>
                        {task.status === option.value && <span className="ml-auto text-xs text-slate-400">Current</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Progress Bar Visual */}
            <div className="absolute -bottom-6 left-0 right-0 h-px bg-slate-100">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: primaryColor || '#cbd5e1',
                  opacity: 0.5
                }}
              />
            </div>
          </div>

          {/* Task description embedded in a clean section */}
          {task.description && (
            <ExportableSection id="description">
              <div className="prose prose-slate max-w-none">
                <TaskChecklist
                  taskId={numericTaskId}
                  description={task.description}
                  onProgressUpdate={(progress) => {
                    console.log('Description checklist progress:', progress);
                  }}
                />
              </div>
            </ExportableSection>
          )}

          {/* Task AI Context Section */}
          {task && (
            <ExportableSection id="task-context">
              <div className="rounded-xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
                <Collapsible open={taskContextOpen} onOpenChange={setTaskContextOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                          <Brain className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Agent AI Context</h3>
                          <p className="text-sm text-slate-500">Mission, scope, methods, deliverables, and handoffs for this agent</p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 text-slate-400 transition-transform ${taskContextOpen ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 border-t border-emerald-100">
                      <div className="pt-4">
                        <ContextEditor
                          entityId={`task-${task.id}`}
                          entityType="task"
                          initialContext={taskContext || undefined}
                          onChange={handleTaskContextChange}
                          compact
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ExportableSection>
          )}

          {/* Project AI Context Section */}
          {projectDetails && (
            <ExportableSection id="context">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                          <Brain className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Project Context</h3>
                          <p className="text-sm text-slate-500">AI context and structured data for this project</p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 text-slate-400 transition-transform ${contextOpen ? 'rotate-90' : ''
                          }`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                      <div className="pt-4">
                        <ContextEditor
                          entityId={projectDetails.id}
                          entityType="project"
                          initialContext={projectContext || undefined}
                          onChange={handleContextChange}
                          compact
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ExportableSection>
          )}

          {/* Consolidated Task Sections */}
          <ConsolidatedTaskSections
            task={{ ...task, completed: Boolean(task.completed), category: task.category || '', tier1Category: task.tier1Category || '', tier2Category: task.tier2Category || '' }}
            taskMaterials={taskMaterials}
            taskContacts={taskContacts}
            projects={projects}
            onAddMaterials={() => setIsMaterialsDialogOpen(true)}
            onAddLabor={handleAddLabor}
            onAddAttachments={() => setIsAttachmentsDialogOpen(true)}
            onUpdateReferencedTasks={handleUpdateReferencedTasks}
          />
        </div>
      </PageDragExport>

      {/* Edit dialog */}
      {isEditDialogOpen && (
        <EditTaskDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          task={{ ...task, completed: Boolean(task.completed), category: task.category || '', tier1Category: task.tier1Category || '', tier2Category: task.tier2Category || '' } as any}
        />
      )}

      {/* Schedule Task on Calendar dialog */}
      <ScheduleTaskDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        task={task}
      />

      {/* Material detail popup */}
      {selectedMaterial && (
        <ItemDetailPopup
          item={selectedMaterial ? { ...selectedMaterial, category: selectedMaterial.category || undefined } as any : null}
          itemType="material"
          onClose={() => setSelectedMaterial(null)}
        />
      )}

      {/* Contact detail popup */}
      {selectedContact && (
        <ItemDetailPopup
          item={selectedContact}
          itemType="contact"
          onClose={() => setSelectedContact(null)}
        />
      )}

      {/* Labor detail popup */}
      {selectedLabor && (
        <ItemDetailPopup
          item={selectedLabor}
          itemType="labor"
          onClose={() => setSelectedLabor(null)}
        />
      )}



      {/* Section Materials Dialog */}
      <AddSectionMaterialsDialog
        open={isMaterialsDialogOpen}
        onOpenChange={setIsMaterialsDialogOpen}
        projectId={task?.projectId}
        onAddMaterials={handleAddSectionMaterials}
        existingMaterialIds={task?.materialIds?.map(id => typeof id === 'string' ? parseInt(id) : id) || []}
        initialTier1={task?.tier1Category || undefined}
        initialTier2={task?.tier2Category || undefined}
        initialTaskId={task?.id}
      />

      {/* Create Labor Dialog */}
      <CreateLaborDialog
        open={isLaborDialogOpen}
        onOpenChange={(open) => {
          setIsLaborDialogOpen(open);
          if (!open) {
            // Refresh labor data when dialog closes
            queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/labor`] });
            queryClient.invalidateQueries({ queryKey: ['/api/labor'] });
          }
        }}
        projectId={task?.projectId}
        preselectedTaskId={numericTaskId}
      />

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        projectId={task?.projectId}
        onContactCreated={handleContactCreated}
      />

      {/* Attachments Panel Dialog */}
      <Dialog open={isAttachmentsDialogOpen} onOpenChange={setIsAttachmentsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <File className="h-5 w-5 text-orange-500" />
              Task Attachments
            </DialogTitle>
            <DialogDescription>
              Upload and manage files associated with this task.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {task && <TaskAttachmentsPanel task={{ ...task, completed: Boolean(task.completed), category: task.category || '', tier1Category: task.tier1Category || '', tier2Category: task.tier2Category || '' }} className="p-4" />}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
