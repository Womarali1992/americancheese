import React, { useState } from 'react';
import { Check, Plus, X, GripVertical, Calendar, User, Edit2, UserPlus, ChevronDown, ChevronUp, MoreHorizontal, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskChecklistManagerProps {
  taskId: number;
}

interface ChecklistItemFormData {
  title: string;
  description: string;
  section: string;
  assignedTo: string;
  dueDate: string;
  contactIds: string[];
}

export function TaskChecklistManager({ taskId }: TaskChecklistManagerProps) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<ChecklistItemFormData>({
    title: '',
    description: '',
    section: '',
    assignedTo: '',
    dueDate: '',
    contactIds: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch checklist items
  const { data: checklistItems = [], isLoading } = useQuery<ChecklistItem[]>({
    queryKey: [`/api/tasks/${taskId}/checklist`],
    enabled: taskId > 0,
  });

  // Fetch contacts for tagging
  const { data: contacts = [] } = useQuery<Array<{id: number; name: string; role: string}>>({
    queryKey: ['/api/contacts'],
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
        dueDate: '',
        contactIds: []
      });
      toast({
        title: "Success",
        description: "Blocker item added successfully",
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
      setFormData({
        title: '',
        description: '',
        section: '',
        assignedTo: '',
        dueDate: '',
        contactIds: []
      });
      toast({
        title: "Success",
        description: "Blocker item updated successfully",
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

  // Toggle item expansion
  const toggleItemExpanded = (itemId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Handle drag and drop for checklist items
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      console.log('Checklist drag ended without destination');
      return;
    }

    if (result.source.index === result.destination.index) {
      console.log('No change in checklist item position');
      return;
    }

    const items = [...checklistItems];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    console.log('Reordering checklist items:', {
      movedItem: reorderedItem.title,
      fromIndex: result.source.index,
      toIndex: result.destination.index
    });

    toast({
      title: "Checklist Reordered",
      description: `Moved "${reorderedItem.title}" from position ${result.source.index + 1} to ${result.destination.index + 1}`,
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
      contactIds: formData.contactIds.length > 0 ? formData.contactIds : null,
      completed: false,
      sortOrder: checklistItems.length,
    };

    createMutation.mutate(newItem);
  };

  // Handle editing an item
  const handleEditItem = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      section: item.section || '',
      assignedTo: item.assignedTo || '',
      dueDate: item.dueDate || '',
      contactIds: item.contactIds || []
    });
  };

  // Handle updating an item
  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: editingItem.id,
      data: {
        title: formData.title,
        description: formData.description || null,
        section: formData.section || null,
        assignedTo: formData.assignedTo || null,
        dueDate: formData.dueDate || null,
        contactIds: formData.contactIds.length > 0 ? formData.contactIds : null,
      }
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      section: '',
      assignedTo: '',
      dueDate: '',
      contactIds: []
    });
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
            Blocker Board
          </CardTitle>
          <Button
            onClick={() => setIsAddingItem(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Blocker
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
                  placeholder="Blocker item title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Description (optional) - Use line breaks to create paragraphs"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="resize-y min-h-[80px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Press Enter twice to create paragraph breaks
                </p>
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

              {/* Contact Tagging */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tagged Contacts</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.contactIds.map(contactId => {
                    const contact = contacts.find(c => c.id.toString() === contactId);
                    return contact ? (
                      <Badge key={contactId} variant="secondary" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {contact.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => setFormData({
                            ...formData,
                            contactIds: formData.contactIds.filter(id => id !== contactId)
                          })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !formData.contactIds.includes(value)) {
                      setFormData({
                        ...formData,
                        contactIds: [...formData.contactIds, value]
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.filter(contact => 
                      !formData.contactIds.includes(contact.id.toString())
                    ).map(contact => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {contact.name} - {contact.role}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        {/* Blocker items grouped by section */}
        {totalItems === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No blocker items yet</p>
            <p className="text-sm">Add items to track blockers and issues</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              {sections.map(section => (
                <div key={section} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                    {section}
                  </h4>
                  <Droppable droppableId={section}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[2rem] p-2 rounded transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                      >
                        {groupedItems[section].map((item, index) => (
                          <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-start gap-3 p-3 border rounded-lg transition-all duration-200 ${
                                  snapshot.isDragging 
                                    ? 'shadow-lg border-blue-300 bg-white scale-105 rotate-1' 
                                    : item.completed 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div 
                                  {...provided.dragHandleProps}
                                  className="mt-1 cursor-grab active:cursor-grabbing opacity-100 flex-shrink-0"
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                </div>
                      {editingItem?.id === item.id ? (
                        // Edit mode
                        <div className="flex-1 space-y-3">
                          <form onSubmit={handleUpdateItem} className="space-y-3">
                            <div>
                              <Input
                                placeholder="Blocker item title *"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                              />
                            </div>
                            
                            <div>
                              <Textarea
                                placeholder="Description (optional) - Use line breaks to create paragraphs"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="resize-y min-h-[80px]"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Tip: Press Enter twice to create paragraph breaks
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                    <SelectItem value="Execution">Execution</SelectItem>
                                    <SelectItem value="Review">Review</SelectItem>
                                    <SelectItem value="Blockers">Blockers</SelectItem>
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

                            {/* Contact Tagging */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Tagged Contacts</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {formData.contactIds.map(contactId => {
                                  const contact = contacts.find(c => c.id.toString() === contactId);
                                  return contact ? (
                                    <Badge key={contactId} variant="secondary" className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {contact.name}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 ml-1"
                                        onClick={() => setFormData({
                                          ...formData,
                                          contactIds: formData.contactIds.filter(id => id !== contactId)
                                        })}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                              <Select
                                value=""
                                onValueChange={(value) => {
                                  if (value && !formData.contactIds.includes(value)) {
                                    setFormData({
                                      ...formData,
                                      contactIds: [...formData.contactIds, value]
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Add contact..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {contacts.filter(contact => 
                                    !formData.contactIds.includes(contact.id.toString())
                                  ).map(contact => (
                                    <SelectItem key={contact.id} value={contact.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {contact.name} - {contact.role}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="submit"
                                size="sm"
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        // Read-only mode with collapsible functionality
                        <>
                          <Checkbox
                            checked={item.completed || false}
                            onCheckedChange={() => handleToggleComplete(item)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div 
                              className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded ${item.completed ? 'bg-green-50' : ''}`}
                              onClick={(e) => {
                                // Don't trigger if clicking on interactive elements
                                const target = e.target as HTMLElement;
                                if (target.closest('button') || 
                                    target.closest('input') || 
                                    target.closest('[role="checkbox"]') ||
                                    target.closest('[data-badge]') ||
                                    target.closest('[data-radix-dialog-content]') ||
                                    target.closest('[data-radix-dialog-overlay]') ||
                                    target.closest('[data-radix-dialog-trigger]')) {
                                  return;
                                }
                                toggleItemExpanded(item.id);
                              }}
                            >
                              {item.description && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItemExpanded(item.id);
                                  }}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                >
                                  {expandedItems.has(item.id) ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <div className={`font-medium ${item.completed ? 'line-through text-gray-500' : ''}`}>
                                {item.title}
                              </div>
                            </div>
                            
                            {item.description && expandedItems.has(item.id) && (
                              <div className={`text-sm mt-2 ml-8 ${item.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                {item.description.split('\n').map((paragraph, index) => (
                                  <p key={index} className={`${index > 0 ? 'mt-2' : ''} leading-relaxed`}>
                                    {paragraph.trim() || '\u00A0'}
                                  </p>
                                ))}
                              </div>
                            )}
                            
                            {expandedItems.has(item.id) && (
                              <div className="flex items-center gap-4 mt-2 ml-8">
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
                                
                                {/* Tagged Contacts Display */}
                                {item.contactIds && item.contactIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.contactIds.map(contactId => {
                                      const contact = contacts.find(c => c.id.toString() === contactId);
                                      return contact ? (
                                        <Badge key={contactId} variant="outline" className="text-xs">
                                          <UserPlus className="h-3 w-3 mr-1" />
                                          {contact.name}
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                                
                                <ChecklistItemComments 
                                  checklistItemId={item.id}
                                  checklistItemTitle={item.title}
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditItem(item)}
                                  className="flex items-center gap-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteMutation.mutate(item.id)}
                                  disabled={deleteMutation.isPending}
                                  className="flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </>
                      )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  );
}