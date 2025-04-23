import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, ChevronRight, CheckCircle2 } from "lucide-react";
import { Material } from "@/../../shared/schema";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddSectionMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  onAddMaterials: (materialIds: number[]) => void;
  existingMaterialIds: number[];
  initialTier1?: string;
  initialTier2?: string;
}

export function AddSectionMaterialsDialog({
  open,
  onOpenChange,
  projectId,
  onAddMaterials,
  existingMaterialIds = [],
  initialTier1,
  initialTier2,
}: AddSectionMaterialsDialogProps) {
  // Hierarchical selection state
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Define tier1 categories (main construction phases)
  const tier1Categories = ['Structural', 'Systems', 'Sheathing', 'Finishings'];

  // Query to fetch materials
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: projectId 
      ? ["/api/projects", projectId, "materials"] 
      : ["/api/materials"],
    queryFn: async () => {
      const url = projectId 
        ? `/api/projects/${projectId}/materials` 
        : "/api/materials";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }
      return await response.json();
    },
    enabled: !!open,
  });

  // Helper function to map a material to a tier1 category
  const getMaterialTier1 = (material: Material): string => {
    // First prioritize the tier field if it exists
    if (material.tier) {
      const tierUpper = material.tier.charAt(0).toUpperCase() + material.tier.slice(1).toLowerCase();
      
      // Handle special cases to map to our tier1 categories
      if (tierUpper === 'Structural' || tierUpper === 'Structure') {
        return 'Structural';
      } else if (tierUpper === 'System' || tierUpper === 'Systems') {
        return 'Systems';
      } else if (tierUpper === 'Sheath' || tierUpper === 'Sheathing') {
        return 'Sheathing';
      } else if (tierUpper === 'Finishing' || tierUpper === 'Finishings' || tierUpper === 'Finish') {
        return 'Finishings';
      }
      
      // If it's one of our tier1 categories, return it
      if (tier1Categories.includes(tierUpper)) {
        return tierUpper;
      }
    }
    
    // If tier field doesn't help, fall back to type and category analysis
    const type = material.type?.toLowerCase() || '';
    const category = material.category?.toLowerCase() || '';
    
    // Structural materials
    if (
      type.includes('concrete') || 
      type.includes('foundation') || 
      type.includes('framing') || 
      type.includes('lumber') || 
      type.includes('wood') || 
      type.includes('metal') || 
      type.includes('roof') || 
      type.includes('shingle') ||
      category.includes('concrete') ||
      category.includes('lumber') ||
      category.includes('structural')
    ) {
      return 'Structural';
    }
    
    // Systems materials
    if (
      type.includes('electrical') || 
      type.includes('wiring') || 
      type.includes('plumbing') || 
      type.includes('pipe') || 
      type.includes('hvac')
    ) {
      return 'Systems';
    }
    
    // Sheathing materials
    if (
      type.includes('insulation') || 
      type.includes('drywall') || 
      type.includes('siding') || 
      type.includes('exterior')
    ) {
      return 'Sheathing';
    }
    
    // Finishing materials
    if (
      type.includes('paint') || 
      type.includes('floor') || 
      type.includes('tile') || 
      type.includes('cabinet') || 
      type.includes('fixture') ||
      type.includes('window') ||
      type.includes('door') ||
      type.includes('trim')
    ) {
      return 'Finishings';
    }
    
    return 'Other';
  };

  // Process materials
  const processedMaterials = materials?.map(material => ({
    ...material,
    tier: material.tier || "",
    tier2Category: material.tier2Category || "",
    section: material.section || "",
    isSelected: selectedMaterialIds.includes(material.id),
  }));

  // Group materials by tier1, tier2, and section
  const materialHierarchy = processedMaterials?.reduce((acc, material) => {
    // Get standardized tier1 category
    const tier1 = getMaterialTier1(material);
    // Use material's tier2Category or fallback to 'Other'
    const tier2 = material.tier2Category ? 
      material.tier2Category.charAt(0).toUpperCase() + material.tier2Category.slice(1).toLowerCase() : 
      'Other';
    // Use material's section or fallback to 'General'
    const section = material.section ? 
      material.section.charAt(0).toUpperCase() + material.section.slice(1).toLowerCase() : 
      'General';
    
    // Initialize tier1 if needed
    if (!acc[tier1]) {
      acc[tier1] = {};
    }
    
    // Initialize tier2 if needed
    if (!acc[tier1][tier2]) {
      acc[tier1][tier2] = {};
    }
    
    // Initialize section if needed
    if (!acc[tier1][tier2][section]) {
      acc[tier1][tier2][section] = [];
    }
    
    // Add material to its place in the hierarchy
    acc[tier1][tier2][section].push(material);
    
    return acc;
  }, {} as Record<string, Record<string, Record<string, Material[]>>>) || {};

  // Get tier2 categories for selected tier1
  const getTier2Categories = (tier1: string): string[] => {
    if (!materialHierarchy[tier1]) return [];
    return Object.keys(materialHierarchy[tier1]).sort();
  };

  // Get sections for selected tier1 and tier2
  const getSections = (tier1: string, tier2: string): string[] => {
    if (!materialHierarchy[tier1] || !materialHierarchy[tier1][tier2]) return [];
    return Object.keys(materialHierarchy[tier1][tier2]).sort();
  };

  // Get all materials for a specific section
  const getMaterialsForSection = (tier1: string, tier2: string, section: string): Material[] => {
    if (!materialHierarchy[tier1] || !materialHierarchy[tier1][tier2] || !materialHierarchy[tier1][tier2][section]) {
      return [];
    }
    return materialHierarchy[tier1][tier2][section];
  };

  // Get all materials for the selected tier1 and tier2 categories
  const getAllMaterialsForTier = (tier1: string, tier2: string): Material[] => {
    if (!materialHierarchy[tier1] || !materialHierarchy[tier1][tier2]) {
      return [];
    }
    
    // Combine materials from all sections in this tier
    return Object.values(materialHierarchy[tier1][tier2])
      .flat()
      .filter(material => material !== undefined);
  };

  // Filter materials by search term (for searching within a section or all materials in tier)
  const filteredMaterials = selectedTier1 && selectedTier2
    ? (selectedSection 
        ? getMaterialsForSection(selectedTier1, selectedTier2, selectedSection) 
        : (initialTier1 && initialTier2 ? getAllMaterialsForTier(selectedTier1, selectedTier2) : [])
      ).filter(material => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          material.name.toLowerCase().includes(term) ||
          material.type.toLowerCase().includes(term)
        );
      })
    : [];

  // Set initial tier1 when dialog opens and initialTier1 is provided
  useEffect(() => {
    if (open && initialTier1 && materials.length > 0) {
      // Capitalize first letter for consistency with our tier format
      const formattedTier1 = initialTier1.charAt(0).toUpperCase() + initialTier1.slice(1).toLowerCase();
      // Map common category names to our standardized tier1 categories
      let tier1 = formattedTier1;
      
      if (formattedTier1 === 'Structural' || formattedTier1 === 'Structure') {
        tier1 = 'Structural';
      } else if (formattedTier1 === 'System' || formattedTier1 === 'Systems') {
        tier1 = 'Systems';
      } else if (formattedTier1 === 'Sheath' || formattedTier1 === 'Sheathing') {
        tier1 = 'Sheathing';
      } else if (formattedTier1 === 'Finishing' || formattedTier1 === 'Finishings' || formattedTier1 === 'Finish') {
        tier1 = 'Finishings';
      }
      
      // Only set if it's one of our valid tier1 categories
      if (tier1Categories.includes(tier1)) {
        setSelectedTier1(tier1);
      }
    }
  }, [open, initialTier1, materials, tier1Categories]);

  // Set tier2 after materials and tier1 are loaded
  useEffect(() => {
    if (open && selectedTier1 && initialTier2 && materials.length > 0) {
      // Wait for material hierarchy to be built
      if (!materialHierarchy[selectedTier1]) return;
      
      // Format tier2 for consistency
      const formattedTier2 = initialTier2.charAt(0).toUpperCase() + initialTier2.slice(1).toLowerCase();
      
      // Check if this tier2 exists in our hierarchy under the selected tier1
      const availableTier2Categories = getTier2Categories(selectedTier1);
      
      // Find the closest match (might be slightly different formatting)
      const matchingTier2 = availableTier2Categories.find(t2 => 
        t2.toLowerCase() === formattedTier2.toLowerCase() ||
        t2.toLowerCase().includes(formattedTier2.toLowerCase()) ||
        formattedTier2.toLowerCase().includes(t2.toLowerCase())
      );
      
      if (matchingTier2) {
        setSelectedTier2(matchingTier2);
      }
    }
  }, [open, selectedTier1, initialTier2, materials, materialHierarchy]);

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedTier1(null);
      setSelectedTier2(null);
      setSelectedSection(null);
      setSelectedMaterialIds([]);
      setSearchTerm("");
    }
  }, [open]);

  // Handle material selection/deselection
  const toggleMaterial = (materialId: number) => {
    setSelectedMaterialIds(prev => 
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  // Handle select all materials in section or tier
  const handleSelectAll = () => {
    // Get the appropriate materials list based on whether a section is selected
    const materialsList = selectedSection 
      ? getMaterialsForSection(selectedTier1!, selectedTier2!, selectedSection!) 
      : getAllMaterialsForTier(selectedTier1!, selectedTier2!);
    
    // Get all material IDs from the list
    const allIds = materialsList.map(m => m.id);
    
    // Update selected IDs
    setSelectedMaterialIds(prev => {
      // Check if all are already selected
      const allSelected = allIds.every(id => prev.includes(id));
      if (allSelected) {
        // Deselect all in this list
        return prev.filter(id => !allIds.includes(id));
      } else {
        // Select all in this list that aren't already selected
        const newIds = allIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      }
    });
  };

  const handleConfirm = () => {
    onAddMaterials(selectedMaterialIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Add Materials to Task
          </DialogTitle>
          <DialogDescription>
            {initialTier1 && initialTier2 ? 
              `Select materials to add to this ${initialTier1} - ${initialTier2} task.` : 
              "Select a category, subcategory, and section to add materials in bulk."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Tier 1 Selection - only shown if initialTier1 not provided */}
          {!initialTier1 && (
            <div>
              <Label htmlFor="tier1-select">Project Tier</Label>
              <Select 
                value={selectedTier1 || ""} 
                onValueChange={(value) => {
                  setSelectedTier1(value);
                  setSelectedTier2(null);
                  setSelectedSection(null);
                }}
              >
                <SelectTrigger id="tier1-select">
                  <SelectValue placeholder="Select a project tier" />
                </SelectTrigger>
                <SelectContent>
                  {tier1Categories.map(tier1 => (
                    <SelectItem key={tier1} value={tier1}>
                      {tier1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Tier Display when provided through initialTier1 */}
          {initialTier1 && selectedTier1 && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Project Tier</p>
                  <p className="font-medium text-blue-800">{selectedTier1}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          )}

          {/* Tier 2 Selection - only visible if Tier 1 is selected and initialTier2 not provided */}
          {selectedTier1 && !initialTier2 && (
            <div>
              <Label htmlFor="tier2-select">Subcategory</Label>
              <Select 
                value={selectedTier2 || ""} 
                onValueChange={(value) => {
                  setSelectedTier2(value);
                  setSelectedSection(null);
                }}
              >
                <SelectTrigger id="tier2-select">
                  <SelectValue placeholder="Select a subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {getTier2Categories(selectedTier1).map(tier2 => (
                    <SelectItem key={tier2} value={tier2}>
                      {tier2}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Selected Tier2 Display when provided through initialTier2 */}
          {initialTier2 && selectedTier1 && selectedTier2 && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Subcategory</p>
                  <p className="font-medium text-blue-800">{selectedTier2}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          )}

          {/* Section Selection - only visible if Tier 2 is selected */}
          {selectedTier1 && selectedTier2 && (
            <div>
              <Label htmlFor="section-select">Section</Label>
              <Select 
                value={selectedSection || ""} 
                onValueChange={(value) => setSelectedSection(value)}
              >
                <SelectTrigger id="section-select">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {getSections(selectedTier1, selectedTier2).map(section => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Material List - shown immediately for pre-selected tiers or when section is selected */}
          {selectedTier1 && selectedTier2 && (initialTier1 && initialTier2 || selectedSection) && (
            <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center">
                <Label>
                  {selectedSection ? 'Materials in Section' : `All ${selectedTier2} Materials`}
                </Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {filteredMaterials.every(m => selectedMaterialIds.includes(m.id)) 
                    ? "Deselect All" 
                    : "Select All"}
                </Button>
              </div>
              
              <div className="relative">
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
              </div>

              <div className="border rounded-md flex-1 overflow-hidden">
                <ScrollArea className="h-[300px] w-full">
                  {filteredMaterials.length > 0 ? (
                    <div className="p-2 space-y-2">
                      {filteredMaterials.map(material => {
                        const isSelected = selectedMaterialIds.includes(material.id);
                        const isExisting = existingMaterialIds.includes(material.id);
                        
                        return (
                          <Card 
                            key={material.id} 
                            className={`
                              border transition-colors
                              ${isSelected ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}
                              ${isExisting ? 'opacity-60' : ''}
                            `}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{material.name}</div>
                                <div className="text-xs text-slate-500">{material.type}</div>
                                {isExisting && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    Already added to task
                                  </div>
                                )}
                              </div>
                              
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleMaterial(material.id)}
                                disabled={isExisting}
                              />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      {searchTerm 
                        ? "No materials found matching your search" 
                        : selectedSection 
                          ? "No materials in this section" 
                          : `No materials found for ${selectedTier2}`}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="text-sm text-slate-600">
                Selected {selectedMaterialIds.filter(id => 
                  filteredMaterials.some(m => m.id === id)
                ).length} of {filteredMaterials.length} materials
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="text-sm flex items-center text-slate-600">
            <CheckCircle2 className="h-4 w-4 mr-1 text-orange-500" />
            Total selected: {selectedMaterialIds.length} materials
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleConfirm}
              disabled={selectedMaterialIds.length === 0}
            >
              Add Materials
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}