import React, { useState, useRef, KeyboardEvent } from 'react';
import { X, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface TagInputProps {
  /** Currently selected tags (without # prefix) */
  value: string[];
  /** Callback when tags change */
  onChange: (value: string[]) => void;
  /** Suggested tags to show as autocomplete */
  suggestions?: string[];
  /** Placeholder text for input */
  placeholder?: string;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether the component is read-only */
  readOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show hash prefix on tags */
  showHashPrefix?: boolean;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add tag...',
  maxTags,
  disabled = false,
  readOnly = false,
  className,
  showHashPrefix = true,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize tag (remove # if present, lowercase, trim)
  const normalizeTag = (tag: string): string => {
    return tag.replace(/^#/, '').toLowerCase().trim().replace(/\s+/g, '-');
  };

  // Add a new tag
  const addTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    if (!normalized || value.includes(normalized)) return;
    if (maxTags && value.length >= maxTags) return;

    onChange([...value, normalized]);
    setInputValue('');
    setShowSuggestions(false);
  };

  // Remove a tag
  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag when backspace on empty input
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(newValue.length > 0);
  };

  // Handle blur - add tag if there's input
  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
    // Delay hiding suggestions to allow click
    setTimeout(() => setShowSuggestions(false), 150);
  };

  // Filter suggestions based on input
  const filteredSuggestions = suggestions
    .filter(s => !value.includes(s))
    .filter(s => s.toLowerCase().includes(normalizeTag(inputValue)));

  // Can we add more tags?
  const canAddMore = !maxTags || value.length < maxTags;

  if (readOnly) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {value.length > 0 ? (
          value.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {showHashPrefix && <Hash className="h-3 w-3 mr-0.5" />}
              {tag}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No tags</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tags display */}
      <div className="flex flex-wrap gap-2">
        {value.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 pr-1 text-xs"
          >
            {showHashPrefix && <Hash className="h-3 w-3" />}
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted/50 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Input for adding new tags */}
      {!disabled && canAddMore && (
        <div className="relative">
          <div className="relative">
            <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={() => inputValue && setShowSuggestions(true)}
              placeholder={placeholder}
              className="h-8 pl-7 text-xs"
              disabled={disabled}
            />
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-auto">
              {filteredSuggestions.slice(0, 8).map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors flex items-center gap-1"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(suggestion);
                  }}
                >
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Max tags indicator */}
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {value.length} / {maxTags} tags
        </p>
      )}
    </div>
  );
}
