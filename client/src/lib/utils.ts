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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Project statuses
    'active': 'bg-blue-100 text-blue-800',
    'on_hold': 'bg-amber-100 text-amber-800',
    'completed': 'bg-green-100 text-green-800',
    
    // Task statuses
    'not_started': 'bg-slate-100 text-slate-800',
    'in_progress': 'bg-amber-100 text-amber-800',
    
    // Contact types
    'contractor': 'bg-amber-100 text-amber-800',
    'supplier': 'bg-blue-100 text-blue-800',
    'consultant': 'bg-purple-100 text-purple-800',
    
    // Material statuses
    'ordered': 'bg-slate-100 text-slate-800',
    'delivered': 'bg-blue-100 text-blue-800',
    'used': 'bg-green-100 text-green-800',
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
    'project': 'text-blue-500 bg-blue-50',
    'task': 'text-green-500 bg-green-50',
    'expense': 'text-teal-500 bg-teal-50',
    'dashboard': 'text-purple-500 bg-purple-50',
    'contact': 'text-sky-500 bg-sky-50',
    'resource': 'text-orange-500 bg-orange-50',
  };
  
  return colors[module] || 'text-slate-500 bg-slate-50';
}

export function formatStatusText(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
