import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  // Blues
  "#2563eb", // blue-600
  "#3b82f6", // blue-500
  "#60a5fa", // blue-400
  // Reds
  "#dc2626", // red-600
  "#ef4444", // red-500
  "#f87171", // red-400
  // Greens
  "#16a34a", // green-600
  "#22c55e", // green-500
  "#4ade80", // green-400
  // Yellows
  "#ca8a04", // yellow-600
  "#eab308", // yellow-500
  "#facc15", // yellow-400
  // Purples
  "#9333ea", // purple-600
  "#a855f7", // purple-500
  "#c084fc", // purple-400
  // Pinks
  "#db2777", // pink-600
  "#ec4899", // pink-500
  "#f472b6", // pink-400
  // Indigos
  "#4f46e5", // indigo-600
  "#6366f1", // indigo-500
  "#818cf8", // indigo-400
  // Oranges
  "#ea580c", // orange-600
  "#f97316", // orange-500
  "#fb923c", // orange-400
];

export function ColorPicker({ label, value, onChange, className }: ColorPickerProps) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setShowPresets(true)}
          onMouseLeave={() => setShowPresets(false)}
        >
          <div 
            className="h-8 w-8 rounded-md border shadow-sm cursor-pointer"
            style={{ backgroundColor: value || '#000000' }}
            onClick={() => setShowPresets(!showPresets)}
          />
          
          {showPresets && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-background rounded-md border shadow-md z-10 w-[240px]">
              <div className="grid grid-cols-6 gap-1">
                {PRESET_COLORS.map((color) => (
                  <div
                    key={color}
                    className="h-8 w-8 rounded-md cursor-pointer border shadow-sm transition-transform hover:scale-105"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onChange(color);
                      setShowPresets(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
        <Input 
          type="color" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 p-0 border-0"
        />
      </div>
    </div>
  );
}