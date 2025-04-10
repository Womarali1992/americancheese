import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface WordbankItem {
  id: number | string;
  label: string;
  color?: string;
  subtext?: string;
  metadata?: Record<string, any>;
}

interface WordbankProps {
  items: WordbankItem[];
  selectedItems: (number | string)[];
  onItemSelect: (id: number | string) => void;
  onItemRemove: (id: number | string) => void;
  className?: string;
  readOnly?: boolean;
  emptyText?: string;
}

export function Wordbank({
  items,
  selectedItems,
  onItemSelect,
  onItemRemove,
  className,
  readOnly = false,
  emptyText = "No items selected"
}: WordbankProps) {
  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string | number, boolean>>({});

  // In readOnly mode with empty selectedItems array, we treat all items as selected
  const effectiveSelectedItems = readOnly && selectedItems.length === 0 
    ? items.map(item => item.id) // Select all items if in readOnly mode with empty selection
    : selectedItems;
  
  const selectedItemsMap = new Set(effectiveSelectedItems);
  const availableItems = items.filter(item => !selectedItemsMap.has(item.id));
  const selectedItemsFull = items.filter(item => selectedItemsMap.has(item.id));

  // Toggle expanded state for a section
  const toggleExpanded = (id: string | number) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Check if a section is expanded
  const isExpanded = (id: string | number) => !!expandedSections[id];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-2 min-h-10">
        {selectedItemsFull.length > 0 ? (
          selectedItemsFull.map(item => (
            <div key={item.id} className="w-full">
              <Badge 
                variant="outline"
                className={cn(
                  "flex items-center justify-between w-full px-3 py-1.5 rounded-md text-xs font-medium",
                  readOnly && "cursor-pointer hover:bg-muted/10",
                  item.color
                )}
                onClick={() => {
                  if (readOnly) {
                    // Only toggle expandable sections for contractors, not for materials
                    if (item.metadata?.isContractor) {
                      toggleExpanded(item.id);
                    } else {
                      // Always trigger the selection handler for materials
                      onItemSelect(item.id);
                    }
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  {/* Chevron icons removed as requested */}
                  <span>{item.label}</span>
                  {item.subtext && (
                    <span className="text-xs opacity-70 ml-1">({item.subtext})</span>
                  )}
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemRemove(item.id);
                    }}
                    className="ml-1 rounded-full hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
              
              {/* Only show expanded content for contractors, not for material sections */}
              {readOnly && isExpanded(item.id) && item.metadata?.isContractor && (
                <div className="pl-6 mt-1 space-y-1">
                  {/* Show contractor information if this is a contractor */}
                  <div className="py-2 px-3 bg-slate-50 rounded-md text-xs text-slate-700 border border-slate-200">
                    <div className="flex items-center mb-2">
                      <span className="h-1.5 w-1.5 bg-green-400 rounded-full mr-2"></span>
                      <span className="font-medium">Click to view labor details</span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      This contractor's labor records can be viewed by clicking the card.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">
            {emptyText}
          </div>
        )}
      </div>

      {!readOnly && availableItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableItems.map(item => (
            <Badge 
              key={item.id} 
              variant="secondary"
              className={cn(
                "cursor-pointer flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium opacity-70 hover:opacity-100",
                item.color
              )}
              onClick={() => onItemSelect(item.id)}
            >
              <span>{item.label}</span>
              {item.subtext && (
                <span className="text-muted-foreground text-xs">({item.subtext})</span>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}