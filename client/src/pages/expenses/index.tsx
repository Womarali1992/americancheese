import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
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
import { formatCurrency, formatDate } from "@/lib/utils";
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
  User
} from "lucide-react";

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/expenses"],
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
      return apiRequest(`/api/expenses/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Expense deleted",
        description: "The expense has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setDeleteAlertOpen(false);
      setSelectedExpense(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete expense:", error);
    },
  });

  const handleDelete = () => {
    if (selectedExpense) {
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
      cell: (row) => (
        <span className="text-slate-500 capitalize">{row.category}</span>
      ),
    },
    {
      header: "Project",
      accessorKey: "projectId",
      cell: (row) => (
        <span className="text-slate-500">{getProjectName(row.projectId)}</span>
      ),
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
        <span className="font-medium text-right block">{formatCurrency(row.amount)}</span>
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
            <Button variant="outline" className="bg-white border border-slate-300 text-slate-700">
              <Download className="mr-1 h-4 w-4" />
              Export Reports
            </Button>
            <Button className="bg-expense hover:bg-teal-600">
              <Plus className="mr-1 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500">Total Budget</p>
                  <p className="text-2xl font-semibold mt-1">{formatCurrency(totalBudget)}</p>
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
                  <p className="text-2xl font-semibold mt-1">{formatCurrency(totalSpent)}</p>
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
                  <p className="text-2xl font-semibold mt-1">{formatCurrency(budgetRemaining)}</p>
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
                {/* Chart Placeholder */}
                <div className="w-full grid grid-cols-5 gap-2 h-48 items-end px-4">
                  <div className="flex flex-col items-center">
                    <div className="w-full bg-expense h-[30%] rounded-t-md"></div>
                    <span className="text-xs mt-2">Materials</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full bg-project h-[45%] rounded-t-md"></div>
                    <span className="text-xs mt-2">Labor</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full bg-purple-500 h-[15%] rounded-t-md"></div>
                    <span className="text-xs mt-2">Equipment</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full bg-amber-500 h-[25%] rounded-t-md"></div>
                    <span className="text-xs mt-2">Permits</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full bg-slate-500 h-[10%] rounded-t-md"></div>
                    <span className="text-xs mt-2">Misc</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="border border-slate-200 rounded-md p-3 text-center">
                  <p className="text-sm text-slate-500">Materials</p>
                  <p className="text-lg font-semibold">{formatCurrency(576000)}</p>
                </div>
                <div className="border border-slate-200 rounded-md p-3 text-center">
                  <p className="text-sm text-slate-500">Labor</p>
                  <p className="text-lg font-semibold">{formatCurrency(420000)}</p>
                </div>
                <div className="border border-slate-200 rounded-md p-3 text-center">
                  <p className="text-sm text-slate-500">Other</p>
                  <p className="text-lg font-semibold">{formatCurrency(204000)}</p>
                </div>
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
                    <p className="font-medium text-expense">{formatCurrency(expense.amount)}</p>
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
            <CardTitle className="font-medium">All Expenses</CardTitle>
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
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="border border-slate-300 rounded-lg text-sm py-1.5 px-3 bg-white">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </Layout>
  );
}
