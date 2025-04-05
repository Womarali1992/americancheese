import React from 'react';
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
  // In readOnly mode with empty selectedItems array, we treat all items as selected
  const effectiveSelectedItems = readOnly && selectedItems.length === 0 
    ? items.map(item => item.id) // Select all items if in readOnly mode with empty selection
    : selectedItems;
  
  const selectedItemsMap = new Set(effectiveSelectedItems);
  const availableItems = items.filter(item => !selectedItemsMap.has(item.id));
  const selectedItemsFull = items.filter(item => selectedItemsMap.has(item.id));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-md bg-background">
        {selectedItemsFull.length > 0 ? (
          selectedItemsFull.map(item => (
            <Badge 
              key={item.id} 
              variant="outline"
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                readOnly && "cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1",
                item.color
              )}
              onClick={() => {
                if (readOnly) onItemSelect(item.id);
              }}
            >
              <span>{item.label}</span>
              {item.subtext && (
                <span className="text-xs opacity-70 ml-1">({item.subtext})</span>
              )}
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