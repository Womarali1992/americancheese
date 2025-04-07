import React from 'react';
import {
  Building,
  Cog,
  Grid,
  PanelTop,
  Package,
  Landmark,
  Construction,
  Home,
  Zap,
  Droplet,
  Fan,
  Layers,
  Paintbrush,
  FileCheck,
  Sofa,
  Mailbox,
  Columns
} from "lucide-react";

/**
 * Get an icon for tier1 category
 */
export const getTier1Icon = (tier1: string, className: string = "h-5 w-5") => {
  const lowerCaseTier1 = (tier1 || '').toLowerCase();
  
  if (lowerCaseTier1 === 'structural') {
    return <Building className={`${className} text-orange-600`} />;
  }
  
  if (lowerCaseTier1 === 'systems') {
    return <Cog className={`${className} text-blue-600`} />;
  }
  
  if (lowerCaseTier1 === 'sheathing') {
    return <PanelTop className={`${className} text-green-600`} />;
  }
  
  if (lowerCaseTier1 === 'finishings') {
    return <Paintbrush className={`${className} text-violet-600`} />;
  }
  
  return <Package className={`${className} text-slate-600`} />;
};

/**
 * Get an icon for tier2 category
 */
export const getTier2Icon = (tier2: string, className: string = "h-5 w-5") => {
  const lowerCaseTier2 = (tier2 || '').toLowerCase();
  
  // Match foundation with concrete
  if (lowerCaseTier2 === 'foundation') {
    return <Landmark className={`${className} text-stone-700`} />;
  }
  
  // Match framing with wood
  if (lowerCaseTier2 === 'framing') {
    return <Construction className={`${className} text-amber-700`} />;
  }
  
  // Match roofing with house
  if (lowerCaseTier2 === 'roofing' || lowerCaseTier2 === 'shingles') {
    return <Home className={`${className} text-red-700`} />;
  }
  
  // Match electrical
  if (lowerCaseTier2 === 'electrical' || lowerCaseTier2 === 'electric') {
    return <Zap className={`${className} text-yellow-600`} />;
  }
  
  // Match plumbing with water
  if (lowerCaseTier2 === 'plumbing') {
    return <Droplet className={`${className} text-blue-700`} />;
  }
  
  // Match hvac with fan
  if (lowerCaseTier2 === 'hvac') {
    return <Fan className={`${className} text-cyan-600`} />;
  }
  
  // Match insulation
  if (lowerCaseTier2 === 'insulation') {
    return <Layers className={`${className} text-green-700`} />;
  }
  
  // Match drywall
  if (lowerCaseTier2 === 'drywall') {
    return <PanelTop className={`${className} text-gray-700`} />;
  }
  
  // Match exteriors/siding
  if (lowerCaseTier2 === 'exteriors' || lowerCaseTier2 === 'siding') {
    return <Columns className={`${className} text-cyan-700`} />;
  }
  
  // Match windows
  if (lowerCaseTier2 === 'windows') {
    return <Grid className={`${className} text-blue-600`} />;
  }
  
  // Match doors
  if (lowerCaseTier2 === 'doors') {
    return <Mailbox className={`${className} text-green-600`} />;
  }
  
  // Match cabinets/fixtures
  if (lowerCaseTier2 === 'cabinets' || lowerCaseTier2 === 'fixtures') {
    return <Sofa className={`${className} text-purple-600`} />;
  }
  
  // Flooring with finish
  if (lowerCaseTier2 === 'flooring') {
    return <Grid className={`${className} text-amber-600`} />;
  }
  
  // Permits
  if (lowerCaseTier2 === 'permits') {
    return <FileCheck className={`${className} text-indigo-600`} />;
  }
  
  // Default
  return <Package className={`${className} text-slate-700`} />;
};