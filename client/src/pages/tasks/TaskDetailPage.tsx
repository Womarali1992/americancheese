import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Trash2,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Upload,
  Plus,
  Combine
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
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { StatusBadge } from '@/components/ui/status-badge';
import { CategoryBadge } from '@/components/ui/category-badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { getStatusBgColor, getStatusBorderColor } from '@/lib/color-utils';
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
import { TaskStatusToggle } from '@/components/task/TaskStatusToggle';

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedLabor, setSelectedLabor] = useState<Labor | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false);
  const [isLaborDialogOpen, setIsLaborDialogOpen] = useState(false);
  const [isAttachmentsDialogOpen, setIsAttachmentsDialogOpen] = useState(false);
  
  const numericTaskId = parseInt(taskId);
  
  // Fetch task details
  const { data: task, isLoading: isLoadingTask } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: numericTaskId > 0,
    staleTime: 0, // Force refresh to ensure we get latest data
  });

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
  
  // Handle edit click
  const handleEditTask = () => {
    setIsEditDialogOpen(true);
  };
  
  // Handle task completion toggle
  const handleTaskCompletion = async () => {
    if (!task) return;
    
    try {
      const newStatus = !task.completed;
      const updateData = {
        completed: newStatus,
        status: newStatus ? 'completed' : 'in_progress'
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
          title: newStatus ? "Task Completed" : "Task Reopened",
          description: `"${task.title}" has been marked as ${newStatus ? 'completed' : 'in progress'}.`,
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
          description: errorData.message || "Failed to update task. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Something went wrong while updating the task. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle status change from TaskStatusToggle
  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;
    
    // Update the UI immediately by invalidating the query
    queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    if (task.projectId) {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', task.projectId, 'tasks'] });
    }
  };
  
  // Handle delete task
  const handleDeleteTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${numericTaskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // If deletion was successful
        toast({
          title: "Task Deleted",
          description: `"${task?.title}" has been successfully deleted.`,
          variant: "default",
        });

        // Invalidate queries to refresh the tasks list
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        if (task?.projectId) {
          queryClient.invalidateQueries({ queryKey: ['/api/projects', task.projectId, 'tasks'] });
        }
        
        // Close the delete confirmation dialog
        setIsDeleteDialogOpen(false);
        
        // Navigate back to the tasks list
        navigate('/tasks');
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete task. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Something went wrong while deleting the task. Please try again.",
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
      <div className="w-full min-w-0 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* Breadcrumb navigation */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb>
            <BreadcrumbList className="overflow-x-auto">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <a href="/tasks">Tasks</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-xs">{task.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* Page header with title and action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/tasks')}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-fit"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Tasks
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant={task.completed ? "outline" : "default"}
              onClick={handleTaskCompletion}
              className={task.completed ? "text-orange-600 border-orange-200 hover:bg-orange-50 text-xs sm:text-sm" : "bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"}
              size="sm"
            >
              {task.completed ? (
                <><CheckSquare className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Reopen Task</span><span className="sm:hidden">Reopen</span></>
              ) : (
                <><CheckCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Complete Task</span><span className="sm:hidden">Complete</span></>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={handleEditTask}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm"
              size="sm"
            >
              <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Edit Task</span><span className="sm:hidden">Edit</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
              size="sm"
            >
              <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Delete Task</span><span className="sm:hidden">Delete</span>
            </Button>
          </div>
        </div>
        
        {/* Task details card with modern design */}
        <Card className={`bg-white shadow-md border-l-4 ${getStatusBorderColor(task.status)} mb-4 sm:mb-6 overflow-hidden w-full min-w-0`}>
          <CardHeader className={`pb-2 bg-gradient-to-r ${
            task.status === "completed" ? "from-green-50 to-green-100 border-b border-green-200" : 
            task.status === "in_progress" ? "from-blue-50 to-blue-100 border-b border-blue-200" : 
            task.status === "delayed" ? "from-red-50 to-red-100 border-b border-red-200" : 
            "from-green-50 to-green-100 border-b border-green-200"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="h-full w-1 rounded-full bg-green-500 mr-2 self-stretch hidden sm:block"></div>
                    <CardTitle className="text-lg sm:text-2xl text-slate-900 truncate">{task.title}</CardTitle>
                  </div>
                  <span className={`w-fit text-xs px-2 py-1 rounded-full font-medium border flex-shrink-0 ${
                    task.status === "completed" ? "bg-green-100 text-green-800 border-green-200" :
                    task.status === "in_progress" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                    task.status === "delayed" ? "bg-red-100 text-red-800 border-red-200" :
                    "bg-slate-100 text-slate-800 border-slate-200"
                  }`}>
                    {task.status === 'completed' ? 'Completed' : 
                      task.status === 'in_progress' ? 'In Progress' : 
                      task.status === 'pending' ? 'Pending' : 'Not Started'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 sm:ml-3 gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                    <span className="text-slate-600 text-sm truncate">{project?.name || `Project ID: ${task.projectId}`}</span>
                    <CategoryBadge category={task.category || ''} />
                  </div>
                  <div className="w-full sm:w-auto">
                    <TaskStatusToggle task={task} onStatusChange={handleStatusChange} />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            {/* Task timeline section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center p-3 bg-blue-50 rounded-md">
                <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(task.startDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-purple-50 rounded-md">
                <Calendar className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="font-medium">{formatDate(task.endDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-green-50 rounded-md">
                <User className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Assigned To</p>
                  <p className="font-medium">{task.assignedTo || "Unassigned"}</p>
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Task description section with section combination */}
            {task.description && (
              <div className="mb-6">
                <CommentableDescription
                  description={task.description}
                  title={`Task: ${task.title}`}
                  className="bg-white rounded-lg border p-6"
                  entityType="task"
                  entityId={numericTaskId}
                  fieldName="description"
                  onDescriptionChange={async (newDescription) => {
                    try {
                      await apiRequest(`/api/tasks/${numericTaskId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ description: newDescription }),
                      });
                      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${numericTaskId}`] });
                    } catch (error) {
                      console.error('Error updating task description:', error);
                    }
                  }}
                />
              </div>
            )}
            

            
            {/* Task financial details */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                    Estimated Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {task.estimatedCost ? formatCurrency(task.estimatedCost) : 'Not set'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <DollarSign className="h-4 w-4 text-blue-600 mr-1" />
                    Actual Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">
                    {task.actualCost ? formatCurrency(task.actualCost) : 'Not yet recorded'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Main content section with two columns for Materials and Labor */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Materials column */}
              <div className="flex flex-col">
                <div className="p-2 bg-orange-100 text-orange-800 font-medium rounded-t-md flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Materials
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-orange-800 hover:bg-orange-200"
                      onClick={() => setIsMaterialsDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-orange-800 hover:bg-orange-200"
                      onClick={() => setIsAttachmentsDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 h-full rounded-b-md border border-orange-200">
                  {/* If we have the task materials, show the enhanced view */}
                  {task && task.materialIds && Array.isArray(task.materialIds) && task.materialIds.length > 0 ? (
                    <TaskMaterials taskId={numericTaskId} mode="full" className="h-full" />
                  ) : (
                    <div 
                      className="p-4 border rounded-md bg-white text-center h-full flex items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors"
                      onClick={() => setIsMaterialsDialogOpen(true)}
                    >
                      <div className="flex flex-col items-center justify-center p-6 text-slate-500">
                        <Package className="h-10 w-10 mb-2 text-orange-300" />
                        <span>No materials associated with this task</span>
                        <div className="mt-4 flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-orange-600 border-orange-200"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Materials
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-600 border-blue-200"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening the materials dialog
                              setIsAttachmentsDialogOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-1" /> Upload Files
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Labor column */}
              <div className="flex flex-col">
                <div className="p-2 bg-blue-100 text-blue-800 font-medium rounded-t-md flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Labor
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-blue-800 hover:bg-blue-200"
                    onClick={handleAddLabor}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-blue-50 p-4 h-full rounded-b-md border border-blue-200">
                  <TaskLabor taskId={numericTaskId} mode="full" className="h-full" onAddLabor={handleAddLabor} />
                </div>
              </div>
            </div>
            
            {/* Task contacts section */}
            {taskContacts.length > 0 && (
              <div className="mt-8">
                <div className="p-2 bg-green-100 text-green-800 font-medium rounded-t-md flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Assigned Contacts
                </div>
                <div className="bg-green-50 p-4 rounded-b-md border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {taskContacts.map(contact => (
                      <Card 
                        key={contact.id} 
                        className="border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => handleContactClick(contact)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <User className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium">{contact.name}</h4>
                              <p className="text-sm text-gray-600">
                                {contact.role} {contact.company ? `at ${contact.company}` : ''}
                              </p>
                              {contact.phone && (
                                <p className="text-sm text-gray-600">{contact.phone}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Checklist and Blocker Board Section */}
        <div className="space-y-6">
          <Accordion type="multiple" defaultValue={["taskchecklist", "blockerboard", "specialsections"]} className="w-full space-y-4">
            <AccordionItem value="taskchecklist" className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Clipboard className="h-5 w-5" />
                  Task Checklist
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <SubtaskManager taskId={numericTaskId} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="blockerboard" className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <CheckSquare className="h-5 w-5" />
                  Blocker Board
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TaskChecklistManager taskId={numericTaskId} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="specialsections" className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Combine className="h-5 w-5" />
                  Special Sections
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <SpecialSectionsManager taskId={numericTaskId} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      
      {/* Edit dialog */}
      {isEditDialogOpen && (
        <EditTaskDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          task={task}
        />
      )}
      
      {/* Material detail popup */}
      {selectedMaterial && (
        <ItemDetailPopup 
          item={selectedMaterial}
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Task Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete task "{task?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              Deleting this task will remove it permanently from the system. Any associated labor records, materials, and attachments may also be affected.
            </p>
          </div>
          <DialogFooter className="flex sm:justify-end gap-2 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteTask}
            >
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Materials Dialog */}
      <AddSectionMaterialsDialog
        open={isMaterialsDialogOpen}
        onOpenChange={setIsMaterialsDialogOpen}
        projectId={task?.projectId}
        onAddMaterials={handleAddSectionMaterials}
        existingMaterialIds={task?.materialIds?.map(id => typeof id === 'string' ? parseInt(id) : id) || []}
        initialTier1={task?.tier1Category}
        initialTier2={task?.tier2Category}
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
            <TaskAttachmentsPanel task={task} className="p-4" />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}