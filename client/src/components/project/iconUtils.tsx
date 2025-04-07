import React from 'react';
import { 
  Building, Cog, PanelTop, Package, 
  Paintbrush, Construction, Calendar,
  Clock, Tag, DollarSign, Home
} from 'lucide-react';

/**
 * Get the appropriate icon based on material tier
 * @param tier The material tier (Structural, Systems, Sheathing, Finishings)
 * @param className Optional CSS class for styling
 * @returns JSX element with the appropriate icon
 */
export const getIconForMaterialTier = (tier: string | undefined, className: string = "h-5 w-5") => {
  const lowerCaseTier = (tier || '').toLowerCase();
  
  if (lowerCaseTier === 'structural') {
    return <Building className={`${className} text-orange-600`} />;
  }
  
  if (lowerCaseTier === 'systems') {
    return <Cog className={`${className} text-blue-600`} />;
  }
  
  if (lowerCaseTier === 'sheathing') {
    return <PanelTop className={`${className} text-green-600`} />;
  }
  
  if (lowerCaseTier === 'finishings') {
    return <Paintbrush className={`${className} text-violet-600`} />;
  }
  
  // Default icon for unknown tiers
  return <Package className={`${className} text-slate-600`} />;
};

/**
 * Get the appropriate icon based on material tier2Category
 * Used for subtypes like Foundation, Framing, Electrical, etc.
 * @param tier2Category The tier2Category value
 * @param className Optional CSS class for styling
 * @returns JSX element with the appropriate icon
 */
export const getIconForTier2Category = (tier2Category: string | undefined, className: string = "h-5 w-5") => {
  const lowerCaseCategory = (tier2Category || '').toLowerCase();
  
  // Structural subtypes
  if (['foundation', 'concrete'].includes(lowerCaseCategory)) {
    return <Construction className={`${className} text-gray-700`} />;
  }
  
  if (['framing', 'lumber'].includes(lowerCaseCategory)) {
    return <Home className={`${className} text-amber-700`} />;
  }
  
  if (['roofing', 'shingles'].includes(lowerCaseCategory)) {
    return <Home className={`${className} text-red-700`} />;
  }
  
  // Systems subtypes
  if (['plumbing'].includes(lowerCaseCategory)) {
    return <Cog className={`${className} text-blue-600`} />;
  }
  
  if (['electrical', 'hvac'].includes(lowerCaseCategory)) {
    return <Cog className={`${className} text-yellow-600`} />;
  }
  
  // Sheathing subtypes
  if (['drywall', 'exteriors', 'insulation', 'siding'].includes(lowerCaseCategory)) {
    return <PanelTop className={`${className} text-green-600`} />;
  }
  
  // Finishings subtypes
  if (['doors', 'windows', 'cabinets', 'flooring', 'fixtures', 'paint'].includes(lowerCaseCategory)) {
    return <Paintbrush className={`${className} text-purple-600`} />;
  }
  
  // Default fallback
  return <Tag className={`${className} text-gray-500`} />;
};

/**
 * Get the appropriate icon based on material type
 * @param type The material type (e.g., Lumber, Concrete, Electrical, etc.)
 * @param className Optional CSS class for styling
 * @returns JSX element with the appropriate icon
 */
export const getIconForMaterialType = (type: string, className: string = "h-5 w-5") => {
  const lowerCaseType = type.toLowerCase();
  
  // Map specific types to icons
  if (['lumber', 'wood', 'timber'].includes(lowerCaseType)) {
    return <Construction className={`${className} text-amber-800`} />;
  }
  
  if (['electrical', 'wiring', 'outlets'].includes(lowerCaseType)) {
    return <Cog className={`${className} text-yellow-500`} />;
  }
  
  if (['plumbing', 'pipe', 'pipes', 'fixture'].includes(lowerCaseType)) {
    return <Cog className={`${className} text-blue-500`} />;
  }
  
  if (['drywall', 'sheetrock', 'gypsum'].includes(lowerCaseType)) {
    return <PanelTop className={`${className} text-gray-500`} />;
  }
  
  if (['paint', 'finish', 'stain', 'coating'].includes(lowerCaseType)) {
    return <Paintbrush className={`${className} text-indigo-500`} />;
  }
  
  // Default fallback icon
  return <Package className={`${className} text-slate-500`} />;
};