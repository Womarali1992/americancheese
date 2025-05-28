import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, ArrowLeft, Package, Building, DollarSign, Layers, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AllQuotesViewProps {
  projectId: number;
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function AllQuotesView({ projectId }: AllQuotesViewProps) {
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Fetch tasks data
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/projects', projectId, 'tasks'],
    enabled: !!projectId
  });

  // Fetch all materials, then filter for quotes in this project
  const { data: allMaterials = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['/api/materials'],
    enabled: !!projectId
  });

  // Filter for quotes in this project
  const quotes = useMemo(() => {
    console.log("All materials received:", allMaterials);
    console.log("Project ID:", projectId);
    const quotesOnly = allMaterials.filter((material: any) => 
      material.isQuote === true && material.projectId === projectId
    );
    console.log("Filtered quotes for project:", quotesOnly);
    return quotesOnly;
  }, [allMaterials, projectId]);

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

  // Group quotes by tier1 categories, then by section and subsection
  const quotesGroupedByTier1 = useMemo(() => {
    const groups: Record<string, any[]> = {};
    quotes.forEach((quote: any) => {
      const tier1 = quote.tier ? quote.tier.charAt(0).toUpperCase() + quote.tier.slice(1) : "Other";
      if (!groups[tier1]) groups[tier1] = [];
      groups[tier1].push(quote);
    });
    return groups;
  }, [quotes]);

  // Group quotes by section and subsection within each tier
  const quotesGroupedBySection = useMemo(() => {
    const sectionGroups: Record<string, Record<string, Record<string, any[]>>> = {};
    
    Object.entries(quotesGroupedByTier1).forEach(([tier1, tierQuotes]) => {
      sectionGroups[tier1] = {};
      
      tierQuotes.forEach((quote: any) => {
        const section = quote.section || 'General';
        const subsection = quote.subsection || 'Other';
        
        if (!sectionGroups[tier1][section]) {
          sectionGroups[tier1][section] = {};
        }
        if (!sectionGroups[tier1][section][subsection]) {
          sectionGroups[tier1][section][subsection] = [];
        }
        sectionGroups[tier1][section][subsection].push(quote);
      });
    });
    
    return sectionGroups;
  }, [quotesGroupedByTier1]);

  // Get tier1 styling
  function getTier1Background(tier1: string) {
    const backgrounds: Record<string, string> = {
      "Structural": "bg-blue-500",
      "Systems": "bg-orange-500",
      "Sheathing": "bg-green-500", 
      "Finishings": "bg-purple-500",
      "Other": "bg-slate-500"
    };
    return backgrounds[tier1] || "bg-slate-500";
  }

  function getTier1Icon(tier1: string, className: string) {
    return <Package className={className} />;
  }

  if (tasksLoading || quotesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading quotes data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-6 w-6 text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-800">All Supplier Quotes</h2>
        <div className="ml-auto text-sm text-slate-500">
          {quotes.length} quotes total
        </div>
      </div>

      {Object.entries(quotesGroupedBySection).map(([tier1, sectionGroups]) => (
        <div key={tier1} className="space-y-6">
          {/* Tier1 Header */}
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg",
            getTier1Background(tier1)
          )}>
            {getTier1Icon(tier1, "h-6 w-6 text-white")}
            <h3 className="text-lg font-semibold text-white">{tier1}</h3>
            <div className="ml-auto text-white opacity-90">
              {Object.values(sectionGroups).reduce((total, subsectionGroups) => 
                total + Object.values(subsectionGroups).reduce((subTotal, quotes) => subTotal + quotes.length, 0), 0
              )} quotes
            </div>
          </div>

          {/* Sections within this Tier */}
          {Object.entries(sectionGroups).map(([section, subsectionGroups]) => {
            const sectionQuotes = Object.values(subsectionGroups).flat();
            const sectionValue = sectionQuotes.reduce((sum, quote) => sum + (quote.cost || 0) * quote.quantity, 0);
            
            return (
              <div key={`${tier1}-${section}`} className="space-y-4">
                {/* Section Header */}
                <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-orange-500" />
                    <h4 className="font-medium">{section}</h4>
                  </div>
                  <div className="text-sm font-medium text-green-700">
                    {formatCurrency(sectionValue)}
                  </div>
                </div>

                {/* Subsections within this Section */}
                {Object.entries(subsectionGroups).map(([subsection, subsectionQuotes]) => (
                  <Collapsible key={`${tier1}-${section}-${subsection}`} className="mb-3 border rounded-lg overflow-hidden">
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="bg-slate-50 p-2 border-b hover:bg-slate-100 transition-colors flex justify-between items-center">
                        <div className="flex items-center gap-2 pl-2 border-l-4 border-orange-200">
                          <ArrowRight className="h-4 w-4 text-orange-400" />
                          <h5 className="font-medium text-sm text-slate-700">{subsection}</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600">
                            {subsectionQuotes.length} quotes
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3">
                        <div className="grid grid-cols-1 gap-3">
                          {subsectionQuotes.map((quote: any) => (
                            <Card key={quote.id} className={cn(
                              "transition-all hover:shadow-md",
                              quote.status === "ordered" ? "border-green-500 bg-green-50" : "border-gray-200"
                            )}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Building className="h-5 w-5" />
                                    {quote.supplier || 'Unknown Supplier'}
                                  </CardTitle>
                                  <div className="flex items-center gap-2">
                                    {quote.status === "ordered" ? (
                                      <Badge className="bg-green-500 text-white">Purchased</Badge>
                                    ) : (
                                      <Badge variant="outline">Quote Only</Badge>
                                    )}
                                    <div className="text-right">
                                      <div className="font-semibold">{formatCurrency(quote.cost * quote.quantity)}</div>
                                      <div className="text-xs text-slate-500">Quote #{quote.quoteNumber}</div>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-sm font-medium text-slate-600">Material</div>
                                    <div className="text-sm">{quote.name}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-600">Quantity</div>
                                    <div className="text-sm">{quote.quantity} {quote.unit}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-600">Unit Cost</div>
                                    <div className="text-sm">{formatCurrency(quote.cost)}</div>
                                  </div>
                                </div>
                                {quote.quoteDate && (
                                  <div className="mt-3 pt-3 border-t border-slate-200">
                                    <div className="text-xs text-slate-500">
                                      Quote Date: {formatDate(quote.quoteDate)}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            );
          })}
        </div>
      ))}

      {quotes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-slate-500">No quotes available for this project</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}