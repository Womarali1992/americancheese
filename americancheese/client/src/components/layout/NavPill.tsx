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
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors duration-150 cursor-pointer',
        isActive
          ? 'bg-white text-[#4a7c59] border-white font-semibold shadow-sm'
          : 'bg-white/15 border-white/25 text-white hover:bg-white/25'
      )}
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs font-semibold">{count}</span>
      <span className="text-xs">{label}</span>
    </button>
  );
}
