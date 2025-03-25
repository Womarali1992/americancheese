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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Add an additional utility function to help with calculating totals
export function calculateTotal(items: any[], key: string = 'amount'): number {
  if (!items || !Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
}

// Removed - now imported from @/lib/color-utils

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
}

// Removed - now imported from @/lib/color-utils

// Removed - now imported from @/lib/color-utils
