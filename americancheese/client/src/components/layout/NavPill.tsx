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
        'flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors duration-150 cursor-pointer min-w-[4.5rem]',
        isActive
          ? 'bg-white border-white font-semibold shadow-sm'
          : 'bg-black/5 border-black/10 text-slate-600 hover:bg-black/10'
      )}
      style={isActive ? { color } : undefined}
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs font-semibold tabular-nums">{count}</span>
      <span className="text-xs">{label}</span>
    </button>
  );
}
