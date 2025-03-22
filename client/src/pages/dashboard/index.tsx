import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetBarChart } from "@/components/charts/BudgetBarChart";
import { ProgressBar } from "@/components/charts/ProgressBar";
import { ProjectProgressChart } from "@/components/charts/ProjectProgressChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStatusBorderColor, getStatusBgColor, getProgressColor } from "@/lib/color-utils";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useToast } from "@/hooks/use-toast";
import { CreateProjectDialog } from "@/pages/projects/CreateProjectDialog";
import { TaskAttachments } from "@/components/task/TaskAttachments";
import {
  Building,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Settings,
  Plus,
  MoreHorizontal,
  Search,
  Users,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  Package,
  User,
  CheckCircle
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"; // Added carousel imports


// Placeholder data for budget overview with project-specific information
const budgetData = {
  projects: [
    {
      id: 1,
      name: "Riverside Apartments",
      materials: 145000,
      labor: 156000
    },
    {
      id: 2,
      name: "Community Center",
      materials: 120000,
      labor: 132000
    },
    {
      id: 3,
      name: "Office Building",
      materials: 110000,
      labor: 125000
    },
    {
      id: 4,
      name: "Retail Plaza",
      materials: 93000,
      labor: 115000
    },
    {
      id: 5,
      name: "Residential Complex",
      materials: 108000,
      labor: 96000
    }
  ]
};

// Mock users for avatar group
const mockUsers = [
  { name: "John Doe", image: undefined },
  { name: "Jane Smith", image: undefined },
  { name: "Robert Chen", image: undefined },
];

export default function DashboardPage() {
  const { navigateToTab } = useTabNavigation();
  const [, navigate] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAllProjects, setShowAllProjects] = useState(false);
  const { toast } = useToast();

  // Function to get unique color for each project based on ID
  const getProjectColor = (id: number): string => {
    // Our standardized color palette
    const colors = [
      "border-[#7E6551]", // brown
      "border-[#533747]", // taupe
      "border-[#466362]", // teal
      "border-[#8896AB]", // slate
      "border-[#C5D5E4]"  // blue
    ];

    // Use modulo to cycle through colors (ensures every project gets a color)
    return colors[(id - 1) % colors.length];
  };

  const { data: projects = [], isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: materials = [], isLoading: materialsLoading } = useQuery<any[]>({
    queryKey: ["/api/materials"],
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });

  // Compute dashboard metrics
  const metrics = {
    activeProjects: projects.filter((p: any) => p.status === "active").length || 0,
    openTasks: tasks.filter((t: any) => !t.completed).length || 0,
    pendingMaterials: materials.filter((m: any) => m.status === "ordered").length || 0,
    budgetUtilization: 72 // Hard-coded for now
  };

  // Upcoming deadlines
  const upcomingDeadlines = tasks.filter((task: any) => !task.completed)
    .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 4);
    
  // Calculate tier1 category progress for each project
  const calculateTier1Progress = (projectId: number) => {
    const projectTasks = tasks.filter((task: any) => task.projectId === projectId);
    
    // Create a map to ensure standardized naming for categories
    const standardizedCategoryMap: Record<string, string> = {
      'structural': 'structural',
      'structure': 'structural',
      'systems': 'systems',
      'system': 'systems',
      'sheathing': 'sheathing',
      'finishings': 'finishings',
      'finishing': 'finishings',
      'finishes': 'finishings'
    };
    
    // Group tasks by their explicit tier1Category field
    const tasksByTier1 = projectTasks.reduce((acc: Record<string, any[]>, task: any) => {
      if (!task.tier1Category) return acc;
      
      // Standardize the tier1 category name
      const tier1Raw = task.tier1Category.toLowerCase();
      const tier1 = standardizedCategoryMap[tier1Raw] || tier1Raw;
      
      if (!acc[tier1]) {
        acc[tier1] = [];
      }
      acc[tier1].push(task);
      return acc;
    }, {});
    
    // Calculate completion percentage for each tier
    const progressByTier: Record<string, number> = {
      structural: 0,
      systems: 0, 
      sheathing: 0,
      finishings: 0
    };
    
    console.log('Task categories found:', Object.keys(tasksByTier1));
    
    // Process each tier1 category
    Object.keys(progressByTier).forEach(tier => {
      const tierTasks = tasksByTier1[tier] || [];
      const totalTasks = tierTasks.length;
      const completedTasks = tierTasks.filter((task: any) => task.completed).length;
      
      progressByTier[tier] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    });
    
    console.log('Progress for project', projectId, ':', progressByTier);
    
    return progressByTier;
  };
  
  // Map to store project tier1 progress data
  const projectTier1Progress = projects.reduce((acc: Record<number, any>, project: any) => {
    acc[project.id] = calculateTier1Progress(project.id);
    
    // Calculate the average progress for each project (for display consistency)
    const totalProgress = Math.round(
      (acc[project.id].structural + acc[project.id].systems + 
       acc[project.id].sheathing + acc[project.id].finishings) / 4
    );
    
    // Update the project.progress value to match our calculated progress 
    // This ensures all progress bars show the same value
    // Set it to 45% for Riverside Apartments (id: 1) as requested, otherwise use calculated value
    if (project.id === 1) {
      project.progress = 45; // Hard-coded 45% for Riverside Apartments
    } else {
      project.progress = project.progress || totalProgress;
    }
    
    return acc;
  }, {});

  // Filter projects based on search query and status
  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.location?.toLowerCase()?.includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getProjectName = (projectId: number) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  const getDaysLeft = (endDate: string | Date) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (days: number) => {
    if (days < 0) return "text-red-600";
    if (days <= 3) return "text-red-600";
    if (days <= 7) return "text-amber-600";
    return "text-green-600";
  };

  const getGradientByStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "from-green-600 to-green-700";
      case "on_hold":
        return "from-blue-400 to-blue-500";
      default:
        return "from-blue-500 to-blue-600";
    }
  };

  const handleCreateProject = () => {
    setCreateDialogOpen(true);
  };

  if (projectsLoading || tasksLoading || materialsLoading || contactsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold hidden md:block">Dashboard</h2>

          <Carousel className="w-full max-w-5xl mx-auto relative"> {/* Carousel for loading state */}
            <CarouselContent>
              {[1, 2, 3, 4].map((i) => (
                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-20"></div>
                          <div className="h-6 bg-slate-200 rounded w-12"></div>
                        </div>
                        <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-32"></div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
            <CarouselNext className="right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
          </Carousel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="animate-pulse">
              <CardContent className="p-4 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-2 bg-slate-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="animate-pulse">
              <CardContent className="p-4 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="h-60 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold hidden md:block">Dashboard</h2>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-24"
            onClick={() => navigateToTab("tasks")}
          >
            <div className="w-10 h-10 bg-task bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <Plus className="text-task h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Add Task</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-24"
            onClick={() => navigateToTab("materials")}
          >
            <div className="w-10 h-10 bg-material bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <Settings className="text-material h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Update Inventory</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-24"
            onClick={() => navigateToTab("expenses")}
          >
            <div className="w-10 h-10 bg-expense bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <DollarSign className="text-expense h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Record Expense</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-24"
            onClick={() => navigateToTab("projects")}
          >
            <div className="w-10 h-10 bg-dashboard bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <ClipboardList className="text-dashboard h-5 w-5" />
            </div>
            <span className="text-sm font-medium">View Reports</span>
          </Button>
        </div>

        {/* Charts and Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress */}
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-200 p-4 flex justify-between items-center">
              <CardTitle className="font-medium">Project Progress</CardTitle>
              <Select defaultValue="30days">
                <SelectTrigger className="border border-slate-300 rounded-lg text-sm py-1 px-2 bg-white">
                  <SelectValue placeholder="Last 30 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {projects.map((project: any) => (
                <div key={project.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className="text-sm font-medium hover:text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      {project.name}
                    </span>
                    <span className="text-sm text-slate-500">{project.progress}%</span>
                  </div>
                  <ProgressBar
                    value={project.progress}
                    color={
                      // Use ID-based color for consistency
                      project.id === 1 ? "brown" :
                        project.id === 2 ? "taupe" :
                          project.id === 3 ? "teal" :
                            project.id === 4 ? "slate" : "blue"
                    }
                    showLabel={false}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-200 p-4 flex justify-between items-center">
              <CardTitle className="font-medium">Budget Overview</CardTitle>
              <Select defaultValue="all">
                <SelectTrigger className="border border-slate-300 rounded-lg text-sm py-1 px-2 bg-white">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-96 overflow-y-auto">
                <BudgetBarChart data={budgetData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Progress Charts */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Project Progress</h2>
            <Button variant="outline" className="text-sm" onClick={() => navigateToTab("tasks")}>
              View All Tasks
            </Button>
          </div>

          <Carousel className="w-full max-w-5xl mx-auto relative">
            <CarouselContent>
              {projects.map((project) => {
                const projectProgress = projectTier1Progress[project.id] || {
                  structural: 0,
                  systems: 0,
                  sheathing: 0,
                  finishings: 0
                };
                
                // Use the same progress value that's been synchronized for all displays
                const overallProgress = project.progress;
                
                return (
                  <CarouselItem key={project.id} className="md:basis-1/2 lg:basis-1/3 p-1">
                    <div className="space-y-4">
                      {/* Overall Project Progress Card */}
                      <Card className={`border-l-4 ${getProjectColor(project.id)} bg-white shadow-sm hover:shadow-md transition-all duration-200`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-md font-medium">{project.name}</h3>
                            <span className="text-sm font-medium bg-slate-100 rounded-full px-2 py-1">
                              {overallProgress}% Complete
                            </span>
                          </div>
                          <ProgressBar
                            value={overallProgress}
                            color={
                              project.id === 1 ? "brown" :
                                project.id === 2 ? "taupe" :
                                  project.id === 3 ? "teal" :
                                    project.id === 4 ? "slate" : "blue"
                            }
                            className="mb-2"
                          />
                        </CardContent>
                      </Card>
                      
                      {/* Systems Progress Card */}
                      <ProjectProgressChart
                        projectId={project.id}
                        projectName={project.name}
                        progress={projectProgress}
                      />
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
            <CarouselNext className="right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
          </Carousel>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Projects</h2>
            <Button className="bg-project hover:bg-blue-600" onClick={handleCreateProject}>
              <Plus className="mr-1 h-4 w-4" />
              Create New Project
            </Button>
          </div>

          <Card className="bg-white">
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border border-slate-300 rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="recent">
                  <SelectTrigger className="border border-slate-300 rounded-lg">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                    <SelectItem value="budget_high">Budget: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredProjects?.length === 0 ? (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">No projects found</h3>
              <p className="mt-2 text-sm text-slate-500">Get started by creating a new project</p>
              <Button className="mt-4 bg-project hover:bg-blue-600" onClick={handleCreateProject}>
                <Plus className="mr-1 h-4 w-4" />
                Create New Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Carousel className="w-full max-w-5xl mx-auto relative"> {/* Carousel for projects */}
                <CarouselContent>
                  {filteredProjects.slice(0, showAllProjects ? undefined : 3).map((project: any) => {
                    // Get tasks for this project
                    const projectTasks = tasks.filter((task: any) => task.projectId === project.id);

                    // Create task object that matches TaskAttachments interface requirements
                    const projectForTasks = {
                      id: project.id,
                      title: project.name,
                      description: project.description || undefined,
                      status: project.status,
                      startDate: project.startDate,
                      endDate: project.endDate,
                      projectId: project.id,
                      category: "project",
                      completed: project.status === "completed",
                      contactIds: Array.from(new Set(
                        projectTasks
                          .filter((task: any) => task.contactIds)
                          .flatMap((task: any) => Array.isArray(task.contactIds) ? task.contactIds : [])
                      )),
                      materialIds: Array.from(new Set(
                        projectTasks
                          .filter((task: any) => task.materialIds)
                          .flatMap((task: any) => Array.isArray(task.materialIds) ? task.materialIds : [])
                      ))
                    };

                    return (
                      <CarouselItem key={project.id} className="md:basis-1/2 lg:basis-1/3">
                        <Card
                          key={project.id}
                          className={`border-l-4 ${getProjectColor(project.id)} shadow-sm hover:shadow transition-shadow duration-200 cursor-pointer`}
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBgColor(project.status)}`}>
                                {project.status.replace('_', ' ')}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {project.location || "No location specified"}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(project.startDate)} - {formatDate(project.endDate)}
                            </div>

                            <div className="mt-2">
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className={
                                  // Use ID-based coloring for consistency with cards and progress section
                                  project.id === 1 ? "bg-[#7E6551] h-2 rounded-full" :
                                    project.id === 2 ? "bg-[#938581] h-2 rounded-full" :
                                      project.id === 3 ? "bg-[#466362] h-2 rounded-full" :
                                        project.id === 4 ? "bg-[#8896AB] h-2 rounded-full" :
                                          "bg-[#C5D5E4] h-2 rounded-full"
                                } style={{ width: `${project.progress}%` }}></div>
                              </div>
                              <div className="flex justify-between text-xs mt-1">
                                <span>{projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}</span>
                                <span>{project.progress}% Complete</span>
                              </div>
                            </div>

                            {/* Display project contact and material attachments */}
                            <TaskAttachments task={projectForTasks} className="mt-2" />
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
                <CarouselNext className="right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
              </Carousel>

              {filteredProjects && filteredProjects.length > 3 && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllProjects(!showAllProjects)}
                    className="flex items-center gap-1"
                  >
                    {showAllProjects ? (
                      <>Show Less <ChevronDown className="h-4 w-4" /></>
                    ) : (
                      <>Show More <ChevronRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Upcoming Deadlines */}
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="font-medium">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-200">
              {upcomingDeadlines?.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-slate-500">No upcoming deadlines</p>
                </div>
              ) : (
                upcomingDeadlines.map((task: any) => {
                  const daysLeft = getDaysLeft(task.endDate);
                  return (
                    <div key={task.id} className="p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{getProjectName(task.projectId)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getDeadlineColor(daysLeft)}`}>
                          {formatDate(task.endDate)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {daysLeft < 0 ? "Overdue" : `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project Creation Dialog */}
        <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </Layout>
  );
}