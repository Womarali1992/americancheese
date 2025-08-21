import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Subtask {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  sortOrder: number;
  parentTaskId: number;
}

interface SubtaskDragDropProps {
  subtasks: Subtask[];
  taskId: number;
  children: (subtask: Subtask, index: number, isDragging: boolean) => React.ReactNode;
  onReorderComplete?: (newOrder: Subtask[]) => void;
}

export function SubtaskDragDrop({ subtasks, taskId, children, onReorderComplete }: SubtaskDragDropProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update subtask order mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedItems: Subtask[]) => {
      // Update each subtask's sortOrder
      const updates = reorderedItems.map((subtask, index) => 
        apiRequest(`/api/subtasks/${subtask.id}`, 'PATCH', { sortOrder: index })
      );
      await Promise.all(updates);
      return reorderedItems;
    },
    onSuccess: (reorderedItems) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/subtasks`] });
      onReorderComplete?.(reorderedItems);
      toast({
        title: "Subtasks Reordered",
        description: "Subtask order has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to reorder subtasks:', error);
      toast({
        title: "Error",
        description: "Failed to save new subtask order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle drag and drop for subtasks
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      console.log('Subtask drag ended without destination');
      return;
    }

    if (result.source.index === result.destination.index) {
      console.log('No change in subtask position');
      return;
    }

    // Create new order
    const newSubtasks = Array.from(subtasks);
    const [reorderedSubtask] = newSubtasks.splice(result.source.index, 1);
    newSubtasks.splice(result.destination.index, 0, reorderedSubtask);

    // Update sort orders
    const itemsWithNewOrder = newSubtasks.map((subtask, index) => ({
      ...subtask,
      sortOrder: index,
    }));

    console.log('Reordering subtasks:', {
      movedSubtask: reorderedSubtask.title,
      fromIndex: result.source.index,
      toIndex: result.destination.index
    });

    // Optimistically update the UI
    queryClient.setQueryData([`/api/tasks/${taskId}/subtasks`], itemsWithNewOrder);

    // Save new order
    reorderMutation.mutate(itemsWithNewOrder);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="subtasks">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
            }`}
          >
            {subtasks.map((subtask, index) => (
              <Draggable key={subtask.id.toString()} draggableId={subtask.id.toString()} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group relative transition-all duration-200 ${
                      snapshot.isDragging 
                        ? 'shadow-lg scale-105 rotate-1 z-10' 
                        : ''
                    }`}
                  >
                    {children(subtask, index, snapshot.isDragging)}
                    
                    {/* Drag handle overlay */}
                    <div 
                      {...provided.dragHandleProps}
                      className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded p-1 border border-gray-200"
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