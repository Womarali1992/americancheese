import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  ChevronRight,
  ChevronLeft,
  Building,
  Hammer,
  Construction,
  HardHat,
  Zap,
  Droplet,
  Landmark,
  LayoutGrid,
  FileCheck,
  PanelTop,
  Sofa,
  Home,
  Fan,
  Mailbox,
  Layers,
  Columns,
  Grid,
  Paintbrush,
  FileText,
  CheckCircle,
  Circle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface AllQuotesViewProps {
  projectId: number;
}

export function AllQuotesView({ projectId }: AllQuotesViewProps) {
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Fetch all quotes (materials where isQuote=true)
  const { data: allQuotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/materials", { isQuote: true }],
  });

  // Fetch all tasks for the project
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: [`/api/tasks/project/${projectId}`],
  });

  // Fetch all suppliers
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });

  // Create supplier lookup map
  const supplierMap = useMemo(() => {
    const map: Record<number, any> = {};
    (suppliers as any[]).forEach((supplier: any) => {
      map[supplier.id] = supplier;
    });
    return map;
  }, [suppliers]);

  // Helper functions for tier icons and backgrounds
  const getTier1Icon = (tier1: string, className: string = "h-5 w-5") => {
    switch (tier1?.toLowerCase()) {
      case 'structural': return <Construction className={className} />;
      case 'systems': return <Zap className={className} />;
      case 'sheathing': return <Layers className={className} />;
      case 'finishings': return <Paintbrush className={className} />;
      default: return <Building className={className} />;
    }
  };

  const getTier1Background = (tier1: string) => {
    switch (tier1?.toLowerCase()) {
      case 'structural': return 'bg-green-600';
      case 'systems': return 'bg-blue-600';
      case 'sheathing': return 'bg-red-600';
      case 'finishings': return 'bg-amber-600';
      default: return 'bg-gray-600';
    }
  };

  const getTier2Icon = (tier2: string, className: string = "h-4 w-4") => {
    const tier2Lower = tier2?.toLowerCase();
    if (tier2Lower?.includes('electrical')) return <Zap className={className} />;
    if (tier2Lower?.includes('plumbing')) return <Droplet className={className} />;
    if (tier2Lower?.includes('hvac')) return <Fan className={className} />;
    if (tier2Lower?.includes('foundation')) return <Landmark className={className} />;
    if (tier2Lower?.includes('framing')) return <Grid className={className} />;
    if (tier2Lower?.includes('roofing')) return <Home className={className} />;
    if (tier2Lower?.includes('siding') || tier2Lower?.includes('exterior')) return <Building className={className} />;
    if (tier2Lower?.includes('insulation')) return <Layers className={className} />;
    if (tier2Lower?.includes('drywall')) return <PanelTop className={className} />;
    if (tier2Lower?.includes('flooring')) return <LayoutGrid className={className} />;
    if (tier2Lower?.includes('cabinet')) return <Sofa className={className} />;
    if (tier2Lower?.includes('trim')) return <Columns className={className} />;
    if (tier2Lower?.includes('paint')) return <Paintbrush className={className} />;
    return <FileCheck className={className} />;
  };

  const getTier2Background = (tier2: string) => {
    const tier2Lower = tier2?.toLowerCase();
    if (tier2Lower?.includes('electrical')) return 'bg-yellow-500';
    if (tier2Lower?.includes('plumbing')) return 'bg-blue-500';
    if (tier2Lower?.includes('hvac')) return 'bg-purple-500';
    if (tier2Lower?.includes('foundation')) return 'bg-stone-500';
    if (tier2Lower?.includes('framing')) return 'bg-amber-500';
    if (tier2Lower?.includes('roofing')) return 'bg-slate-500';
    if (tier2Lower?.includes('siding') || tier2Lower?.includes('exterior')) return 'bg-green-500';
    if (tier2Lower?.includes('insulation')) return 'bg-pink-500';
    if (tier2Lower?.includes('drywall')) return 'bg-gray-500';
    if (tier2Lower?.includes('flooring')) return 'bg-orange-500';
    if (tier2Lower?.includes('cabinet')) return 'bg-teal-500';
    if (tier2Lower?.includes('trim')) return 'bg-indigo-500';
    if (tier2Lower?.includes('paint')) return 'bg-red-500';
    return 'bg-slate-400';
  };

  // Group tasks by tier1 and tier2
  const tasksByTier = useMemo(() => {
    const grouped: Record<string, Record<string, any[]>> = {};
    
    tasks.forEach((task: any) => {
      const tier1 = task.tier1Category || 'Other';
      const tier2 = task.tier2Category || 'Other';
      
      if (!grouped[tier1]) grouped[tier1] = {};
      if (!grouped[tier1][tier2]) grouped[tier1][tier2] = [];
      
      grouped[tier1][tier2].push(task);
    });
    
    return grouped;
  }, [tasks]);

  // Get unique tier1 categories
  const tier1Categories = useMemo(() => {
    return Object.keys(tasksByTier).sort();
  }, [tasksByTier]);

  // Get tier2 categories for selected tier1
  const tier2Categories = useMemo(() => {
    if (!selectedTier1 || !tasksByTier[selectedTier1]) return [];
    return Object.keys(tasksByTier[selectedTier1]).sort();
  }, [tasksByTier, selectedTier1]);

  // Get tasks for selected tier1/tier2
  const tasksInCategory = useMemo(() => {
    if (!selectedTier1 || !selectedTier2 || !tasksByTier[selectedTier1]?.[selectedTier2]) return [];
    return tasksByTier[selectedTier1][selectedTier2];
  }, [tasksByTier, selectedTier1, selectedTier2]);

  // Get quotes for selected task with supplier info
  const quotesForTask = useMemo(() => {
    if (!selectedTask) return [];
    
    // Get all quotes and add supplier information
    const quotesWithSuppliers = (allQuotes.data || []).map((quote: any) => ({
      ...quote,
      supplier: quote.supplierId ? supplierMap[quote.supplierId] : null,
      isUsed: quote.isUsed || false // Assuming there's an isUsed field to track which quotes are selected
    }));

    // For now, return all quotes - in a real implementation, you'd filter by task/category
    return quotesWithSuppliers;
  }, [selectedTask, allQuotes, supplierMap]);

  if (quotesLoading || tasksLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Quotes View</h2>
        <p className="text-sm text-slate-500">Browse quotes by task hierarchy</p>
      </div>

      {/* Tier 1 Categories */}
      {!selectedTier1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tier1Categories.map((tier1) => {
            const tier2Count = Object.keys(tasksByTier[tier1] || {}).length;
            const taskCount = Object.values(tasksByTier[tier1] || {})
              .flat().length;
            
            return (
              <Card 
                key={tier1}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedTier1(tier1)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTier1Background(tier1)}`}>
                        {getTier1Icon(tier1, "h-5 w-5 text-white")}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tier1}</CardTitle>
                        <CardDescription>
                          {tier2Count} categories • {taskCount} tasks
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tier 2 Categories */}
      {selectedTier1 && !selectedTier2 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTier1(null)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to main categories
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 text-white`}
            >
              {getTier1Icon(selectedTier1, "h-4 w-4 text-white")}
              {selectedTier1}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tier2Categories.map((tier2) => {
              const tasksInTier2 = tasksByTier[selectedTier1]?.[tier2] || [];
              
              return (
                <Card 
                  key={tier2}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedTier2(tier2)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getTier2Background(tier2)}`}>
                          {getTier2Icon(tier2, "h-4 w-4 text-white")}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tier2}</CardTitle>
                          <CardDescription>
                            {tasksInTier2.length} tasks
                          </CardDescription>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Tasks in Selected Category */}
      {selectedTier1 && selectedTier2 && !selectedTask && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTier2(null)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to categories
            </Button>
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

          <div className="grid grid-cols-1 gap-4">
            {tasksInCategory.map((task) => (
              <Card 
                key={task.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedTask(task)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100">
                        <FileText className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        <CardDescription>
                          Task #{task.id} • Status: {task.status || 'Not Started'}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Quotes for Selected Task */}
      {selectedTask && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTask(null)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to tasks
            </Button>
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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">All Quotes from All Suppliers</h3>
            
            {quotesForTask.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-slate-500">No quotes found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quotesForTask.map((quote) => (
                  <Card key={quote.id} className={`border-l-4 ${quote.isUsed ? 'border-l-green-500 bg-green-50' : 'border-l-gray-300'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {quote.isUsed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <CardTitle className="text-base">{quote.name}</CardTitle>
                            <CardDescription>
                              {quote.supplier ? quote.supplier.name : 'Unknown Supplier'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={quote.isUsed ? "default" : "secondary"}>
                            {quote.isUsed ? "Selected" : "Available"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Quantity:</span>
                          <span className="font-medium">{quote.quantity} {quote.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Unit Price:</span>
                          <span className="font-medium">{formatCurrency(quote.cost || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm font-medium">Total:</span>
                          <span className="font-bold text-lg">
                            {formatCurrency((quote.cost || 0) * (quote.quantity || 0))}
                          </span>
                        </div>
                        {quote.quoteDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Quote Date:</span>
                            <span className="text-sm">{new Date(quote.quoteDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {quote.quoteNumber && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Quote #:</span>
                            <span className="text-sm font-mono">{quote.quoteNumber}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}