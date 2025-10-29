import { useQuery } from "@tanstack/react-query";

/**
 * Hook to map stored task category names to current project category names
 * This handles cases where users rename categories after tasks are created
 */
export function useCategoryNameMapping(projectId: number) {
  const { data: projectCategories } = useQuery({
    queryKey: ["/api/projects", projectId, "template-categories"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/template-categories`);
      if (!response.ok) {
        throw new Error("Failed to fetch project categories");
      }
      return await response.json();
    },
    enabled: !!projectId
  });

  // Create mapping from stored category names to current names
  const categoryNameMapping = (storedName: string, type: "tier1" | "tier2"): string => {
    if (!projectCategories || !storedName) return storedName;

    // Find category by stored name (case-insensitive)
    const category = projectCategories.find((cat: any) => 
      cat.type === type && 
      cat.name.toLowerCase() === storedName.toLowerCase()
    );

    // If found in project categories, return the current name
    if (category) {
      return category.name;
    }

    // Try to find by original template name for preset categories
    // This handles cases where preset categories were renamed
    const normalizedStored = storedName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedCategory = projectCategories.find((cat: any) => {
      if (cat.type !== type) return false;
      const normalizedCurrent = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check if they match when normalized
      if (normalizedCurrent === normalizedStored) return true;
      
      // Check common preset mappings
      const presetMappings: Record<string, string[]> = {
        'structural': ['structural', 'structure', 'framing', 'foundation'],
        'systems': ['systems', 'system', 'mechanical', 'electrical', 'plumbing'],
        'sheathing': ['sheathing', 'insulation', 'drywall', 'interior'],
        'finishings': ['finishings', 'finishing', 'final', 'completion'],
        'permitting': ['permitting', 'permits', 'approval', 'regulatory'],
        'softwareengineering': ['softwareengineering', 'engineering', 'development', 'dev'],
        'productmanagement': ['productmanagement', 'product', 'management', 'pm'],
        'designux': ['designux', 'design', 'ux', 'ui', 'userexperience'],
        'marketinggtm': ['marketinggtm', 'marketing', 'gtm', 'gotomarket']
      };
      
      for (const [key, variants] of Object.entries(presetMappings)) {
        if (variants.includes(normalizedStored) && variants.includes(normalizedCurrent)) {
          return true;
        }
      }
      
      return false;
    });

    return matchedCategory ? matchedCategory.name : storedName;
  };

  const mapTier1CategoryName = (storedName: string): string => {
    return categoryNameMapping(storedName, "tier1");
  };

  const mapTier2CategoryName = (storedName: string): string => {
    return categoryNameMapping(storedName, "tier2");
  };

  return {
    mapTier1CategoryName,
    mapTier2CategoryName,
    projectCategories
  };
}