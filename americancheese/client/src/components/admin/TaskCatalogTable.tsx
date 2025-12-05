import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, ArrowUpDown, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnifiedColors } from "@/hooks/useUnifiedColors";

// Helper function to convert hex color to rgba
const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(156, 163, 175, ${alpha})`; // Default gray

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper function to lighten a hex color
const lightenColor = (hex: string, percent: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '#f3f4f6';

  const r = Math.min(255, parseInt(result[1], 16) + Math.round((255 - parseInt(result[1], 16)) * percent));
  const g = Math.min(255, parseInt(result[2], 16) + Math.round((255 - parseInt(result[2], 16)) * percent));
  const b = Math.min(255, parseInt(result[3], 16) + Math.round((255 - parseInt(result[3], 16)) * percent));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Get unique tier1 and tier2 categories from a list of tasks
const getAllCategories = (tasks: any[]) => {
  const tier1Set = new Set<string>();
  const tier2Set = new Set<string>();

  tasks.forEach((task) => {
    if (task.tier1Category) tier1Set.add(task.tier1Category);
    if (task.tier2Category) tier2Set.add(task.tier2Category);
  });

  return {
    tier1: Array.from(tier1Set).sort(),
    tier2: Array.from(tier2Set).sort(),
  };
};

// Color mapping for tier1 categories
const tier1Colors: Record<string, string> = {
  "Structural": "bg-green-100 text-green-800 border-green-300",
  "Systems": "bg-blue-100 text-blue-800 border-blue-300",
  "Sheathing": "bg-red-100 text-red-800 border-red-300",
  "Finishings": "bg-amber-100 text-amber-800 border-amber-300",
};

// Color mapping for tier2 categories
const tier2Colors: Record<string, string> = {
  "Foundation": "bg-slate-100 text-slate-700 border-slate-300",
  "Framing": "bg-zinc-100 text-zinc-700 border-zinc-300",
  "Roofing": "bg-stone-100 text-stone-700 border-stone-300",
  "Electrical": "bg-yellow-100 text-yellow-700 border-yellow-300",
  "Plumbing": "bg-cyan-100 text-cyan-700 border-cyan-300",
  "HVAC": "bg-sky-100 text-sky-700 border-sky-300",
  "Insulation": "bg-purple-100 text-purple-700 border-purple-300",
  "Drywall": "bg-gray-100 text-gray-700 border-gray-300",
  "Painting": "bg-pink-100 text-pink-700 border-pink-300",
  "Flooring": "bg-orange-100 text-orange-700 border-orange-300",
  "Cabinetry": "bg-brown-100 text-brown-700 border-brown-300",
  "Trim": "bg-indigo-100 text-indigo-700 border-indigo-300",
  "Exterior": "bg-emerald-100 text-emerald-700 border-emerald-300",
  "Landscaping": "bg-lime-100 text-lime-700 border-lime-300",
};

type SortField = "id" | "title" | "tier1Category" | "tier2Category" | "status";
type SortOrder = "asc" | "desc";

interface TaskCatalogTableProps {
  projectId?: number | null;
}

export default function TaskCatalogTable({ projectId }: TaskCatalogTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tier1Filter, setTier1Filter] = useState<string>("all");
  const [tier2Filter, setTier2Filter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Get project-specific color functions
  const { getTier1Color, getTier2Color } = useUnifiedColors(projectId);

  // Fetch actual tasks for this project from the database
  const { data: projectTasks = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !!projectId,
  });

  const categories = getAllCategories(projectTasks);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = projectTasks.filter((task: any) => {
      // Search filter
      const matchesSearch =
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id?.toString().includes(searchQuery.toLowerCase()) ||
        task.templateId?.toLowerCase().includes(searchQuery.toLowerCase());

      // Tier1 filter
      const matchesTier1 = tier1Filter === "all" || task.tier1Category === tier1Filter;

      // Tier2 filter
      const matchesTier2 = tier2Filter === "all" || task.tier2Category === tier2Filter;

      return matchesSearch && matchesTier1 && matchesTier2;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle string comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projectTasks, searchQuery, tier1Filter, tier2Filter, sortField, sortOrder]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Tier 1 Category", "Tier 2 Category", "Status", "Start Date", "End Date", "Description"];
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedTasks.map((task: any) =>
        [
          task.id,
          `"${(task.title || '').replace(/"/g, '""')}"`,
          task.tier1Category || '',
          task.tier2Category || '',
          task.status || '',
          task.startDate || '',
          task.endDate || '',
          `"${(task.description || '').replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-tasks-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return (
      <ArrowUpDown
        className={`w-3 h-3 ml-1 ${sortOrder === "asc" ? "rotate-180" : ""}`}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-xl border">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks by title, description, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Export Button */}
          <Button onClick={handleExportCSV} variant="outline" className="whitespace-nowrap">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Tier1 Filter */}
          <div className="flex-1">
            <Select value={tier1Filter} onValueChange={setTier1Filter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter by Tier 1" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tier 1 Categories</SelectItem>
                {categories.tier1.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tier2 Filter */}
          <div className="flex-1">
            <Select value={tier2Filter} onValueChange={setTier2Filter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter by Tier 2" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tier 2 Categories</SelectItem>
                {categories.tier2.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <span>Loading tasks...</span>
          ) : !projectId ? (
            <span className="text-amber-600 font-medium">Please select a project to view tasks</span>
          ) : (
            <>
              Showing <span className="font-semibold">{filteredAndSortedTasks.length}</span> of{" "}
              <span className="font-semibold">{projectTasks.length}</span> tasks for this project
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 transition-colors w-24"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center font-semibold">
                    ID
                    <SortIcon field="id" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 transition-colors min-w-[250px]"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center font-semibold">
                    Task Title
                    <SortIcon field="title" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 transition-colors w-36"
                  onClick={() => handleSort("tier1Category")}
                >
                  <div className="flex items-center font-semibold">
                    Tier 1
                    <SortIcon field="tier1Category" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 transition-colors w-36"
                  onClick={() => handleSort("tier2Category")}
                >
                  <div className="flex items-center font-semibold">
                    Tier 2
                    <SortIcon field="tier2Category" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 transition-colors w-32"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center font-semibold">
                    Status
                    <SortIcon field="status" />
                  </div>
                </TableHead>
                <TableHead className="w-28">
                  <span className="font-semibold">Dates</span>
                </TableHead>
                <TableHead className="min-w-[300px]">
                  <span className="font-semibold">Description</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!projectId ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Please select a project to view its tasks
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading tasks...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {projectTasks.length === 0 ? "No tasks created for this project yet" : "No tasks found matching your filters"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTasks.map((task: any) => (
                  <TableRow key={task.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-semibold">
                      {task.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {task.title}
                    </TableCell>
                    <TableCell>
                      {task.tier1Category ? (() => {
                        const baseColor = getTier1Color(task.tier1Category);
                        const bgColor = lightenColor(baseColor, 0.85);
                        const borderColor = lightenColor(baseColor, 0.4);
                        return (
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: bgColor,
                              color: baseColor,
                              borderColor: borderColor,
                              borderWidth: '1.5px'
                            }}
                          >
                            {task.tier1Category}
                          </Badge>
                        );
                      })() : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.tier2Category ? (() => {
                        const baseColor = getTier2Color(task.tier2Category, task.tier1Category);
                        const bgColor = lightenColor(baseColor, 0.85);
                        const borderColor = lightenColor(baseColor, 0.4);
                        return (
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: bgColor,
                              color: baseColor,
                              borderColor: borderColor,
                              borderWidth: '1.5px'
                            }}
                          >
                            {task.tier2Category}
                          </Badge>
                        );
                      })() : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={task.status === "completed" ? "default" : "outline"}
                        className={
                          task.status === "completed"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }
                      >
                        {task.status?.replace(/_/g, " ") || "not started"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{task.startDate || "-"}</div>
                      <div>{task.endDate || "-"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md">
                      <div className="line-clamp-2">
                        {task.description || "-"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
