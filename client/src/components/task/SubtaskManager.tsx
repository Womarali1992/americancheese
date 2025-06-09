import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Square, Trash2, Edit3, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Subtask } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubtaskManagerProps {
  taskId: number;
}

interface NewSubtaskData {
  title: string;
  description: string;
  status: string;
  assignedTo: string;
}

export function SubtaskManager({ taskId }: SubtaskManagerProps) {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [newSubtask, setNewSubtask] = useState<NewSubtaskData>({
    title: '',
    description: '',
    status: 'not_started',
    assignedTo: ''
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch subtasks for this task
  const { data: subtasks = [], isLoading } = useQuery<Subtask[]>({
    queryKey: [`/api/tasks/${taskId}/subtasks`],
    enabled: taskId > 0,
  });

  // Calculate progress
  const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
  const totalSubtasks = subtasks.length;
  const progressPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleAddSubtask = async () => {
    if (!newSubtask.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subtask title",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest(`/api/tasks/${taskId}/subtasks`, 'POST', {
        title: newSubtask.title,
        description: newSubtask.description || null,
        status: newSubtask.status,
        assignedTo: newSubtask.assignedTo || null,
        completed: false,
        sortOrder: subtasks.length
      });

      setNewSubtask({ title: '', description: '', status: 'not_started', assignedTo: '' });
      setIsAddingSubtask(false);
      
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/subtasks`] });
      
      toast({
        title: "Subtask Added",
        description: `"${newSubtask.title}" has been added to the task.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subtask. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (subtask: Subtask) => {
    try {
      await apiRequest(`/api/subtasks/${subtask.id}`, 'PUT', {
        completed: !subtask.completed
      });

      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/subtasks`] });
      
      toast({
        title: subtask.completed ? "Subtask Unchecked" : "Subtask Completed",
        description: `"${subtask.title}" marked as ${subtask.completed ? 'incomplete' : 'complete'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subtask. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubtask = async (subtask: Subtask, updates: Partial<Subtask>) => {
    try {
      await apiRequest(`/api/subtasks/${subtask.id}`, 'PUT', updates);

      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/subtasks`] });
      setEditingSubtask(null);
      
      toast({
        title: "Subtask Updated",
        description: `"${subtask.title}" has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subtask. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubtask = async (subtask: Subtask) => {
    try {
      await apiRequest(`/api/subtasks/${subtask.id}`, 'DELETE');

      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/subtasks`] });
      
      toast({
        title: "Subtask Deleted",
        description: `"${subtask.title}" has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subtask. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subtasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Subtasks</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {completedSubtasks} of {totalSubtasks} completed
                </span>
                <Badge variant="outline" className="text-xs">
                  {progressPercentage}%
                </Badge>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => setIsAddingSubtask(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Subtask
            </Button>
          </div>
          
          {totalSubtasks > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {subtasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Square className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No subtasks yet. Add your first subtask to get started.</p>
            </div>
          ) : (
            subtasks.map((subtask) => (
              <div 
                key={subtask.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  subtask.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Checkbox 
                  checked={subtask.completed || false}
                  onCheckedChange={() => handleToggleComplete(subtask)}
                  className="mt-0.5"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className={`font-medium ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {subtask.title}
                      </h4>
                      {subtask.description && (
                        <p className={`text-sm mt-1 ${subtask.completed ? 'line-through text-muted-foreground' : 'text-gray-600'}`}>
                          {subtask.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs ${getStatusColor(subtask.status)}`}>
                          {subtask.status.replace('_', ' ')}
                        </Badge>
                        {subtask.assignedTo && (
                          <Badge variant="outline" className="text-xs">
                            {subtask.assignedTo}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingSubtask(subtask)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSubtask(subtask)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add Subtask Dialog */}
      <Dialog open={isAddingSubtask} onOpenChange={setIsAddingSubtask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subtask</DialogTitle>
            <DialogDescription>
              Create a new subtask to break down this task into smaller actionable items.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newSubtask.title}
                onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter subtask title..."
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                value={newSubtask.description}
                onChange={(e) => setNewSubtask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter subtask description..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={newSubtask.status} 
                  onValueChange={(value) => setNewSubtask(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Assigned To (optional)</label>
                <Input
                  value={newSubtask.assignedTo}
                  onChange={(e) => setNewSubtask(prev => ({ ...prev, assignedTo: e.target.value }))}
                  placeholder="Enter assignee..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingSubtask(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubtask}>
              Add Subtask
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subtask Dialog */}
      {editingSubtask && (
        <Dialog open={!!editingSubtask} onOpenChange={() => setEditingSubtask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subtask</DialogTitle>
              <DialogDescription>
                Update the details of this subtask.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingSubtask.title}
                  onChange={(e) => setEditingSubtask(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                  placeholder="Enter subtask title..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingSubtask.description || ''}
                  onChange={(e) => setEditingSubtask(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  placeholder="Enter subtask description..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={editingSubtask.status} 
                    onValueChange={(value) => setEditingSubtask(prev => prev ? ({ ...prev, status: value }) : null)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Assigned To</label>
                  <Input
                    value={editingSubtask.assignedTo || ''}
                    onChange={(e) => setEditingSubtask(prev => prev ? ({ ...prev, assignedTo: e.target.value }) : null)}
                    placeholder="Enter assignee..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSubtask(null)}>
                Cancel
              </Button>
              <Button onClick={() => editingSubtask && handleUpdateSubtask(editingSubtask, {
                title: editingSubtask.title,
                description: editingSubtask.description,
                status: editingSubtask.status,
                assignedTo: editingSubtask.assignedTo
              })}>
                Update Subtask
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}