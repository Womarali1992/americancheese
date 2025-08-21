import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, Copy, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Simple unified drag drop - supports both reordering and content export
// This replaces the 3 separate implementations with one clean approach

// Types for different drag and drop scenarios
export interface DragItem {
  id: string | number;
  title: string;
  sortOrder?: number;
  [key: string]: any;
}

export interface DragDropConfig {
  type: 'reorder' | 'export' | 'both';
  // For reordering
  reorderEndpoint?: string;
  reorderQueryKey?: string[];
  // For exporting
  exportContent?: string;
  exportTitle?: string;
  showExportHandle?: boolean;
}

interface UnifiedDragDropProps {
  items: DragItem[];
  config: DragDropConfig;
  children: (item: DragItem, index: number, isDragging: boolean, dragHandleProps?: any) => React.ReactNode;
  onReorderComplete?: (newOrder: DragItem[]) => void;
  className?: string;
  droppableId?: string;
}

export function UnifiedDragDrop({ 
  items, 
  config, 
  children, 
  onReorderComplete, 
  className = "",
  droppableId = "droppable"
}: UnifiedDragDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragSuccess, setDragSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedItems: DragItem[]) => {
      if (!config.reorderEndpoint) return;
      
      if (config.reorderEndpoint.includes('/checklist/reorder')) {
        const itemIds = reorderedItems.map(item => item.id);
        return apiRequest(config.reorderEndpoint, 'PUT', { itemIds });
      } else {
        // For other endpoints, update individual items
        const updates = reorderedItems.map((item, index) => 
          apiRequest(`${config.reorderEndpoint}/${item.id}`, 'PATCH', { sortOrder: index })
        );
        await Promise.all(updates);
      }
    },
    onSuccess: (_, reorderedItems) => {
      if (config.reorderQueryKey) {
        queryClient.invalidateQueries({ queryKey: config.reorderQueryKey });
      }
      onReorderComplete?.(reorderedItems);
      toast({
        title: "Items Reordered",
        description: "Order has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to reorder items:', error);
      toast({
        title: "Error",
        description: "Failed to save new order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle drag and drop for reordering
  const handleDragEnd = (result: DropResult) => {
    if (config.type === 'export') return;

    if (!result.destination) {
      console.log('Drag ended without destination');
      return;
    }

    if (result.source.index === result.destination.index) {
      console.log('No change in position');
      return;
    }

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    const itemsWithNewOrder = newItems.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    console.log('Reordering items:', {
      movedItem: reorderedItem.title,
      fromIndex: result.source.index,
      toIndex: result.destination.index
    });

    // Optimistically update UI
    if (config.reorderQueryKey) {
      queryClient.setQueryData(config.reorderQueryKey, itemsWithNewOrder);
    }

    reorderMutation.mutate(itemsWithNewOrder);
  };

  // Handle content export dragging
  const handleExportDragStart = (e: React.DragEvent) => {
    if (config.type === 'reorder' || !config.exportContent) return;

    setIsDragging(true);
    
    // Clear and set drag data
    e.dataTransfer.clearData();
    e.dataTransfer.setData('text/plain', config.exportContent);
    e.dataTransfer.setData('text/html', `<div>${config.exportContent.replace(/\n/g, '<br>')}</div>`);
    e.dataTransfer.effectAllowed = 'copy';

    // Custom drag image
    const dragImage = document.createElement('div');
    const contentPreview = config.exportContent.substring(0, 100) + (config.exportContent.length > 100 ? '...' : '');
    dragImage.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">CONTENT</div>
        <div style="font-weight: 600;">${config.exportTitle || 'Content'}</div>
      </div>
      <div style="color: #6b7280; font-size: 12px; margin-top: 4px; max-width: 300px; word-wrap: break-word;">${contentPreview}</div>
    `;
    dragImage.style.cssText = 'position: absolute; top: -2000px; left: -2000px; background: white; padding: 16px; border: 2px solid #10b981; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.2); z-index: 9999; font-family: system-ui, -apple-system, sans-serif; max-width: 350px; color: #374151;';
    document.body.appendChild(dragImage);

    try {
      e.dataTransfer.setDragImage(dragImage, 30, 20);
    } catch (error) {
      console.warn('Could not set custom drag image:', error);
    }

    // Cleanup and success handling
    const cleanup = () => {
      try {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      } catch (error) {
        console.warn('Error cleaning up drag image:', error);
      }
    };

    const handleDragEnd = () => {
      cleanup();
      setIsDragging(false);
      setDragSuccess(true);
      
      toast({
        title: "Content Copied",
        description: "Content ready to paste in external applications.",
        duration: 3000,
      });

      setTimeout(() => setDragSuccess(false), 2000);
      document.removeEventListener('dragend', handleDragEnd);
    };

    setTimeout(cleanup, 100);
    document.addEventListener('dragend', handleDragEnd);
  };

  // For export-only mode
  if (config.type === 'export') {
    return (
      <div 
        className={`transition-all duration-200 ${
          isDragging ? 'ring-2 ring-green-500 ring-offset-2 bg-green-50' : ''
        } ${dragSuccess ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' : ''} ${className}`}
        draggable={true}
        onDragStart={handleExportDragStart}
      >
        {items.map((item, index) => children(item, index, isDragging))}
        
        {config.showExportHandle && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded px-2 py-1 text-xs cursor-grab active:cursor-grabbing">
            {dragSuccess ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <GripVertical className="h-3 w-3" />
            <span>{dragSuccess ? 'Copied!' : 'Drag to copy'}</span>
          </div>
        )}
      </div>
    );
  }

  // For reorder-only or both modes
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
            } ${className}`}
            {...(config.type === 'both' ? {
              draggable: true,
              onDragStart: handleExportDragStart
            } : {})}
          >
            {items.map((item, index) => (
              <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative transition-all duration-200 ${
                      snapshot.isDragging ? 'shadow-lg scale-105 rotate-1 z-10' : ''
                    }`}
                  >
                    {children(item, index, snapshot.isDragging, provided.dragHandleProps)}
                    
                    {/* Unified drag handle for reordering */}
                    <div 
                      {...provided.dragHandleProps}
                      className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded p-1 border border-gray-200 z-20"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}