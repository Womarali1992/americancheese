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
      <div className="flex flex-col gap-2 min-h-10 p-2 border rounded-md bg-background">
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
              
              {/* Expanded content for materials, contractors, or subsections within a section */}
              {readOnly && isExpanded(item.id) && (
                <div className="pl-6 mt-1 space-y-1">
                  {/* Show contractor information if this is a contractor */}
                  {item.metadata?.isContractor && (
                    <div className="py-2 px-3 bg-slate-50 rounded-md text-xs text-slate-700 border border-slate-200">
                      <div className="flex items-center mb-2">
                        <span className="h-1.5 w-1.5 bg-green-400 rounded-full mr-2"></span>
                        <span className="font-medium">Click to view labor details</span>
                      </div>
                      <p className="text-slate-500 text-xs">
                        This contractor's labor records can be viewed by clicking the card.
                      </p>
                    </div>
                  )}
                  
                  {/* Show subsections if this item has subsections */}
                  {item.metadata?.subsections && item.metadata.subsections.map((subsection: WordbankItem) => (
                    <div key={subsection.id}>
                      <Badge 
                        variant="outline"
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-1.5 rounded-md text-xs font-medium mb-1",
                          readOnly && "cursor-pointer hover:bg-muted/10",
                          subsection.color
                        )}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event bubbling
                          console.log("Subsection click handler - ID:", subsection.id);
                          if (readOnly) {
                            // Only toggle the expanded state for this subsection
                            toggleExpanded(subsection.id);
                            
                            // Don't trigger onItemSelect for the subsection ID, as we only want to expand/collapse
                            // When handling subsections with triple underscores
                            if (typeof subsection.id === 'string' && subsection.id.includes('___')) {
                              console.log("Triple underscore subsection detected, preventing selection");
                              e.preventDefault();
                              return;
                            }
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {/* Chevron icons removed as requested */}
                          <span>{subsection.label}</span>
                          {subsection.subtext && (
                            <span className="text-xs opacity-70 ml-1">({subsection.subtext})</span>
                          )}
                        </div>
                      </Badge>
                      
                      {/* Show materials for expanded subsections */}
                      {isExpanded(subsection.id) && subsection.metadata?.materialIds && (
                        <div className="pl-4 mt-1 mb-2 space-y-1">
                          {subsection.metadata.materialIds.map((materialId: number) => (
                            <div 
                              key={materialId} 
                              className="text-xs text-slate-600 flex items-center justify-between py-0.5 px-2 hover:bg-muted/20 rounded cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent event bubbling
                                onItemSelect(materialId);
                              }}
                            >
                              <div className="flex items-center">
                                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full mr-2"></span>
                                {/* Find the material name based on ID - Add a fallback if material not found */}
                                {subsection.metadata?.materialNames?.[materialId] || `Material #${materialId}`}
                              </div>
                              {/* Display quantity and unit if available */}
                              {subsection.metadata?.materialQuantities?.[materialId] && (
                                <span className="text-xs font-medium text-slate-500">
                                  {subsection.metadata.materialQuantities[materialId]} {subsection.metadata?.materialUnits?.[materialId] || ''}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground py-1 px-2">
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