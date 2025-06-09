import React, { useState } from 'react';
import { Check, Plus, X, GripVertical, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ChecklistItem, InsertChecklistItem } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { ChecklistItemComments } from './ChecklistItemComments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskChecklistManagerProps {
  taskId: number;
}

interface ChecklistItemFormData {
  title: string;
  description: string;
  section: string;
  assignedTo: string;
  dueDate: string;
}

export function TaskChecklistManager({ taskId }: TaskChecklistManagerProps) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [formData, setFormData] = useState<ChecklistItemFormData>({
    title: '',
    description: '',
    section: '',
    assignedTo: '',
    dueDate: ''
  });
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch checklist items
  const { data: checklistItems = [], isLoading } = useQuery<ChecklistItem[]>({
    queryKey: [`/api/tasks/${taskId}/checklist`],
    enabled: taskId > 0,
  });

  // Create checklist item mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertChecklistItem) => 
      apiRequest(`/api/tasks/${taskId}/checklist`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/checklist`] });
      setIsAddingItem(false);
      setFormData({
        title: '',
        description: '',
        section: '',
        assignedTo: '',
        dueDate: ''
      });
      toast({
        title: "Success",
        description: "Checklist item added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add checklist item",
        variant: "destructive",
      });
    },
  });

  // Update checklist item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertChecklistItem> }) =>
      apiRequest(`/api/checklist/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/checklist`] });
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Checklist item updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update checklist item",
        variant: "destructive",
      });
    },
  });

  // Delete checklist item mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/checklist/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/checklist`] });
      toast({
        title: "Success",
        description: "Checklist item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete checklist item",
        variant: "destructive",
      });
    },
  });

  // Toggle completion status
  const handleToggleComplete = (item: ChecklistItem) => {
    updateMutation.mutate({
      id: item.id,
      data: { completed: !item.completed }
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const newItem: InsertChecklistItem = {
      taskId,
      title: formData.title,
      description: formData.description || null,
      section: formData.section || null,
      assignedTo: formData.assignedTo || null,
      dueDate: formData.dueDate || null,
      completed: false,
      sortOrder: checklistItems.length,
    };

    createMutation.mutate(newItem);
  };

  // Calculate progress
  const completedItems = checklistItems.filter(item => item.completed).length;
  const totalItems = checklistItems.length;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group items by section
  const groupedItems = checklistItems.reduce((acc, item) => {
    const section = item.section || 'General';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const sections = Object.keys(groupedItems).sort();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Task Checklist
          </CardTitle>
          <Button
            onClick={() => setIsAddingItem(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
        
        {totalItems > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{completedItems} of {totalItems} completed</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add new item form */}
        {isAddingItem && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Checklist item title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Select
                    value={formData.section}
                    onValueChange={(value) => setFormData({ ...formData, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Preparation">Preparation</SelectItem>
                      <SelectItem value="Execution">Execution</SelectItem>
                      <SelectItem value="Quality Control">Quality Control</SelectItem>
                      <SelectItem value="Completion">Completion</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Input
                    placeholder="Assigned to"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  />
                </div>

                <div>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Item'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAddingItem(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Checklist items grouped by section */}
        {totalItems === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No checklist items yet</p>
            <p className="text-sm">Add items to track task progress</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map(section => (
              <div key={section} className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                  {section}
                </h4>
                <div className="space-y-2">
                  {groupedItems[section].map(item => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                        item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <Checkbox
                        checked={item.completed || false}
                        onCheckedChange={() => handleToggleComplete(item)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${item.completed ? 'line-through text-gray-500' : ''}`}>
                          {item.title}
                        </div>
                        
                        {item.description && (
                          <div className={`text-sm mt-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                            {item.description}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2">
                          {item.assignedTo && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              {item.assignedTo}
                            </div>
                          )}
                          
                          {item.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          
                          <ChecklistItemComments 
                            checklistItemId={item.id}
                            checklistItemTitle={item.title}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}