import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar, User, Edit2, MoreHorizontal, Trash2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
import { useTheme } from '@/hooks/useTheme';
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
  projectId?: number;
}

interface ChecklistItemFormData {
  title: string;
  description: string;
  section: string;
  assignedTo: string;
  dueDate: string;
  contactIds: string[];
}

// Kanban columns configuration
const KANBAN_COLUMNS = [
  { id: 'To Do', title: 'To Do' },
  { id: 'Planning', title: 'Planning' },
  { id: 'Preparation', title: 'Preparation' },
  { id: 'Execution', title: 'Execution' },
];

// Helper to lighten a hex color
function lightenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

export function TaskChecklistManager({ taskId, projectId }: TaskChecklistManagerProps) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedColumns] = useState<Set<string>>(new Set(['To Do', 'Planning', 'Preparation', 'Execution']));
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
  const { currentTheme } = useTheme(projectId);

  // Get theme colors for kanban columns
  const columnColors = useMemo(() => {
    const colors = [
      currentTheme.tier1.subcategory1,
      currentTheme.tier1.subcategory2,
      currentTheme.tier1.subcategory3,
      currentTheme.tier1.subcategory4,
    ];
    return KANBAN_COLUMNS.map((col, idx) => ({
      ...col,
      bgColor: lightenHex(colors[idx], 0.85),
      borderColor: colors[idx],
    }));
  }, [currentTheme]);

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

  // Kanban drag and drop handler - moves items between columns
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    const itemId = parseInt(draggableId);
    const item = checklistItems.find(i => i.id === itemId);
    
    if (!item) return;
    
    // If dropped in a different column, update the section
    if (source.droppableId !== destination.droppableId) {
      const newSection = destination.droppableId;
      
      // Optimistically update UI
      const updatedItems = checklistItems.map(i => 
        i.id === itemId ? { ...i, section: newSection } : i
      );
      queryClient.setQueryData([`/api/tasks/${taskId}/checklist`], updatedItems);
      
      // Update on server
      updateMutation.mutate({
        id: itemId,
        data: { section: newSection }
      });
      
      toast({
        title: "Blocker Moved",
        description: `Moved "${item.title}" to ${newSection}`,
      });
    }
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

  // Group items by kanban column (section)
  const getItemsByColumn = (columnId: string) => {
    return checklistItems.filter(item => {
      const section = item.section || 'To Do';
      return section === columnId;
    });
  };


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
      <CardHeader 
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
            Blocker Board
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">{completedItems}/{totalItems}</Badge>
            )}
          </CardTitle>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
              setIsAddingItem(true);
            }}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Blocker
          </Button>
        </div>
        
        {totalItems > 0 && (
          <div className="space-y-2 mt-2">
            <Progress value={progressPercentage} className="w-full" />
          </div>
        )}
      </CardHeader>

      {isExpanded && (
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
                    value={formData.section || 'To Do'}
                    onValueChange={(value) => setFormData({ ...formData, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {KANBAN_COLUMNS.map(col => (
                        <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                      ))}
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

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columnColors.map(column => {
              const columnItems = getItemsByColumn(column.id);
              return (
                <div 
                  key={column.id} 
                  className="rounded-lg border-2"
                  style={{ backgroundColor: column.bgColor, borderColor: column.borderColor }}
                >
                  <div className="p-3 border-b border-inherit">
                    <h4 className="font-semibold text-sm flex items-center justify-between">
                      <span>{column.title}</span>
                      <Badge variant="secondary" className="ml-2">{columnItems.length}</Badge>
                    </h4>
                  </div>
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 space-y-2 min-h-[150px] transition-all duration-200 ${
                          snapshot.isDraggingOver ? 'bg-blue-100/50' : ''
                        }`}
                      >
                        {columnItems.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center py-6 text-gray-400 text-xs">
                            Drop items here
                          </div>
                        )}
                        {columnItems.map((item, index) => (
                          <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 bg-white border rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                  snapshot.isDragging 
                                    ? 'shadow-lg border-blue-400 rotate-2 scale-105' 
                                    : item.completed 
                                      ? 'border-green-300 bg-green-50' 
                                      : 'border-gray-200 hover:border-gray-300 hover:shadow'
                                }`}
                              >
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
                                  value={formData.section || 'To Do'}
                                  onValueChange={(value) => setFormData({ ...formData, section: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {KANBAN_COLUMNS.map(col => (
                                      <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                                    ))}
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
                        // Kanban card view - compact
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Checkbox
                                checked={item.completed || false}
                                onCheckedChange={() => handleToggleComplete(item)}
                                className="mt-0.5"
                              />
                              <div className={`text-sm font-medium leading-tight ${item.completed ? 'line-through text-gray-500' : ''}`}>
                                {item.title}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 flex-shrink-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteMutation.mutate(item.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {item.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 pl-6">
                              {item.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap pl-6">
                            {item.assignedTo && (
                              <Badge variant="outline" className="text-xs py-0">
                                <User className="h-3 w-3 mr-1" />
                                {item.assignedTo}
                              </Badge>
                            )}
                            {item.dueDate && (
                              <Badge variant="outline" className="text-xs py-0">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(item.dueDate).toLocaleDateString()}
                              </Badge>
                            )}
                            {/* Comments button */}
                            <ChecklistItemComments
                              checklistItemId={item.id}
                              checklistItemTitle={item.title}
                            />
                          </div>
                        </div>
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
              );
            })}
          </div>
        </DragDropContext>
      </CardContent>
      )}
    </Card>
  );
}