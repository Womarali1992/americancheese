import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/charts/ProgressBar";
import { Button } from "@/components/ui/button";
import { BudgetChart } from "@/components/charts/BudgetChart";
import { GanttChart } from "@/components/charts/GanttChartNew";
import { VintageGanttChart } from "@/components/charts/VintageGanttChart";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { DataTable } from "@/components/ui/data-table";
import { TasksTabView } from "@/components/project/TasksTabView";
import { ResourcesTab } from "@/components/project/ResourcesTab";
import { CategoryProgressList } from "@/components/project/CategoryProgressList";
import { CategoryDescriptionList } from "@/components/project/CategoryDescriptionList";
import {
  Building,
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Clipboard,
  DollarSign,
  Package,
  Plus,
  ListTodo,
  Settings,
  Wand2,
  Tags,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
  Palette,
  FileStack,
  Check
} from "lucide-react";
import { CreateTaskDialog } from "@/pages/tasks/CreateTaskDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { ProjectThemeSelector } from "@/components/project/ProjectThemeSelector";
import { ProjectDescriptionEditor } from "@/components/project/ProjectDescriptionEditor";
import { useProjectTheme } from "@/hooks/useProjectTheme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPresetOptions } from "@shared/presets.ts";
import { PROJECT_THEMES } from "@/lib/project-themes";

