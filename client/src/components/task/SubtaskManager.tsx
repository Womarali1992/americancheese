import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Square, Trash2, Edit3, GripVertical, AtSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Subtask, Labor, Contact, Material } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { SubtaskComments } from './SubtaskComments';
import { CommentableDescription } from '../CommentableDescription';
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
  // Subtask tagging states
  const [showSubtaskTagging, setShowSubtaskTagging] = useState<Record<number, boolean>>({});
  const [subtaskTagText, setSubtaskTagText] = useState<Record<number, string>>({});
  const [subtaskSuggestions, setSubtaskSuggestions] = useState<Record<number, Array<{type: 'labor' | 'contact' | 'material', item: any}>>>({});
  const [subtaskTags, setSubtaskTags] = useState<Record<number, {laborIds: number[], contactIds: number[], materialIds: number[]}>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch subtasks for this task
  const { data: subtasks = [], isLoading } = useQuery<Subtask[]>({
    queryKey: [`/api/tasks/${taskId}/subtasks`],
    enabled: taskId > 0,
  });

  // Fetch labor data for tagging
  const { data: taskLabor = [] } = useQuery<Labor[]>({
    queryKey: [`/api/tasks/${taskId}/labor`],
    enabled: taskId > 0,
  });

  const { data: allLabor = [] } = useQuery<Labor[]>({
    queryKey: ['/api/labor'],
    enabled: taskId > 0,
  });

  // Fetch contacts for tagging
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Fetch materials for tagging
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
  });

  // Combined labor data
  const combinedLabor = useMemo(() => {
    const directLabor = taskLabor || [];
    const filteredAllLabor = allLabor.filter(labor => labor.taskId === taskId);
    
    const laborMap = new Map();
    [...directLabor, ...filteredAllLabor].forEach(labor => {
      laborMap.set(labor.id, labor);
    });
    
    return Array.from(laborMap.values());
  }, [taskLabor, allLabor, taskId]);

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

  const handleSubtaskDescriptionChange = async (subtask: Subtask, newDescription: string) => {
    console.log('Saving subtask description change:', {
      subtaskId: subtask.id,
      title: subtask.title,
      newDescription: newDescription.substring(0, 100) + '...'
    });
    
    try {
      const response = await apiRequest(`/api/subtasks/${subtask.id}`, 'PUT', {
        description: newDescription
      });
      
      console.log('Subtask description save successful:', response);

      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/subtasks`] });
      
      toast({
        title: "Subtask Updated",
        description: `Description for "${subtask.title}" has been updated.`,
      });
    } catch (error) {
      console.error('Failed to save subtask description:', error);
      toast({
        title: "Error",
        description: "Failed to update subtask description. Please try again.",
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

  // Subtask tagging functions
  const updateSubtaskSuggestions = (subtaskId: number, text: string) => {
    if (!text.includes('@')) {
      setSubtaskSuggestions(prev => ({ ...prev, [subtaskId]: [] }));
      return;
    }

    const atIndex = text.lastIndexOf('@');
    const searchTerm = text.substring(atIndex + 1).toLowerCase();
    
    if (searchTerm.length === 0) {
      setSubtaskSuggestions(prev => ({ ...prev, [subtaskId]: [] }));
      return;
    }

    const allSuggestions: Array<{type: 'labor' | 'contact' | 'material', item: any}> = [];

    // Add labor suggestions
    combinedLabor.forEach(labor => {
      if (labor.fullName?.toLowerCase().includes(searchTerm)) {
        allSuggestions.push({ type: 'labor', item: labor });
      }
    });

    // Add contact suggestions
    contacts.forEach(contact => {
      if (contact.name?.toLowerCase().includes(searchTerm)) {
        allSuggestions.push({ type: 'contact', item: contact });
      }
    });

    // Add material suggestions
    materials.forEach(material => {
      if (material.name?.toLowerCase().includes(searchTerm)) {
        allSuggestions.push({ type: 'material', item: material });
      }
    });

    setSubtaskSuggestions(prev => ({ ...prev, [subtaskId]: allSuggestions.slice(0, 5) }));
  };

  const selectSubtaskSuggestion = (subtaskId: number, suggestion: {type: 'labor' | 'contact' | 'material', item: any}) => {
    const currentTags = subtaskTags[subtaskId] || { laborIds: [], contactIds: [], materialIds: [] };
    const newTags = { ...currentTags };

    if (suggestion.type === 'labor' && !newTags.laborIds.includes(suggestion.item.id)) {
      newTags.laborIds.push(suggestion.item.id);
    } else if (suggestion.type === 'contact' && !newTags.contactIds.includes(suggestion.item.id)) {
      newTags.contactIds.push(suggestion.item.id);
    } else if (suggestion.type === 'material' && !newTags.materialIds.includes(suggestion.item.id)) {
      newTags.materialIds.push(suggestion.item.id);
    }

    setSubtaskTags(prev => ({ ...prev, [subtaskId]: newTags }));
    setSubtaskTagText(prev => ({ ...prev, [subtaskId]: '' }));
    setSubtaskSuggestions(prev => ({ ...prev, [subtaskId]: [] }));
    setShowSubtaskTagging(prev => ({ ...prev, [subtaskId]: false }));

    toast({
      title: "Tag added",
      description: `${suggestion.item.name || suggestion.item.fullName} tagged to subtask`,
    });
  };

  const removeSubtaskTag = (subtaskId: number, type: 'labor' | 'contact' | 'material', tagId: number) => {
    const currentTags = subtaskTags[subtaskId] || { laborIds: [], contactIds: [], materialIds: [] };
    const newTags = { ...currentTags };

    if (type === 'labor') {
      newTags.laborIds = newTags.laborIds.filter(id => id !== tagId);
    } else if (type === 'contact') {
      newTags.contactIds = newTags.contactIds.filter(id => id !== tagId);
    } else if (type === 'material') {
      newTags.materialIds = newTags.materialIds.filter(id => id !== tagId);
    }

    setSubtaskTags(prev => ({ ...prev, [subtaskId]: newTags }));
  };

  const getSubtaskTaggedItems = (subtaskId: number) => {
    const tags = subtaskTags[subtaskId];
    if (!tags) return { labor: [], contacts: [], materials: [] };

    return {
      labor: combinedLabor.filter(l => tags.laborIds.includes(l.id)),
      contacts: contacts.filter(c => tags.contactIds.includes(c.id)),
      materials: materials.filter(m => tags.materialIds.includes(m.id))
    };
  };

  const copySubtaskReference = (subtask: Subtask) => {
    const referenceText = `- [ ] @subtask:${subtask.title}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referenceText).then(() => {
        toast({
          title: "Reference Copied",
          description: `Copied "${referenceText}" to clipboard. Paste this in the task description to create a checklist item linked to this subtask.`,
        });
      }).catch(() => {
        fallbackCopyToClipboard(referenceText);
      });
    } else {
      fallbackCopyToClipboard(referenceText);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      toast({
        title: "Reference Copied",
        description: `Copied "${text}" to clipboard. Paste this in the task description to create a checklist item linked to this subtask.`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy this text: " + text,
        variant: "destructive",
      });
    }
    document.body.removeChild(textArea);
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
            subtasks.map((subtask) => {
              const taggedItems = getSubtaskTaggedItems(subtask.id);
              const hasAnyTags = taggedItems.labor.length > 0 || taggedItems.contacts.length > 0 || taggedItems.materials.length > 0;
              
              return (
                <div key={subtask.id} className="space-y-2">
                  <div 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                      subtask.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                    data-subtask-title={subtask.title}
                    onClick={(e) => {
                      // Don't trigger if clicking on interactive elements
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || 
                          target.closest('input') || 
                          target.closest('[role="checkbox"]') ||
                          target.closest('[data-radix-collection-item]') ||
                          target.closest('[data-badge]')) {
                        return;
                      }
                      // Find and click the comment button
                      const commentButton = e.currentTarget.querySelector('[data-subtask-comment-trigger] button') as HTMLElement;
                      if (commentButton) {
                        commentButton.click();
                      }
                    }}
                  >
                    <Checkbox 
                      checked={subtask.completed || false}
                      onCheckedChange={() => handleToggleComplete(subtask)}
                      className="mt-0.5"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {subtask.title}
                            </h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSubtaskTagging(prev => ({ ...prev, [subtask.id]: !prev[subtask.id] }));
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <AtSign className="h-3 w-3" />
                            </Button>
                          </div>
                          {subtask.description && (
                            <div className={`mt-2 ${subtask.completed ? 'opacity-60' : ''}`}>
                              <CommentableDescription
                                description={subtask.description}
                                title={`Subtask: ${subtask.title}`}
                                className="text-sm"
                                onDescriptionChange={(newDescription) => handleSubtaskDescriptionChange(subtask, newDescription)}
                                entityType="subtask"
                                entityId={subtask.id}
                                fieldName="description"
                              />
                            </div>
                          )}

                          {/* Subtask Tags Display */}
                          {hasAnyTags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {taggedItems.labor.map((labor) => (
                                <Badge 
                                  key={`subtask-labor-${labor.id}`} 
                                  variant="outline" 
                                  className="text-xs bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100"
                                  onClick={() => removeSubtaskTag(subtask.id, 'labor', labor.id)}
                                  data-badge
                                >
                                  {labor.fullName} ×
                                </Badge>
                              ))}
                              {taggedItems.contacts.map((contact) => (
                                <Badge 
                                  key={`subtask-contact-${contact.id}`} 
                                  variant="outline" 
                                  className="text-xs bg-green-50 text-green-700 cursor-pointer hover:bg-green-100"
                                  onClick={() => removeSubtaskTag(subtask.id, 'contact', contact.id)}
                                  data-badge
                                >
                                  {contact.name} ×
                                </Badge>
                              ))}
                              {taggedItems.materials.map((material) => (
                                <Badge 
                                  key={`subtask-material-${material.id}`} 
                                  variant="outline" 
                                  className="text-xs bg-purple-50 text-purple-700 cursor-pointer hover:bg-purple-100"
                                  onClick={() => removeSubtaskTag(subtask.id, 'material', material.id)}
                                  data-badge
                                >
                                  {material.name.substring(0, 20)}{material.name.length > 20 ? '...' : ''} ×
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Subtask Tagging Input */}
                          {showSubtaskTagging[subtask.id] && (
                            <div className="mt-2 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Type @ and name to tag people/materials"
                                  value={subtaskTagText[subtask.id] || ''}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSubtaskTagText(prev => ({ 
                                      ...prev, 
                                      [subtask.id]: newValue 
                                    }));
                                    updateSubtaskSuggestions(subtask.id, newValue);
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      setShowSubtaskTagging(prev => ({ ...prev, [subtask.id]: false }));
                                    }
                                  }}
                                  className="flex-1 text-sm"
                                  autoFocus
                                />
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowSubtaskTagging(prev => ({ ...prev, [subtask.id]: false }))}
                                >
                                  Done
                                </Button>
                              </div>
                              
                              {/* Subtask Suggestions */}
                              {subtaskSuggestions[subtask.id] && subtaskSuggestions[subtask.id].length > 0 && (
                                <div className="border rounded-md max-h-32 overflow-y-auto bg-white shadow-lg">
                                  {subtaskSuggestions[subtask.id].map((suggestion, index) => {
                                    const name = suggestion.item.name || suggestion.item.fullName;
                                    const isSupplier = suggestion.type === 'contact' && 
                                      (suggestion.item.category?.toLowerCase().includes('supplier') || 
                                       suggestion.item.type?.toLowerCase().includes('supplier'));
                                    
                                    let badgeClass = '';
                                    let badgeText = '';
                                    if (suggestion.type === 'labor') {
                                      badgeClass = 'bg-blue-100 text-blue-800';
                                      badgeText = 'Labor';
                                    } else if (suggestion.type === 'contact') {
                                      badgeClass = isSupplier ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';
                                      badgeText = isSupplier ? 'Supplier' : 'Contact';
                                    } else {
                                      badgeClass = 'bg-purple-100 text-purple-800';
                                      badgeText = 'Material';
                                    }
                                    
                                    return (
                                      <div
                                        key={`${suggestion.type}-${suggestion.item.id}`}
                                        className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                                        onClick={() => selectSubtaskSuggestion(subtask.id, suggestion)}
                                      >
                                        <Badge variant="outline" className={`text-xs ${badgeClass}`}>
                                          {badgeText}
                                        </Badge>
                                        <span className="text-sm">
                                          {name.length > 40 ? `${name.substring(0, 40)}...` : name}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
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
                          <div data-subtask-comment-trigger>
                            <SubtaskComments
                              subtaskId={subtask.id}
                              subtaskTitle={subtask.title}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copySubtaskReference(subtask)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                            title="Copy @ reference for task description"
                          >
                            <AtSign className="h-3 w-3" />
                          </Button>
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
                </div>
              );
            })
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