import React from 'react';
import { 
  Building, Cog, PanelTop, Package, 
  Paintbrush, Construction, Calendar,
  Clock, Tag, DollarSign, Home
} from 'lucide-react';
import { useCategories } from '@/lib/category-names';

/**
 * Default tier1 icon mappings (fallback when templates aren't available)
 */
const DEFAULT_TIER1_ICONS: Record<string, { icon: React.ComponentType<any>, color: string }> = {
  'structural': { icon: Building, color: 'text-orange-600' },
  'systems': { icon: Cog, color: 'text-blue-600' },
  'sheathing': { icon: PanelTop, color: 'text-green-600' },
  'finishings': { icon: Paintbrush, color: 'text-violet-600' },
};

/**
 * Get the appropriate icon based on material tier
 * @param tier The material tier (Structural, Systems, Sheathing, Finishings)
 * @param className Optional CSS class for styling
 * @param projectId Optional project ID to get project-specific categories
 * @returns JSX element with the appropriate icon
 */
export const getIconForMaterialTier = (tier: string | undefined, className: string = "h-5 w-5", projectId?: number) => {
  const lowerCaseTier = (tier || '').toLowerCase();
  
  // Look up in default mappings first
  const defaultMapping = DEFAULT_TIER1_ICONS[lowerCaseTier];
  if (defaultMapping) {
    const IconComponent = defaultMapping.icon;
    return <IconComponent className={`${className} ${defaultMapping.color}`} />;
  }
  
  // Default icon for unknown tiers
  return <Package className={`${className} text-slate-600`} />;
};

/**
 * Default tier2 icon mappings (fallback when templates aren't available)
 */
const DEFAULT_TIER2_ICONS: Record<string, { icon: React.ComponentType<any>, color: string }> = {
  // Structural subtypes
  'foundation': { icon: Construction, color: 'text-gray-700' },
  'concrete': { icon: Construction, color: 'text-gray-700' },
  'framing': { icon: Home, color: 'text-amber-700' },
  'lumber': { icon: Home, color: 'text-amber-700' },
  'roofing': { icon: Home, color: 'text-red-700' },
  'shingles': { icon: Home, color: 'text-red-700' },
  
  // Systems subtypes
  'plumbing': { icon: Cog, color: 'text-blue-600' },
  'electrical': { icon: Cog, color: 'text-yellow-600' },
  'hvac': { icon: Cog, color: 'text-yellow-600' },
  
  // Sheathing subtypes
  'drywall': { icon: PanelTop, color: 'text-green-600' },
  'exteriors': { icon: PanelTop, color: 'text-green-600' },
  'insulation': { icon: PanelTop, color: 'text-green-600' },
  'siding': { icon: PanelTop, color: 'text-green-600' },
  'barriers': { icon: PanelTop, color: 'text-green-600' },
  
  // Finishings subtypes
  'doors': { icon: Paintbrush, color: 'text-purple-600' },
  'windows': { icon: Paintbrush, color: 'text-purple-600' },
  'cabinets': { icon: Paintbrush, color: 'text-purple-600' },
  'cabinetry': { icon: Paintbrush, color: 'text-purple-600' },
  'flooring': { icon: Paintbrush, color: 'text-purple-600' },
  'fixtures': { icon: Paintbrush, color: 'text-purple-600' },
  'paint': { icon: Paintbrush, color: 'text-purple-600' },
  'painting': { icon: Paintbrush, color: 'text-purple-600' },
  'trim': { icon: Paintbrush, color: 'text-purple-600' },
};

/**
 * Get the appropriate icon based on material tier2Category
 * Used for subtypes like Foundation, Framing, Electrical, etc.
 * @param tier2Category The tier2Category value
 * @param className Optional CSS class for styling
 * @param projectId Optional project ID to get project-specific categories
 * @returns JSX element with the appropriate icon
 */
export const getIconForTier2Category = (tier2Category: string | undefined, className: string = "h-5 w-5", projectId?: number) => {
  const lowerCaseCategory = (tier2Category || '').toLowerCase();
  
  // Look up in default mappings
  const defaultMapping = DEFAULT_TIER2_ICONS[lowerCaseCategory];
  if (defaultMapping) {
    const IconComponent = defaultMapping.icon;
    return <IconComponent className={`${className} ${defaultMapping.color}`} />;
  }
  
  // Default fallback
  return <Tag className={`${className} text-gray-500`} />;
};

/**
 * Default material type icon mappings
 */
const DEFAULT_MATERIAL_TYPE_ICONS: Record<string, { icon: React.ComponentType<any>, color: string }> = {
  // Wood materials
  'lumber': { icon: Construction, color: 'text-amber-800' },
  'wood': { icon: Construction, color: 'text-amber-800' },
  'timber': { icon: Construction, color: 'text-amber-800' },
  
  // Electrical materials
  'electrical': { icon: Cog, color: 'text-yellow-500' },
  'wiring': { icon: Cog, color: 'text-yellow-500' },
  'outlets': { icon: Cog, color: 'text-yellow-500' },
  
  // Plumbing materials
  'plumbing': { icon: Cog, color: 'text-blue-500' },
  'pipe': { icon: Cog, color: 'text-blue-500' },
  'pipes': { icon: Cog, color: 'text-blue-500' },
  'fixture': { icon: Cog, color: 'text-blue-500' },
  
  // Wall materials
  'drywall': { icon: PanelTop, color: 'text-gray-500' },
  'sheetrock': { icon: PanelTop, color: 'text-gray-500' },
  'gypsum': { icon: PanelTop, color: 'text-gray-500' },
  
  // Finishing materials
  'paint': { icon: Paintbrush, color: 'text-indigo-500' },
  'finish': { icon: Paintbrush, color: 'text-indigo-500' },
  'stain': { icon: Paintbrush, color: 'text-indigo-500' },
  'coating': { icon: Paintbrush, color: 'text-indigo-500' },
};

/**
 * Get the appropriate icon based on material type
 * @param type The material type (e.g., Lumber, Concrete, Electrical, etc.)
 * @param className Optional CSS class for styling
 * @returns JSX element with the appropriate icon
 */
export const getIconForMaterialType = (type: string, className: string = "h-5 w-5") => {
  const lowerCaseType = type.toLowerCase();
  
  // Look up in default mappings
  const defaultMapping = DEFAULT_MATERIAL_TYPE_ICONS[lowerCaseType];
  if (defaultMapping) {
    const IconComponent = defaultMapping.icon;
    return <IconComponent className={`${className} ${defaultMapping.color}`} />;
  }
  
  // Default fallback icon
  return <Package className={`${className} text-slate-500`} />;
};

/**
 * Hook to get category-specific icon from template data
 * @param projectId Project ID to get project-specific categories
 * @returns Function to get icon for category name
 */
export const useCategoryIcon = (projectId?: number) => {
  const { data: categories } = useCategories(projectId);
  
  return (categoryName: string, className: string = "h-5 w-5") => {
    const lowerCaseName = categoryName.toLowerCase();
    
    // Find category in template data
    const category = categories?.find(cat => 
      cat.id.toLowerCase() === lowerCaseName || 
      cat.label.toLowerCase() === lowerCaseName
    );
    
    if (category?.type === 'tier1') {
      return getIconForMaterialTier(category.label, className, projectId);
    } else if (category?.type === 'tier2') {
      return getIconForTier2Category(category.label, className, projectId);
    }
    
    // Fallback to existing logic
    return getIconForMaterialTier(categoryName, className, projectId);
  };
};