// Mock users for avatar group
const mockUsers = [
  { name: "John Doe", image: undefined },
  { name: "Jane Smith", image: undefined },
  { name: "Robert Chen", image: undefined },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = Number(params.id);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [replaceExistingTasks, setReplaceExistingTasks] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"tier1" | "tier2">("tier1");
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const { theme: projectTheme, themeName } = useProjectTheme(projectId);
  
  // Get project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return await response.json();
    },
  });
  
  // Get tasks for this project
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/projects", projectId, "tasks"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return await response.json();
    },
  });
  
  // Get expenses for this project
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["/api/projects", projectId, "expenses"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/expenses`);
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      return await response.json();
    },
  });
  
  // Get materials for this project
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ["/api/projects", projectId, "materials"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/materials`);
      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }
      return await response.json();
    },
  });
  
  // Get project categories
  const { data: projectCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/projects", projectId, "template-categories"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/template-categories`);
      if (!response.ok) {
        throw new Error("Failed to fetch project categories");
      }
      return await response.json();
    },
  });
  
  const isLoading = isLoadingProject || isLoadingTasks || isLoadingExpenses || isLoadingMaterials;
  
  // Filter tasks based on hidden categories
  const hiddenCategories = project?.hiddenCategories || [];
  const filteredTasks = tasks?.filter(task => {
    // Skip tasks with hidden tier1 categories
    const tier1 = task.tier1Category?.toLowerCase();
    if (tier1 && hiddenCategories.includes(tier1)) {
      return false;
    }
    return true;
  }) || [];
  
  // Process tasks for Gantt chart - only show filtered tasks
  const ganttTasks = filteredTasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate),
    status: task.status,
    assignedTo: task.assignedTo,
    category: task.category,
    contactIds: task.contactIds,
    materialIds: task.materialIds,
    durationDays: Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))
  })) || [];
  
  // Calculate project progress based on filtered tasks
  const calculateTier1Progress = () => {
    // Group tasks by tier1Category
    const tasksByTier1 = filteredTasks.reduce((acc, task) => {
      if (!task.tier1Category) return acc;
      
      // Create a standardized category name
      const tier1 = task.tier1Category.toLowerCase();
      
      if (!acc[tier1]) {
        acc[tier1] = [];
      }
      acc[tier1].push(task);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Calculate completion percentage for each tier
    const progressByTier: Record<string, number> = {
      structural: 0,
      systems: 0, 
      sheathing: 0,
      finishings: 0
    };
    
    // Process each tier1 category
    Object.keys(progressByTier).forEach(tier => {
      // Skip hidden categories
      if (hiddenCategories.includes(tier)) {
        delete progressByTier[tier];
        return;
      }
      
      const tierTasks = tasksByTier1[tier] || [];
      const totalTasks = tierTasks.length;
      
      // Check both the completed flag and status field
      const completedTasks = tierTasks.filter(task => 
        task.completed === true || task.status === 'completed'
      ).length;
      
      progressByTier[tier] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    });
    
    // Calculate overall progress based on visible categories
    const visibleCategories = Object.keys(progressByTier);
    if (visibleCategories.length === 0) return 0;
    
    const totalProgress = visibleCategories.reduce(
      (sum, tier) => sum + progressByTier[tier], 0
    ) / visibleCategories.length;
    
    return Math.round(totalProgress);
  };
  
  // Calculate the project progress based on filtered tasks
  const calculatedProgress = calculateTier1Progress();
  
  // Process budget data
  const totalBudget = 100000; // This would ideally come from the project data
  const totalExpenses = expenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const materialCosts = expenses?.filter(expense => expense.category === "materials")
    .reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const laborCosts = expenses?.filter(expense => expense.category === "labor")
    .reduce((acc, expense) => acc + expense.amount, 0) || 0;
  
  const budgetData = {
    spent: totalExpenses,
    remaining: totalBudget - totalExpenses,
    materials: materialCosts,
    labor: laborCosts
  };
  
  // Task columns for data table
  const taskColumns = [
    { header: "Title", accessorKey: "title" },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (task) => <StatusBadge status={task.status} />
    },
    { 
      header: "Start Date", 
      accessorKey: "startDate",
      cell: (task) => formatDate(task.startDate)
    },
    { 
      header: "End Date", 
      accessorKey: "endDate",
      cell: (task) => formatDate(task.endDate)
    },
    { 
      header: "Assignee", 
      accessorKey: "assignedTo",
      cell: (task) => task.assignedTo || "-"
    }
  ];
  
  // Expense columns for data table
  const expenseColumns = [
    { header: "Description", accessorKey: "description" },
    { 
      header: "Amount", 
      accessorKey: "amount",
      cell: (expense) => formatCurrency(expense.amount)
    },
    { 
      header: "Date", 
      accessorKey: "date",
      cell: (expense) => formatDate(expense.date)
    },
    { 
      header: "Category", 
      accessorKey: "category",
      cell: (expense) => expense.category
    }
  ];
  
  // Material columns for data table
  const materialColumns = [
    { header: "Name", accessorKey: "name" },
    { header: "Type", accessorKey: "type" },
    { 
      header: "Quantity", 
      accessorKey: "quantity",
      cell: (material) => material.quantity
    },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (material) => <StatusBadge status={material.status} />
    },
    { 
      header: "Supplier", 
      accessorKey: "supplier",
      cell: (material) => material.supplier || "-"
    }
  ];
  
  // Get project styling based on theme and status
  const getProjectCardStyle = (status: string) => {
    if (!projectTheme) return { background: '#556b2f' };
    
    if (status === "completed") {
      return { background: `linear-gradient(135deg, #22c55e, #16a34a)` };
    } else if (status === "on_hold") {
      return { background: `linear-gradient(135deg, #6b7280, #4b5563)` };
    } else {
      return { background: `linear-gradient(135deg, ${projectTheme.primary}, ${projectTheme.secondary})` };
    }
  };

  // Handle back button
  const handleBack = () => {
    setLocation("/projects");
  };
  
  // Handle custom category creation
  const handleCreateCustomCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name is required");
      return;
    }
    
    if (newCategoryType === "tier2" && !selectedParentCategory) {
      alert("Parent category is required for tier2 categories");
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/template-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: newCategoryType,
          description: newCategoryDescription.trim() || null,
          parentId: newCategoryType === "tier2" ? selectedParentCategory : null,
          projectId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      
      // Reset form
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryType("tier1");
      setSelectedParentCategory(null);
      setShowCreateCategory(false);
      
      // Refresh categories
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });
      
      alert('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };
  
  // Handle edit category
  const handleEditCategory = (category: any) => {
    setEditingCategory(category.id);
    setEditCategoryName(category.name);
    setEditCategoryDescription(category.description || "");
  };
  
  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editCategoryName.trim()) {
      alert("Category name is required");
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/template-categories/${editingCategory}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCategoryName.trim(),
          description: editCategoryDescription.trim() || null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update category');
      }
      
      // Reset edit state
      setEditingCategory(null);
      setEditCategoryName("");
      setEditCategoryDescription("");
      
      // Refresh categories and tasks (since tasks display category names)
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });

      alert('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };
  
  // Handle delete category
  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/template-categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      
      // Refresh categories
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });
      
      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName("");
    setEditCategoryDescription("");
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.index === source.index) {
      return;
    }

    try {
      // Get the current categories in their current order
      const tier1Categories = projectCategories?.filter((cat: any) => cat.type === "tier1")
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)) || [];

      // Reorder the categories array
      const reorderedCategories = Array.from(tier1Categories);
      const [movedCategory] = reorderedCategories.splice(source.index, 1);
      reorderedCategories.splice(destination.index, 0, movedCategory);

      // Create the new order payload
      const categoryOrders = reorderedCategories.map((category: any, index: number) => ({
        id: category.id,
        sortOrder: index
      }));

      // Make API call to reorder categories
      const response = await fetch(`/api/projects/${projectId}/template-categories/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryOrders })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder categories');
      }

      // Refresh categories to show the new order
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });

    } catch (error) {
      console.error('Error reordering categories:', error);
      alert('Failed to reorder categories');
    }
  };
  
  if (isLoading || !project) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-40 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-60 bg-slate-200 rounded"></div>
            <div className="h-60 bg-slate-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={project.name}>
      <div className="space-y-6">
        {/* Clean Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={project.status} />
                <span className="text-sm text-muted-foreground">{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowThemeDialog(true)}
            >
              <Palette className="h-4 w-4 mr-2" />
              Theme
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(true)}
            >
              <FileStack className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditProjectDialog(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowTaskDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
        
        {/* Project Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Project Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Project Overview</h3>
                
                <div className="mb-4">
                  <ProjectDescriptionEditor project={project} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Team:</span>
                    <AvatarGroup users={mockUsers} max={3} size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Budget Summary */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Budget Summary</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total Budget</p>
                    <p className="text-2xl font-bold text-blue-800">{formatCurrency(project.budget || 0)}</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Spent</p>
                    <p className="text-2xl font-bold text-green-800">{formatCurrency(totalExpenses)}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Remaining</p>
                    <p className="text-2xl font-bold text-purple-800">{formatCurrency((project.budget || 0) - totalExpenses)}</p>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Budget Used</span>
                      <span>{project.budget ? Math.round((totalExpenses / project.budget) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (project.budget && (totalExpenses / project.budget) > 0.9) ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${project.budget ? Math.min((totalExpenses / project.budget) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              Tasks & Settings
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>


          <TabsContent value="tasks" className="space-y-6">
            <TasksTabView
              tasks={tasks || []}
              projectId={projectId}
              project={project}
              onAddTask={() => setShowTaskDialog(true)}
            />

            {/* Settings Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Custom Categories</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateCategory(!showCreateCategory)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {showCreateCategory && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category-name">Category Name</Label>
                          <Input
                            id="category-name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g., Custom Phase"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category-type">Category Type</Label>
                          <Select value={newCategoryType} onValueChange={(value: "tier1" | "tier2") => setNewCategoryType(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tier1">Main Category (Tier 1)</SelectItem>
                              <SelectItem value="tier2">Sub Category (Tier 2)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {newCategoryType === "tier2" && (
                        <div>
                          <Label htmlFor="parent-category">Parent Category</Label>
                          <Select value={selectedParentCategory?.toString() || ""} onValueChange={(value) => setSelectedParentCategory(parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent category..." />
                            </SelectTrigger>
                            <SelectContent>
                              {projectCategories?.filter((cat: any) => cat.type === "tier1").map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="category-description">Description (Optional)</Label>
                        <Textarea
                          id="category-description"
                          value={newCategoryDescription}
                          onChange={(e) => setNewCategoryDescription(e.target.value)}
                          placeholder="Describe what this category is for..."
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleCreateCustomCategory}>
                          <Tags className="h-4 w-4 mr-2" /> Create Category
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {false && (
                    <>
                      <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Categories</h4>
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="categories">
                          {(provided) => (
                            <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
                              {projectCategories
                                .filter((cat: any) => cat.type === "tier1")
                                .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                .map((mainCategory: any, index: number) => {
                                  const subCategories = projectCategories.filter((cat: any) =>
                                    cat.type === "tier2" && cat.parentId === mainCategory.id
                                  );

                                  return (
                                    <Draggable
                                      key={mainCategory.id}
                                      draggableId={mainCategory.id.toString()}
                                      index={index}
                                    >
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className="border rounded-lg p-3 bg-slate-50"
                                        >
                              {/* Main Category */}
                              <div className="bg-blue-50 rounded p-2 mb-2">
                                {editingCategory === mainCategory.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editCategoryName}
                                      onChange={(e) => setEditCategoryName(e.target.value)}
                                      className="text-sm"
                                    />
                                    <Textarea
                                      value={editCategoryDescription}
                                      onChange={(e) => setEditCategoryDescription(e.target.value)}
                                      placeholder="Description (optional)"
                                      rows={1}
                                      className="text-sm"
                                    />
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                      </div>
                                      <Tags className="h-4 w-4 text-blue-600" />
                                      <span className="font-semibold text-base">{mainCategory.name}</span>
                                      {mainCategory.description && <span className="text-muted-foreground">- {mainCategory.description}</span>}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditCategory(mainCategory)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteCategory(mainCategory.id, mainCategory.name)}
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Sub Categories */}
                              {subCategories.length > 0 && (
                                <div className="ml-4 space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Subcategories:</p>
                                  {subCategories.map((subCategory: any) => (
                                    <div key={subCategory.id} className="bg-green-50 rounded p-2">
                                      {editingCategory === subCategory.id ? (
                                        <div className="space-y-2">
                                          <Input
                                            value={editCategoryName}
                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                            className="text-sm"
                                          />
                                          <Textarea
                                            value={editCategoryDescription}
                                            onChange={(e) => setEditCategoryDescription(e.target.value)}
                                            placeholder="Description (optional)"
                                            rows={1}
                                            className="text-sm"
                                          />
                                          <div className="flex gap-1">
                                            <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                                              <Save className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Tags className="h-3 w-3 text-green-600 ml-2" />
                                            <span className="font-medium text-sm">{subCategory.name}</span>
                                            {subCategory.description && <span className="text-muted-foreground text-sm">- {subCategory.description}</span>}
                                          </div>
                                          <div className="flex gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleEditCategory(subCategory)}
                                              className="h-6 w-6 p-0"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleDeleteCategory(subCategory.id, subCategory.name)}
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {subCategories.length === 0 && (
                                <div className="ml-4 text-xs text-muted-foreground italic">
                                  No subcategories yet
                                </div>
                              )}
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>

                        {/* Show orphaned subcategories (subcategories without a parent) */}
                        {(() => {
                          const orphanedSubs = projectCategories.filter((cat: any) =>
                            cat.type === "tier2" &&
                            !projectCategories.some((parent: any) => parent.type === "tier1" && parent.id === cat.parentId)
                          );

                          if (orphanedSubs.length > 0) {
                            return (
                              <div className="border rounded-lg p-3 bg-yellow-50">
                                <p className="text-sm font-medium mb-2 text-yellow-800">Orphaned Subcategories</p>
                                <div className="space-y-1">
                                  {orphanedSubs.map((category: any) => (
                                    <div key={category.id} className="bg-yellow-100 rounded p-2">
                                      {editingCategory === category.id ? (
                                        <div className="space-y-2">
                                          <Input
                                            value={editCategoryName}
                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                            className="text-sm"
                                          />
                                          <Textarea
                                            value={editCategoryDescription}
                                            onChange={(e) => setEditCategoryDescription(e.target.value)}
                                            placeholder="Description (optional)"
                                            rows={1}
                                            className="text-sm"
                                          />
                                          <div className="flex gap-1">
                                            <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                                              <Save className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Tags className="h-3 w-3 text-yellow-600" />
                                            <span className="font-medium text-sm">{category.name}</span>
                                            {category.description && <span className="text-muted-foreground text-sm">- {category.description}</span>}
                                            <span className="text-xs text-yellow-600">(No parent)</span>
                                          </div>
                                          <div className="flex gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleEditCategory(category)}
                                              className="h-6 w-6 p-0"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleDeleteCategory(category.id, category.name)}
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeline" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  {ganttTasks.length > 0 ? (
                    <VintageGanttChart 
                      tasks={ganttTasks.map(task => ({
                        ...task,
                        tier1Category: task.category || '',
                        tier2Category: task.category || ''
                      }))}
                      title={`${project.name} Timeline`}
                      subtitle="project tasks schedule"
                      projectId={projectId}
                      backgroundClass="bg-amber-50"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Calendar className="h-16 w-16 mb-4" />
                      <p className="text-lg mb-2">No tasks to display</p>
                      <Button onClick={() => setShowTaskDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Your First Task
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-0">
            <ResourcesTab projectId={projectId} />
          </TabsContent>
        </Tabs>
        
        
        {/* Task Creation Dialog */}
        <CreateTaskDialog 
          open={showTaskDialog}
          onOpenChange={setShowTaskDialog}
          projectId={projectId}
        />

        {/* Edit Project Dialog */}
        <EditProjectDialog
          open={showEditProjectDialog}
          onOpenChange={setShowEditProjectDialog}
          project={project}
          onDelete={() => {
            // Redirect to projects page after deletion
            setLocation('/projects');
          }}
        />

        {/* Theme Dialog */}
        <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Project Theme</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-6">
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">Current: {themeName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {PROJECT_THEMES.find(t => t.name === themeName)?.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Available Themes</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {PROJECT_THEMES.map((theme) => {
                      const isSelected = themeName === theme.name;

                      return (
                        <div
                          key={theme.name}
                          className={`cursor-pointer p-4 border rounded-lg transition-all hover:shadow-md hover:border-gray-300 ${
                            isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50' : ''
                          }`}
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/projects/${projectId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ colorTheme: theme.name })
                              });

                              if (response.ok) {
                                queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
                                queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                                setShowThemeDialog(false);
                              } else {
                                alert('Failed to update theme');
                              }
                            } catch (error) {
                              alert('Failed to update theme');
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{theme.name}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{theme.description}</p>
                          <div className="space-y-3">
                            {/* Category 1: Primary */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.primary }} />
                              <div className="grid grid-cols-5 gap-1">
                                {theme.subcategories?.slice(0, 5).map((color, index) => (
                                  <div key={index} className="h-3 rounded-sm border" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>

                            {/* Category 2: Secondary */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.secondary }} />
                              <div className="grid grid-cols-5 gap-1">
                                {theme.subcategories?.slice(5, 10).map((color, index) => (
                                  <div key={index} className="h-3 rounded-sm border" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>

                            {/* Category 3: Accent */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.accent }} />
                              <div className="grid grid-cols-5 gap-1">
                                {theme.subcategories?.slice(10, 15).map((color, index) => (
                                  <div key={index} className="h-3 rounded-sm border" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>

                            {/* Category 4: Muted */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.muted }} />
                              <div className="grid grid-cols-5 gap-1">
                                {theme.subcategories?.slice(15, 20).map((color, index) => (
                                  <div key={index} className="h-3 rounded-sm border" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>

                            {/* Category 5: Border (Permitting) */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.border }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Template Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Load Template Set</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose a preset to add the first 4 categories and their tasks to your project
              </p>
              <Select onValueChange={async (presetId) => {
                try {
                  // First load the preset categories (limited to first 4)
                  const categoriesResponse = await fetch(`/api/projects/${projectId}/load-preset-categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ presetId, replaceExisting: true })
                  });
                  if (!categoriesResponse.ok) throw new Error('Failed to load preset categories');
                  const categoriesResult = await categoriesResponse.json();

                  // Then load the tasks for the preset (limited to first 4 categories)
                  const tasksResponse = await fetch(`/api/projects/${projectId}/create-tasks-from-templates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ presetId, replaceExisting: false })
                  });
                  if (!tasksResponse.ok) throw new Error('Failed to load preset tasks');
                  const tasksResult = await tasksResponse.json();

                  // Refresh the UI
                  queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });

                  alert(`Loaded ${categoriesResult.categoriesCreated} categories and ${tasksResult.createdTasks || 0} tasks from preset (first 4 categories only)`);
                  setShowTemplateDialog(false);
                } catch (error) {
                  alert('Failed to load preset');
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template set..." />
                </SelectTrigger>
                <SelectContent>
                  {getPresetOptions().map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{preset.label}</span>
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}