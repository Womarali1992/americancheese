import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, ArrowLeft, Package, Building, DollarSign, Layers, ArrowRight, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateInvoiceFromMaterials } from "@/components/invoices/CreateInvoiceFromMaterials";

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
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());

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

  // Group quotes by section and subsection within each tier, then by quote number
  const quotesGroupedBySection = useMemo(() => {
    const sectionGroups: Record<string, Record<string, Record<string, Record<string, any[]>>>> = {};
    
    Object.entries(quotesGroupedByTier1).forEach(([tier1, tierQuotes]) => {
      sectionGroups[tier1] = {};
      
      tierQuotes.forEach((quote: any) => {
        const section = quote.section || 'General';
        const subsection = quote.subsection || 'Other';
        const quoteNumber = quote.quoteNumber || 'No Quote Number';
        
        if (!sectionGroups[tier1][section]) {
          sectionGroups[tier1][section] = {};
        }
        if (!sectionGroups[tier1][section][subsection]) {
          sectionGroups[tier1][section][subsection] = {};
        }
        if (!sectionGroups[tier1][section][subsection][quoteNumber]) {
          sectionGroups[tier1][section][subsection][quoteNumber] = [];
        }
        sectionGroups[tier1][section][subsection][quoteNumber].push(quote);
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

  // Helper function to toggle quote expansion
  const toggleQuoteExpansion = (quoteKey: string) => {
    const newExpanded = new Set(expandedQuotes);
    if (newExpanded.has(quoteKey)) {
      newExpanded.delete(quoteKey);
    } else {
      newExpanded.add(quoteKey);
    }
    setExpandedQuotes(newExpanded);
  };


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
        <div className="ml-auto flex items-center gap-4">
          {quotes.length > 0 && (
            <Button 
              onClick={() => setCreateInvoiceDialogOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="h-4 w-4" />
              Create Invoice
            </Button>
          )}
          <div className="text-sm text-slate-500">
            {quotes.length} quotes total
          </div>
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
                total + Object.values(subsectionGroups).reduce((subTotal, quoteGroups) => 
                  subTotal + Object.values(quoteGroups).reduce((qTotal, materials) => qTotal + materials.length, 0), 0
                ), 0
              )} quotes
            </div>
          </div>

          {/* Sections within this Tier */}
          {Object.entries(sectionGroups).map(([section, subsectionGroups]) => {
            const sectionQuotes = Object.values(subsectionGroups).flatMap(quoteGroups => Object.values(quoteGroups)).flat();
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
                {Object.entries(subsectionGroups).map(([subsection, quoteGroups]) => {
                  const totalQuotesInSubsection = Object.values(quoteGroups).reduce((total, quotes) => total + quotes.length, 0);
                  
                  return (
                    <Collapsible key={`${tier1}-${section}-${subsection}`} className="mb-3 border rounded-lg overflow-hidden">
                      <CollapsibleTrigger className="w-full text-left">
                        <div className="bg-slate-50 p-2 border-b hover:bg-slate-100 transition-colors flex justify-between items-center">
                          <div className="flex items-center gap-2 pl-2 border-l-4 border-orange-200">
                            <ArrowRight className="h-4 w-4 text-orange-400" />
                            <h5 className="font-medium text-sm text-slate-700">{subsection}</h5>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600">
                              {totalQuotesInSubsection} materials • {Object.keys(quoteGroups).length} quotes
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-400 transition-transform" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 space-y-4">
                          {/* Group by Quote Number */}
                          {Object.entries(quoteGroups).map(([quoteNumber, quoteMaterials]) => {
                            const quoteTotal = quoteMaterials.reduce((sum, material) => sum + (material.cost || 0) * material.quantity, 0);
                            const firstMaterial = quoteMaterials[0];
                            const quoteKey = `${tier1}-${section}-${subsection}-${quoteNumber}`;
                            const isExpanded = expandedQuotes.has(quoteKey);

                            return (
                              <div key={quoteKey} className="border rounded-lg overflow-hidden">
                                {/* Quote Header - Made Clickable */}
                                <div
                                  className="bg-blue-50 p-3 border-b cursor-pointer hover:bg-blue-100 transition-colors"
                                  onClick={() => toggleQuoteExpansion(quoteKey)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Building className="h-5 w-5 text-blue-600" />
                                      <div>
                                        <h6 className="font-medium text-blue-900">
                                          {firstMaterial.supplier || 'Unknown Supplier'}
                                        </h6>
                                        <p className="text-xs text-blue-700">Quote #{quoteNumber}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <div className="flex items-center gap-2">
                                          {firstMaterial.status === "ordered" ? (
                                            <Badge className="bg-green-500 text-white">Purchased</Badge>
                                          ) : (
                                            <Badge variant="outline">Quote Only</Badge>
                                          )}
                                          <div>
                                            <div className="font-semibold text-blue-900">{formatCurrency(quoteTotal)}</div>
                                            <div className="text-xs text-blue-700">{quoteMaterials.length} materials</div>
                                          </div>
                                        </div>
                                      </div>
                                      <ChevronDown
                                        className={cn(
                                          "h-4 w-4 text-blue-600 transition-transform",
                                          isExpanded ? "rotate-180" : ""
                                        )}
                                      />
                                    </div>
                                  </div>
                                  {firstMaterial.quoteDate && (
                                    <div className="mt-2 text-xs text-blue-600">
                                      Quote Date: {formatDate(firstMaterial.quoteDate)}
                                    </div>
                                  )}
                                </div>

                                {/* Materials in this Quote - Show simplified material cards when expanded */}
                                {isExpanded && (
                                  <div className="p-3">
                                    <div className="grid gap-3">
                                      {quoteMaterials.map((material: any) => (
                                        <div
                                          key={material.id}
                                          className="p-3 border border-orange-200 rounded-lg bg-white hover:bg-orange-50 cursor-pointer transition-colors shadow-sm"
                                        >
                                          <div className="flex justify-between items-center mb-2">
                                            <div className="font-medium text-sm text-slate-800">{material.name}</div>
                                            <div className="text-sm font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                              {formatCurrency((material.cost || 0) * material.quantity)}
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center text-xs text-slate-600">
                                            <div className="flex items-center gap-3">
                                              <span>{material.quantity} {material.unit || 'units'}</span>
                                              {material.type && (
                                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                                                  {material.type}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {material.status && (
                                                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                                  material.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                  material.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                                                  'bg-amber-100 text-amber-700'
                                                }`}>
                                                  {material.status}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          {material.details && (
                                            <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                              {material.details}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
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

      {/* Create Invoice Dialog */}
      <CreateInvoiceFromMaterials
        open={createInvoiceDialogOpen}
        onOpenChange={setCreateInvoiceDialogOpen}
        projectId={projectId}
        preselectedMaterials={quotes}
      />
    </div>
  );
}