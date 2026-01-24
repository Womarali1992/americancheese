import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export interface MultiSelectChipsProps {
  /** Currently selected values */
  value: string[];
  /** Callback when selection changes */
  onChange: (value: string[]) => void;
  /** Available options to choose from */
  options?: string[];
  /** Placeholder text when no items selected */
  placeholder?: string;
  /** Allow adding custom values not in options */
  allowCustom?: boolean;
  /** Custom input placeholder */
  inputPlaceholder?: string;
  /** Maximum number of selections allowed */
  maxSelections?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether the component is read-only */
  readOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Chip variant */
  chipVariant?: 'default' | 'secondary' | 'outline';
}

export function MultiSelectChips({
  value,
  onChange,
  options = [],
  placeholder = 'Select items...',
  allowCustom = true,
  inputPlaceholder = 'Search or add...',
  maxSelections,
  disabled = false,
  readOnly = false,
  className,
  chipVariant = 'secondary',
}: MultiSelectChipsProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options that aren't already selected
  const availableOptions = options.filter(opt => !value.includes(opt));

  // Filter available options based on search
  const filteredOptions = availableOptions.filter(opt =>
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Check if we can add more items
  const canAddMore = !maxSelections || value.length < maxSelections;

  // Add a new item
  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed || value.includes(trimmed)) return;
    if (!canAddMore) return;

    onChange([...value, trimmed]);
    setInputValue('');
  };

  // Remove an item
  const removeItem = (item: string) => {
    onChange(value.filter(v => v !== item));
  };

  // Handle keyboard events for custom input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addItem(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last item when backspace on empty input
      removeItem(value[value.length - 1]);
    }
  };

  if (readOnly) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {value.length > 0 ? (
          value.map(item => (
            <Badge key={item} variant={chipVariant} className="text-xs">
              {item}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {value.map(item => (
          <Badge
            key={item}
            variant={chipVariant}
            className="flex items-center gap-1 pr-1 text-xs"
          >
            {item}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted/50 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Add new items */}
      {!disabled && canAddMore && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-dashed text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add item
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput
                ref={inputRef}
                placeholder={inputPlaceholder}
                value={inputValue}
                onValueChange={setInputValue}
                onKeyDown={handleKeyDown}
              />
              <CommandList>
                {filteredOptions.length === 0 && !inputValue && (
                  <CommandEmpty>No options available.</CommandEmpty>
                )}
                {filteredOptions.length === 0 && inputValue && allowCustom && (
                  <CommandGroup>
                    <CommandItem
                      value={inputValue}
                      onSelect={() => {
                        addItem(inputValue);
                        setOpen(false);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{inputValue}"
                    </CommandItem>
                  </CommandGroup>
                )}
                {filteredOptions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {filteredOptions.slice(0, 10).map(option => (
                      <CommandItem
                        key={option}
                        value={option}
                        onSelect={() => {
                          addItem(option);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value.includes(option) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {option}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {inputValue && allowCustom && !options.includes(inputValue) && filteredOptions.length > 0 && (
                  <CommandGroup heading="Custom">
                    <CommandItem
                      value={`custom-${inputValue}`}
                      onSelect={() => {
                        addItem(inputValue);
                        setOpen(false);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{inputValue}"
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Max selections indicator */}
      {maxSelections && (
        <p className="text-xs text-muted-foreground">
          {value.length} / {maxSelections} selected
        </p>
      )}
    </div>
  );
}
