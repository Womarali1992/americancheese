import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, calculateTotal } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreateExpenseDialog } from "./CreateExpenseDialog";
import { EditExpenseDialog } from "./EditExpenseDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  DollarSign,
  Wallet,
  PieChart,
  Package,
  User,
  Building,
  ArrowLeft
} from "lucide-react";

export default function ExpensesPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectIdFromUrl = params.projectId ? Number(params.projectId) : undefined;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState(projectIdFromUrl ? projectIdFromUrl.toString() : "all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  // Tracking which expense breakdown to show: 'default', 'materials', or 'labor'
  const [breakdownView, setBreakdownView] = useState<'default' | 'materials' | 'labor'>('default');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Update projectFilter when URL parameter changes
  useEffect(() => {
    if (projectIdFromUrl) {
      setProjectFilter(projectIdFromUrl.toString());
    }
  }, [projectIdFromUrl]);
  
  // Handle project selection
  const handleProjectChange = (selectedId: string) => {
    setProjectFilter(selectedId);
    
    // Update URL if not "all"
    if (selectedId !== "all") {
      setLocation(`/expenses?projectId=${selectedId}`);
    } else {
      setLocation('/expenses');
    }
  };

  // Determine whether to fetch all expenses or just expenses for a selected project
  const expensesQueryKey = projectFilter !== "all" 
    ? ["/api/projects", Number(projectFilter), "expenses"] 
    : ["/api/expenses"];

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: expensesQueryKey,
    queryFn: async () => {
      const url = projectFilter !== "all" 
        ? `/api/projects/${projectFilter}/expenses` 
        : "/api/expenses";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      return response.json();
    },
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Calculate totals and breakdowns
  const totalBudget = 1665000; // Example total budget
  const totalSpent = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const budgetRemaining = totalBudget - totalSpent;
  const budgetPercentage = Math.round((totalSpent / totalBudget) * 100);

  // Category breakdown for chart
  const categoryAmounts = expenses?.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Get top 5 material expenses
  const getTopMaterialExpenses = () => {
    if (!expenses) return [];
    
    // Filter expenses that are related to materials
    const materialExpenses = expenses
      .filter(expense => expense.category.toLowerCase().includes('material'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
      
    return materialExpenses.map(expense => ({
      name: expense.description,
      amount: expense.amount,
      percentage: Math.round((expense.amount / totalSpent) * 100)
    }));
  };
  
  // Get top 5 labor expenses
  const getTopLaborExpenses = () => {
    if (!expenses) return [];
    
    // Filter expenses that are related to labor
    const laborExpenses = expenses
      .filter(expense => expense.category.toLowerCase().includes('labor') || 
                         expense.category.toLowerCase().includes('staff') ||
                         expense.category.toLowerCase().includes('contractor'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
      
    return laborExpenses.map(expense => ({
      name: expense.description,
      amount: expense.amount,
      percentage: Math.round((expense.amount / totalSpent) * 100)
    }));
  };
  
  // Get the expense data based on selected view
  const getExpenseData = () => {
    if (breakdownView === 'materials') {
      return getTopMaterialExpenses();
    } else if (breakdownView === 'labor') {
      return getTopLaborExpenses();
    }
    
    // Default view - return standard categories
    return [
      { name: 'Materials', amount: 576000, percentage: 48 },
      { name: 'Labor', amount: 420000, percentage: 35 },
      { name: 'Equipment', amount: 180000, percentage: 15 },
      { name: 'Permits', amount: 125000, percentage: 10 },
      { name: 'Misc', amount: 79000, percentage: 6 }
    ];
  };

  // Filter expenses based on search and filters
  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          expense.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || expense.projectId.toString() === projectFilter;
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    
    return matchesSearch && matchesProject && matchesCategory;
  });

  // Function to get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  // Table columns definition
  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`Sending DELETE request to /api/expenses/${id}`);
      try {
        // Using fetch directly for better error handling and debugging
        const response = await fetch(`/api/expenses/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        console.log(`Delete expense response status:`, response.status);
        
        if (!response.ok) {
          // Try to get the error message from the response
          let errorText = "";
          try {
            const errorData = await response.json();
            errorText = errorData.message || `Status ${response.status}`;
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          
          throw new Error(`Failed to delete expense: ${errorText}`);
        }
        
        return true;
      } catch (err) {
        console.error("Error in delete mutation:", err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "Expense deleted",
        description: "The expense has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      // Also invalidate project-specific expenses if we're viewing a specific project
      if (projectFilter !== "all") {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/projects", Number(projectFilter), "expenses"] 
        });
      }
      setDeleteAlertOpen(false);
      setSelectedExpense(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete expense: ${error instanceof Error ? error.message : "Please try again."}`,
        variant: "destructive",
      });
      console.error("Failed to delete expense:", error);
    },
  });

  const handleDelete = () => {
    if (selectedExpense) {
      console.log("Deleting expense with ID:", selectedExpense.id);
      console.log("Selected expense:", selectedExpense);
      deleteExpenseMutation.mutate(selectedExpense.id);
    }
  };

  const columns = [
    {
      header: "Date",
      accessorKey: "date",
      cell: (row) => formatDate(row.date),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (row) => (
        <span className="font-medium text-slate-800">{row.description}</span>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (row) => {
        let colorClass = "text-slate-500";
        
        // Assign colors based on category to match the buttons
        if (row.category.toLowerCase().includes('material')) {
          colorClass = "text-[#f97316]"; // Orange color to match materials button
        } else if (row.category.toLowerCase().includes('labor') || 
                   row.category.toLowerCase().includes('staff') ||
                   row.category.toLowerCase().includes('contractor')) {
          colorClass = "text-[#a855f7]"; // Purple color to match labor button
        } else if (row.category.toLowerCase() === 'equipment') {
          colorClass = "text-blue-500";
        } else if (row.category.toLowerCase() === 'permits') {
          colorClass = "text-green-500";
        }
        
        return (
          <span className={`${colorClass} capitalize font-medium`}>{row.category}</span>
        );
      },
    },
    {
      header: "Project",
      accessorKey: "projectId",
      cell: (row) => {
        // Use the exact set of colors provided by the user
        const projectColors = {
          1: "text-[#7E6551]", // Brown
          2: "text-[#533747]", // Taupe
          3: "text-[#466362]", // Teal
          4: "text-[#8896AB]", // Slate
          5: "text-[#C5D5E4]"  // Light blue
        };
        
        // Find the project ID and get its color, or use brown (#7E6551) as default
        const projectId = typeof row.projectId === 'number' ? row.projectId : parseInt(row.projectId as string);
        const colorClass = projectColors[projectId] || "text-[#7E6551]";
        
        return (
          <span className={`${colorClass} font-medium`}>{getProjectName(row.projectId)}</span>
        );
      },
    },
    {
      header: "Vendor",
      accessorKey: "vendor",
      cell: (row) => (
        <span className="text-slate-500">{row.vendor || "—"}</span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      className: "text-right",
      cell: (row) => (
        <span className="font-medium text-right block text-[#084f09]">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'paid' ? 'bg-green-100 text-green-700' : 
          row.status === 'approved' ? 'bg-blue-100 text-blue-700' : 
          'bg-amber-100 text-amber-700'
        }`}>
          {row.status || "pending"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-slate-600"
            title="View expense details"
            onClick={() => {
              setSelectedExpense(row);
              setEditExpenseOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-slate-600"
            title="Edit expense"
            onClick={() => {
              setSelectedExpense(row);
              setEditExpenseOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-red-600"
            title="Delete expense"
            onClick={() => {
              setSelectedExpense(row);
              setDeleteAlertOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ];

  if (expensesLoading || projectsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold hidden md:block">Expenses & Reports</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white">
                <Download className="mr-1 h-4 w-4" />
                Export Reports
              </Button>
              <Button className="bg-expense hover:bg-teal-600">
                <Plus className="mr-1 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="animate-pulse">
                <CardHeader className="border-b border-slate-200 p-4">
                  <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-64 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            </div>
            <Card className="animate-pulse">
              <CardHeader className="border-b border-slate-200 p-4">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent className="divide-y divide-slate-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ))}
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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold hidden md:block">Expenses & Reports</h2>
          <div className="flex gap-2">
            <ProjectSelector 
              selectedProjectId={projectFilter} 
              onChange={handleProjectChange}
              className="w-[180px]"
            />
            <Button variant="outline" className="bg-white border border-slate-300 text-slate-700">
              <Download className="mr-1 h-4 w-4" />
              Export Reports
            </Button>
            <Button 
              className="bg-expense hover:bg-teal-600"
              onClick={() => setCreateExpenseOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
        
        {/* Show selected project banner if a project is selected */}
        {projectFilter !== "all" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-expense bg-opacity-5 border border-expense border-opacity-20 rounded-lg">
            <Building className="h-5 w-5 text-expense" />
            <div>
              <h3 className="text-sm font-medium">{getProjectName(Number(projectFilter))}</h3>
              <p className="text-xs text-muted-foreground">Expenses for this project</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-slate-400 hover:text-slate-600" 
              onClick={() => handleProjectChange("all")}
            >
              <span className="sr-only">Show all expenses</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500">Total Budget</p>
                  <p className="text-2xl font-semibold mt-1 text-[#084f09]">{formatCurrency(totalBudget)}</p>
                </div>
                <div className="bg-expense bg-opacity-10 p-2 rounded-lg">
                  <PieChart className="text-expense h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-slate-500">For all active projects</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500">Total Spent</p>
                  <p className="text-2xl font-semibold mt-1 text-[#084f09]">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="bg-expense bg-opacity-10 p-2 rounded-lg">
                  <DollarSign className="text-expense h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-amber-500 flex items-center mr-1">
                  <ArrowUp className="h-3 w-3" />
                  <span>{formatCurrency(86000)}</span>
                </span>
                <span className="text-slate-500">from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500">Budget Remaining</p>
                  <p className="text-2xl font-semibold mt-1 text-[#084f09]">{formatCurrency(budgetRemaining)}</p>
                </div>
                <div className="bg-expense bg-opacity-10 p-2 rounded-lg">
                  <Wallet className="text-expense h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 flex items-center mr-1">
                  <span>{Math.round((budgetRemaining / totalBudget) * 100)}% remaining</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense Chart and Recent Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expense Chart */}
          <Card className="bg-white lg:col-span-2">
            <CardHeader className="border-b border-slate-200 p-4 flex justify-between items-center">
              <CardTitle className="font-medium">Expense Breakdown</CardTitle>
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
            <CardContent className="p-4">
              <div className="h-64 flex items-center justify-center">
                {/* Horizontal Progress Bars */}
                <div className="w-full space-y-4 px-4">
                  {/* Dynamic expense breakdown based on selected view */}
                  {getExpenseData().map((item, index) => (
                    <div className="space-y-1" key={index}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-[#084f09]">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            breakdownView === 'materials' 
                              ? 'bg-orange-500' 
                              : breakdownView === 'labor' 
                                ? 'bg-purple-500' 
                                : index === 0 
                                  ? 'bg-expense' 
                                  : index === 1 
                                    ? 'bg-project' 
                                    : index === 2 
                                      ? 'bg-purple-500' 
                                      : index === 3 
                                        ? 'bg-amber-500' 
                                        : 'bg-slate-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <button 
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground h-auto px-4 py-3 ${breakdownView === 'materials' ? 'bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                  onClick={() => setBreakdownView(breakdownView === 'materials' ? 'default' : 'materials')}
                >
                  <div className="text-center">
                    <p className="text-sm">Materials</p>
                    <p className="text-lg font-semibold">{formatCurrency(576000)}</p>
                  </div>
                </button>
                <button 
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground h-auto px-4 py-3 ${breakdownView === 'labor' ? 'bg-purple-600' : 'bg-purple-500 hover:bg-purple-600'}`}
                  onClick={() => setBreakdownView(breakdownView === 'labor' ? 'default' : 'labor')}
                >
                  <div className="text-center">
                    <p className="text-sm">Labor</p>
                    <p className="text-lg font-semibold">{formatCurrency(420000)}</p>
                  </div>
                </button>
                <button 
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground h-auto px-4 py-3 ${breakdownView === 'default' ? 'bg-teal-600' : 'bg-teal-500 hover:bg-teal-600'}`}
                  onClick={() => setBreakdownView('default')}
                >
                  <div className="text-center">
                    <p className="text-sm">All Expenses</p>
                    <p className="text-lg font-semibold">{formatCurrency(204000)}</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Expenses */}
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="font-medium">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-200">
              {filteredExpenses?.slice(0, 5).map(expense => (
                <div key={expense.id} className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium">{expense.description}</p>
                    <p className="font-medium text-[#084f09]">{formatCurrency(expense.amount)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <p>{getProjectName(expense.projectId)}</p>
                    <p>{formatDate(expense.date)}</p>
                  </div>
                </div>
              ))}
              {filteredExpenses?.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-slate-500">No recent expenses</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expense Table */}
        <Card className="bg-white">
          <CardHeader className="border-b border-slate-200 p-4 flex justify-between items-center">
            <div>
              <CardTitle className="font-medium">All Expenses</CardTitle>
              {filteredExpenses && filteredExpenses.length > 0 && (
                <p className="text-sm mt-1">
                  Total: <span className="text-[#084f09] font-medium">{formatCurrency(calculateTotal(filteredExpenses))}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search expenses..."
                  className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border border-slate-300 rounded-lg text-sm py-1.5 px-3 bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <DataTable
            columns={columns}
            data={filteredExpenses || []}
          />
          
          <CardFooter className="bg-white px-4 py-3 border-t border-slate-200">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredExpenses?.length || 0}</span> of <span className="font-medium">{expenses?.length || 0}</span> results
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-slate-500">
                  <ArrowUp className="h-4 w-4 rotate-90" />
                </Button>
                <Button variant="outline" size="sm" className="bg-expense bg-opacity-10 text-expense">
                  1
                </Button>
                <Button variant="outline" size="sm" className="text-slate-500">
                  2
                </Button>
                <Button variant="outline" size="sm" className="text-slate-500">
                  3
                </Button>
                <Button variant="outline" size="sm" disabled className="text-slate-700">
                  ...
                </Button>
                <Button variant="outline" size="sm" className="text-slate-500">
                  <ArrowDown className="h-4 w-4 rotate-90" />
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Create Expense Dialog */}
      <CreateExpenseDialog
        open={createExpenseOpen}
        onOpenChange={setCreateExpenseOpen}
        projectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
      />

      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        open={editExpenseOpen}
        onOpenChange={setEditExpenseOpen}
        expense={selectedExpense}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this expense record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
