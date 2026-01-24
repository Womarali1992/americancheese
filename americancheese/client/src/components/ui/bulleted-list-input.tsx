import React, { useState, useRef, KeyboardEvent } from 'react';
import { X, Plus, GripVertical, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface BulletedListInputProps {
  /** Current list items */
  value: string[];
  /** Callback when items change */
  onChange: (value: string[]) => void;
  /** Placeholder for new item input */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether the component is read-only */
  readOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Maximum number of items allowed */
  maxItems?: number;
  /** Show bullet points */
  showBullets?: boolean;
  /** Allow reordering items */
  allowReorder?: boolean;
}

export function BulletedListInput({
  value,
  onChange,
  placeholder = 'Add item...',
  disabled = false,
  readOnly = false,
  className,
  maxItems,
  showBullets = true,
  allowReorder = false,
}: BulletedListInputProps) {
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add a new item
  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (maxItems && value.length >= maxItems) return;

    onChange([...value, trimmed]);
    setNewItem('');
    inputRef.current?.focus();
  };

  // Remove an item
  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  // Update an item
  const updateItem = (index: number, newValue: string) => {
    const trimmed = newValue.trim();
    if (!trimmed) {
      removeItem(index);
    } else {
      onChange(value.map((item, i) => (i === index ? trimmed : item)));
    }
    setEditingIndex(null);
  };

  // Start editing an item
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(value[index]);
    setTimeout(() => editRef.current?.focus(), 0);
  };

  // Handle keyboard events for new item input
  const handleNewItemKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  // Handle keyboard events for edit input
  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateItem(index, editValue);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...value];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    onChange(newItems);

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Can we add more items?
  const canAddMore = !maxItems || value.length < maxItems;

  if (readOnly) {
    return (
      <div className={cn('space-y-1', className)}>
        {value.length > 0 ? (
          <ul className="space-y-1">
            {value.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                {showBullets && (
                  <Circle className="h-1.5 w-1.5 mt-2 fill-current flex-shrink-0" />
                )}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-muted-foreground">No items</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* List items */}
      <ul className="space-y-1">
        {value.map((item, index) => (
          <li
            key={index}
            className={cn(
              'flex items-center gap-2 group rounded-md transition-colors',
              allowReorder && 'cursor-move',
              dragOverIndex === index && 'bg-muted/50',
              dragIndex === index && 'opacity-50'
            )}
            draggable={allowReorder && !disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            {allowReorder && !disabled && (
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            )}

            {/* Bullet */}
            {showBullets && (
              <Circle className="h-1.5 w-1.5 fill-current flex-shrink-0 text-muted-foreground" />
            )}

            {/* Item content or edit input */}
            {editingIndex === index ? (
              <Input
                ref={editRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, index)}
                onBlur={() => updateItem(index, editValue)}
                className="h-7 text-sm flex-1"
                disabled={disabled}
              />
            ) : (
              <span
                className={cn(
                  'flex-1 text-sm py-0.5',
                  !disabled && 'cursor-text hover:text-primary'
                )}
                onClick={() => !disabled && startEdit(index)}
              >
                {item}
              </span>
            )}

            {/* Remove button */}
            {!disabled && editingIndex !== index && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Add new item */}
      {!disabled && canAddMore && (
        <div className="flex items-center gap-2">
          {showBullets && (
            <Circle className="h-1.5 w-1.5 fill-current flex-shrink-0 text-muted-foreground ml-6" />
          )}
          <Input
            ref={inputRef}
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleNewItemKeyDown}
            placeholder={placeholder}
            className="h-7 text-sm flex-1"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addItem}
            disabled={!newItem.trim()}
            className="h-7 px-2"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Max items indicator */}
      {maxItems && (
        <p className="text-xs text-muted-foreground">
          {value.length} / {maxItems} items
        </p>
      )}
    </div>
  );
}
