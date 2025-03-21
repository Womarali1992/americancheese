import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    return format(parseISO(date), 'MMM dd, yyyy');
  }
  return format(date, 'MMM dd, yyyy');
}

export function formatCurrency(amount: number): string {
  // Format the currency using Intl.NumberFormat
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  // Add teal color styling to the amount (#0d9488)
  return `<span class="text-[#0d9488]">${formattedAmount}</span>`;
}

// Add an additional utility function to help with calculating totals
export function calculateTotal(items: any[], key: string = 'amount'): number {
  if (!items || !Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Project statuses - using our consistent color palette
    'active': 'bg-[#466362] bg-opacity-10 text-[#466362]', // teal
    'on_hold': 'bg-[#938581] bg-opacity-10 text-[#938581]', // taupe
    'completed': 'bg-[#7E6551] bg-opacity-10 text-[#7E6551]', // brown
    'delayed': 'bg-[#8896AB] bg-opacity-10 text-[#8896AB]', // slate
    
    // Task statuses
    'not_started': 'bg-[#938581] bg-opacity-10 text-[#938581]', // taupe
    'in_progress': 'bg-[#C5D5E4] bg-opacity-10 text-[#8896AB]', // blue
    
    // Contact types
    'contractor': 'bg-[#466362] bg-opacity-10 text-[#466362]', // teal
    'supplier': 'bg-[#C5D5E4] bg-opacity-10 text-[#8896AB]', // blue
    'consultant': 'bg-[#7E6551] bg-opacity-10 text-[#7E6551]', // brown
    
    // Material statuses
    'ordered': 'bg-[#938581] bg-opacity-10 text-[#938581]', // taupe
    'delivered': 'bg-[#C5D5E4] bg-opacity-10 text-[#8896AB]', // blue
    'used': 'bg-[#7E6551] bg-opacity-10 text-[#7E6551]', // brown
  };
  
  return statusColors[status] || 'bg-slate-100 text-slate-800';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
}

export function getColorByModule(module: string): string {
  const colors: Record<string, string> = {
    'project': 'text-[#7E6551] bg-[#7E6551] bg-opacity-10', // brown
    'task': 'text-[#466362] bg-[#466362] bg-opacity-10', // teal
    'expense': 'text-[#466362] bg-[#466362] bg-opacity-10', // teal
    'dashboard': 'text-[#8896AB] bg-[#8896AB] bg-opacity-10', // slate
    'contact': 'text-[#C5D5E4] bg-[#C5D5E4] bg-opacity-10', // blue
    'resource': 'text-[#938581] bg-[#938581] bg-opacity-10', // taupe
    'material': 'text-[#f97316] bg-orange-100', // orange for materials
    'labor': 'text-[#a855f7] bg-purple-100', // purple for labor
  };
  
  return colors[module] || 'text-slate-500 bg-slate-50';
}

export function formatStatusText(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Function to get category colors for tasks
export function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    'foundation': 'bg-stone-700 border-stone-800 text-white',
    'framing': 'bg-amber-700 border-amber-800 text-white',
    'roof': 'bg-red-700 border-red-800 text-white',
    'windows_doors': 'bg-blue-700 border-blue-800 text-white',
    'electrical': 'bg-yellow-500 border-yellow-600 text-yellow-950',
    'plumbing': 'bg-blue-500 border-blue-600 text-white',
    'hvac': 'bg-gray-600 border-gray-700 text-white',
    'insulation': 'bg-green-500 border-green-600 text-white',
    'drywall': 'bg-gray-200 border-gray-400 text-gray-800',
    'flooring': 'bg-amber-500 border-amber-600 text-white',
    'painting': 'bg-indigo-500 border-indigo-600 text-white',
    'landscaping': 'bg-emerald-600 border-emerald-700 text-white',
  };
  
  return categoryColors[category] || 'bg-gray-400 border-gray-500 text-gray-800';
}

// Function to format category names for display
export function formatCategoryName(category: string): string {
  if (category === 'windows_doors') {
    return 'Windows/Doors';
  }
  
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
