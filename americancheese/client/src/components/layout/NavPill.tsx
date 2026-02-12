import React from 'react';
import { cn } from '@/lib/utils';

interface NavPillProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  count: number;
  label: string;
  navigateTo: string;
  color: string;
  isActive: boolean;
  onClick: () => void;
}

export function NavPill({ icon: Icon, count, label, color, isActive, onClick }: NavPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm transition-colors duration-150 cursor-pointer',
        isActive
          ? 'font-semibold'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
      )}
      style={isActive ? {
        backgroundColor: color + '15',
        borderColor: color + '40',
        color: color,
      } : undefined}
    >
      <Icon className="h-3 w-3" style={!isActive ? { color } : undefined} />
      <span className="text-xs font-semibold">{count}</span>
      <span className="text-xs">{label}</span>
    </button>
  );
}
