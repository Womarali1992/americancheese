import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ArrowLeft, Package, Building, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface AllQuotesViewProps {
  projectId: number;
}

export function AllQuotesView({ projectId }: AllQuotesViewProps) {
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Fetch tasks data
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/projects', projectId, 'tasks'],
    enabled: !!projectId
  });

  // Fetch quotes data (materials with isQuote=true)
  const { data: allQuotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['/api/materials?isQuote=true'],
    enabled: !!projectId
  });

  // Filter quotes for this project
  const quotes = useMemo(() => {
    console.log("All quotes received:", allQuotes);
    console.log("Project ID:", projectId);
    const filtered = allQuotes.filter((quote: any) => quote.projectId === projectId);
    console.log("Filtered quotes for project:", filtered);
    return filtered;
  }, [allQuotes, projectId]);

  // Fetch suppliers data
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    enabled: !!projectId
  });

  // Create supplier map for quick lookup
  const supplierMap = useMemo(() => {
    const map: Record<number, any> = {};
    suppliers.forEach((supplier: any) => {
      map[supplier.id] = supplier;
    });
    return map;
  }, [suppliers]);

  // Group tasks by tier1 categories
  const tier1Groups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    tasks.forEach((task: any) => {
      const tier1 = task.tier1 || "Other";
      if (!groups[tier1]) groups[tier1] = [];
      groups[tier1].push(task);
    });
    return groups;
  }, [tasks]);

  // Group tasks by tier2 within selected tier1
  const tier2Groups = useMemo(() => {
    if (!selectedTier1) return {};
    const tier1Tasks = tier1Groups[selectedTier1] || [];
    const groups: Record<string, any[]> = {};
    tier1Tasks.forEach((task: any) => {
      const tier2 = task.tier2 || "Other";
      if (!groups[tier2]) groups[tier2] = [];
      groups[tier2].push(task);
    });
    return groups;
  }, [selectedTier1, tier1Groups]);

  // Get tasks for selected tier2
  const availableTasks = useMemo(() => {
    if (!selectedTier1 || !selectedTier2) return [];
    return tier2Groups[selectedTier2] || [];
  }, [selectedTier1, selectedTier2, tier2Groups]);

  // Get quotes for selected task with supplier info
  const quotesForTask = useMemo(() => {
    if (!selectedTask) return [];
    
    // Get all quotes and add supplier information
    const quotesWithSuppliers = quotes.map((quote: any) => ({
      ...quote,
      supplier: quote.supplierId ? supplierMap[quote.supplierId] : null,
      isUsed: quote.isUsed || Math.random() > 0.5 // Mock selection status for demo
    }));

    // For demo purposes, return all quotes - in real implementation filter by task
    return quotesWithSuppliers;
  }, [selectedTask, quotes, supplierMap]);

  // Get tier1 styling
  function getTier1Background(tier1: string) {
    const backgrounds: Record<string, string> = {
      "Structural Systems": "bg-blue-500",
      "Sheathing": "bg-green-500", 
      "Finishings": "bg-purple-500",
      "Other": "bg-slate-500"
    };
    return backgrounds[tier1] || "bg-slate-500";
  }

  function getTier1Icon(tier1: string, className: string) {
    return <Package className={className} />;
  }

  function getTier2Background(tier2: string) {
    return "bg-orange-500";
  }

  function getTier2Icon(tier2: string, className: string) {
    return <Building className={className} />;
  }

  if (tasksLoading || quotesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading quotes data...</div>
      </div>
    );
  }

  // Show tier1 selection
  if (!selectedTier1) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Package className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">All Quotes View</h3>
          <div className="text-sm text-slate-500">• Select a category to view quotes from all suppliers</div>
        </div>
        
        <div className="grid gap-3">
          {Object.keys(tier1Groups).map((tier1) => (
            <Button
              key={tier1}
              variant="outline"
              onClick={() => setSelectedTier1(tier1)}
              className="text-left justify-start h-auto px-6 py-4"
            >
              <ChevronRight className="mr-2 h-4 w-4" />
              {tier1}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Show tier2 selection
  if (!selectedTier2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTier1(null)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 text-white`}
            >
              {getTier1Icon(selectedTier1, "h-4 w-4 text-white")}
              {selectedTier1}
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          {Object.keys(tier2Groups).map((tier2) => (
            <Button
              key={tier2}
              variant="outline"
              onClick={() => setSelectedTier2(tier2)}
              className="text-left justify-start h-auto px-6 py-4"
            >
              <ChevronRight className="mr-2 h-4 w-4" />
              {tier2}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Show task selection
  if (!selectedTask) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTier2(null)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 text-white`}
            >
              {getTier1Icon(selectedTier1, "h-4 w-4 text-white")}
              {selectedTier1}
            </Button>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Button
              variant="ghost"
              size="sm"
              className={`px-2 py-1 ${getTier2Background(selectedTier2)} rounded-full text-sm font-medium flex items-center gap-1 text-white`}
            >
              {getTier2Icon(selectedTier2, "h-4 w-4 text-white")}
              {selectedTier2}
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          {availableTasks.map((task: any) => (
            <Button
              key={task.id}
              variant="outline"
              onClick={() => setSelectedTask(task)}
              className="text-left justify-start h-auto px-6 py-4"
            >
              <ChevronRight className="mr-2 h-4 w-4" />
              <div>
                <div className="font-medium">{task.title}</div>
                {task.description && (
                  <div className="text-sm text-slate-500 mt-1">
                    {task.description.substring(0, 100)}...
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Show quotes for selected task
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTask(null)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 text-white`}
          >
            {getTier1Icon(selectedTier1, "h-4 w-4 text-white")}
            {selectedTier1}
          </Button>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <Button
            variant="ghost"
            size="sm"
            className={`px-2 py-1 ${getTier2Background(selectedTier2)} rounded-full text-sm font-medium flex items-center gap-1 text-white`}
          >
            {getTier2Icon(selectedTier2, "h-4 w-4 text-white")}
            {selectedTier2}
          </Button>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <div className="px-2 py-1 bg-slate-100 rounded-full text-sm font-medium">
            {selectedTask.title.substring(0, 50)}...
          </div>
        </div>
      </div>

      {/* Quotes Display */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">
            All Supplier Quotes for: {selectedTask.title}
          </h3>
        </div>

        {quotesForTask.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-slate-500">No quotes available for this task</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {quotesForTask.map((quote: any, index: number) => (
              <Card key={quote.id || index} className={cn(
                "transition-all hover:shadow-md",
                quote.isUsed && "border-green-500 bg-green-50"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {quote.supplier?.name || `Supplier ${index + 1}`}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {quote.isUsed ? (
                        <Badge className="bg-green-500 text-white">Selected</Badge>
                      ) : (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-600">Material</div>
                      <div className="text-lg">{quote.materialName || quote.name || "Material Name"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Price per Unit</div>
                      <div className="text-lg font-semibold text-green-600">
                        ${quote.cost || quote.price || (Math.random() * 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Quantity Available</div>
                      <div className="text-lg">{quote.quantity || Math.floor(Math.random() * 1000)} {quote.unit || "units"}</div>
                    </div>
                  </div>
                  
                  {quote.supplier && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>Contact: {quote.supplier.email || "contact@supplier.com"}</span>
                        <span>Phone: {quote.supplier.phone || "(555) 123-4567"}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}