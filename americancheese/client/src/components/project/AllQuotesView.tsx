import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight,
  Package,
  Building,
  DollarSign,
  Layers,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronLeft,
  Hash
} from "lucide-react";
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
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"category" | "supplier">("category");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  // Fetch tasks data
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/projects', projectId, 'tasks'],
    enabled: !!projectId
  });

  // Fetch all materials, then filter for quotes in this project
  const { data: allMaterials = [], isLoading: quotesLoading } = useQuery<any[]>({
    queryKey: ['/api/materials'],
    enabled: !!projectId
  });

  // Filter for quotes in this project
  const quotes = useMemo(() => {
    const quotesOnly = allMaterials.filter((material: any) =>
      material.isQuote === true && material.projectId === projectId
    );
    return quotesOnly;
  }, [allMaterials, projectId]);

  // Fetch suppliers/contacts data
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ['/api/contacts'],
    enabled: !!projectId
  });

  // Create contact map for quick lookup
  const contactMap = useMemo(() => {
    const map: Record<number, any> = {};
    contacts.forEach((contact: any) => {
      map[contact.id] = contact;
    });
    return map;
  }, [contacts]);

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

  // Group quotes by supplier
  const quotesGroupedBySupplier = useMemo(() => {
    const supplierGroups: Record<string, { supplier: any; quotes: any[] }> = {};

    quotes.forEach((quote: any) => {
      // Get supplier info - try supplierId first, then fall back to supplier name
      let supplierKey = 'unknown';
      let supplierInfo = null;

      if (quote.supplierId && contactMap[quote.supplierId]) {
        const contact = contactMap[quote.supplierId];
        supplierKey = `id-${quote.supplierId}`;
        supplierInfo = {
          id: quote.supplierId,
          name: contact.name || 'Unknown',
          company: contact.company || '',
          initials: (contact.name || 'U').charAt(0).toUpperCase()
        };
      } else if (quote.supplier) {
        supplierKey = quote.supplier.toLowerCase().replace(/\s+/g, '-');
        supplierInfo = {
          name: quote.supplier,
          company: '',
          initials: quote.supplier.charAt(0).toUpperCase()
        };
      } else {
        supplierInfo = {
          name: 'Unknown Supplier',
          company: '',
          initials: 'U'
        };
      }

      if (!supplierGroups[supplierKey]) {
        supplierGroups[supplierKey] = { supplier: supplierInfo, quotes: [] };
      }
      supplierGroups[supplierKey].quotes.push(quote);
    });

    return supplierGroups;
  }, [quotes, contactMap]);

  // Group quotes by quote number within a supplier
  const groupQuotesByNumber = (supplierQuotes: any[]) => {
    const quoteGroups: Record<string, any[]> = {};

    supplierQuotes.forEach(quote => {
      const quoteNumber = quote.quoteNumber || `ungrouped-${quote.id}`;
      if (!quoteGroups[quoteNumber]) {
        quoteGroups[quoteNumber] = [];
      }
      quoteGroups[quoteNumber].push(quote);
    });

    return quoteGroups;
  };

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

  // Render material card (shared between views)
  const renderMaterialCard = (material: any) => (
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
  );

  // Render quote group card (shared between views)
  const renderQuoteGroup = (quoteNumber: string, quoteMaterials: any[], quoteKey: string, showSupplier: boolean = true) => {
    const quoteTotal = quoteMaterials.reduce((sum, material) => sum + (material.cost || 0) * material.quantity, 0);
    const firstMaterial = quoteMaterials[0];
    const isExpanded = expandedQuotes.has(quoteKey);
    const isUngrouped = quoteNumber.startsWith('ungrouped-');

    return (
      <div key={quoteKey} className="border rounded-lg overflow-hidden">
        {/* Quote Header */}
        <div
          className="bg-blue-50 p-3 border-b cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => toggleQuoteExpansion(quoteKey)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 text-blue-700">
                <Hash className="h-5 w-5" />
              </div>
              <div>
                {/* Quote Number - Prominently displayed */}
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-sm px-2 py-0.5">
                    {isUngrouped ? 'No Quote #' : quoteNumber}
                  </Badge>
                  {firstMaterial.status === "ordered" ? (
                    <Badge className="bg-green-500 text-white text-xs">Purchased</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Quote Only</Badge>
                  )}
                </div>
                {showSupplier && (
                  <p className="text-sm text-blue-800 mt-1">
                    <Building className="h-3 w-3 inline mr-1" />
                    {firstMaterial.supplier || 'Unknown Supplier'}
                  </p>
                )}
                {firstMaterial.quoteDate && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    Quote Date: {formatDate(firstMaterial.quoteDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-semibold text-blue-900 text-lg">{formatCurrency(quoteTotal)}</div>
                <div className="text-xs text-blue-700">{quoteMaterials.length} materials</div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-blue-600 transition-transform",
                  isExpanded ? "rotate-180" : ""
                )}
              />
            </div>
          </div>
        </div>

        {/* Materials in this Quote */}
        {isExpanded && (
          <div className="p-3 bg-slate-50">
            <div className="grid gap-3">
              {quoteMaterials.map(renderMaterialCard)}
            </div>
          </div>
        )}
      </div>
    );
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
      {/* Header */}
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

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as "category" | "supplier"); setSelectedSupplier(null); }}>
        <TabsList className="grid w-full grid-cols-2 bg-blue-50 border border-blue-200">
          <TabsTrigger
            value="category"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-700"
          >
            <Layers className="h-4 w-4 mr-2" />
            Category View
          </TabsTrigger>
          <TabsTrigger
            value="supplier"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-700"
          >
            <Building className="h-4 w-4 mr-2" />
            Supplier View
          </TabsTrigger>
        </TabsList>

        {/* Category View */}
        <TabsContent value="category" className="mt-4 space-y-6">
          {Object.entries(quotesGroupedBySection).map(([tier1, sectionGroups]) => (
            <div key={tier1} className="space-y-4">
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
                  )} materials
                </div>
              </div>

              {/* Sections within this Tier */}
              {Object.entries(sectionGroups).map(([section, subsectionGroups]) => {
                const sectionQuotes = Object.values(subsectionGroups).flatMap(quoteGroups => Object.values(quoteGroups)).flat();
                const sectionValue = sectionQuotes.reduce((sum, quote) => sum + (quote.cost || 0) * quote.quantity, 0);

                return (
                  <div key={`${tier1}-${section}`} className="space-y-3">
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
                              {Object.entries(quoteGroups).map(([quoteNumber, quoteMaterials]) => {
                                const quoteKey = `category-${tier1}-${section}-${subsection}-${quoteNumber}`;
                                return renderQuoteGroup(quoteNumber, quoteMaterials, quoteKey, true);
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

          {Object.keys(quotesGroupedBySection).length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-slate-500">No quotes available for this project</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Supplier View */}
        <TabsContent value="supplier" className="mt-4 space-y-4">
          {!selectedSupplier ? (
            // Supplier Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(quotesGroupedBySupplier).map(([key, { supplier, quotes: supplierQuotes }]) => {
                const totalValue = supplierQuotes.reduce((sum, q) => sum + (q.cost || 0) * q.quantity, 0);
                const quoteNumbers = new Set(supplierQuotes.map(q => q.quoteNumber).filter(Boolean));

                return (
                  <Card
                    key={key}
                    className="cursor-pointer border-2 border-amber-300 hover:border-amber-500 hover:shadow-lg transition-all"
                    onClick={() => setSelectedSupplier(key)}
                  >
                    <CardHeader className="p-4 pb-2 bg-gradient-to-r from-amber-700 to-amber-600">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-white text-amber-800 flex items-center justify-center font-bold text-lg mr-3">
                          {supplier.initials}
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{supplier.name}</CardTitle>
                          {supplier.company && (
                            <CardDescription className="text-amber-200">
                              {supplier.company}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-sm font-medium">{supplierQuotes.length} Materials</p>
                          <p className="text-xs text-slate-500">
                            {quoteNumbers.size} Quote{quoteNumbers.size !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-base px-3 py-1">
                          {formatCurrency(totalValue)}
                        </Badge>
                      </div>
                      {/* Show quote numbers preview */}
                      {quoteNumbers.size > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Array.from(quoteNumbers).slice(0, 3).map((qn) => (
                            <Badge key={qn} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {qn}
                            </Badge>
                          ))}
                          {quoteNumbers.size > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{quoteNumbers.size - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {Object.keys(quotesGroupedBySupplier).length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <div className="text-slate-500">No quotes available for this project</div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Selected Supplier Detail View
            <div className="space-y-4">
              {/* Back Button & Supplier Header */}
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-800"
                  onClick={() => setSelectedSupplier(null)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Suppliers
                </Button>
              </div>

              {/* Supplier Info Card */}
              {quotesGroupedBySupplier[selectedSupplier] && (
                <>
                  <Card className="bg-gradient-to-r from-amber-700 to-amber-600 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 rounded-full bg-white text-amber-800 flex items-center justify-center font-bold text-xl">
                            {quotesGroupedBySupplier[selectedSupplier].supplier.initials}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">
                              {quotesGroupedBySupplier[selectedSupplier].supplier.name}
                            </h3>
                            {quotesGroupedBySupplier[selectedSupplier].supplier.company && (
                              <p className="text-amber-200">
                                {quotesGroupedBySupplier[selectedSupplier].supplier.company}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              quotesGroupedBySupplier[selectedSupplier].quotes.reduce(
                                (sum, q) => sum + (q.cost || 0) * q.quantity, 0
                              )
                            )}
                          </div>
                          <div className="text-amber-200">
                            {quotesGroupedBySupplier[selectedSupplier].quotes.length} materials
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quotes grouped by quote number */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-700 flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Quotes
                    </h4>
                    {Object.entries(groupQuotesByNumber(quotesGroupedBySupplier[selectedSupplier].quotes)).map(
                      ([quoteNumber, quoteMaterials]) => {
                        const quoteKey = `supplier-${selectedSupplier}-${quoteNumber}`;
                        return renderQuoteGroup(quoteNumber, quoteMaterials, quoteKey, false);
                      }
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
