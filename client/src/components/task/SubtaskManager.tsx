import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Square, Trash2, Edit3, GripVertical, AtSign, ChevronDown, ChevronUp, MoreHorizontal, MessageCircle, Copy } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  
  // Comment section state
  const [commentSectionId, setCommentSectionId] = useState<Record<number, number | undefined>>({});
  
  // Expanded subtasks state (retracted by default)
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<number, boolean>>({});
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<'left' | 'right' | null>(null);
  const [dragData, setDragData] = useState<{ subtask: Subtask, content: string } | null>(null);
  
  // Add global drag event handlers to improve external application support
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      if (isDragging) {
        e.preventDefault(); // Prevent default to allow drop
        e.dataTransfer!.dropEffect = 'copy';
      }
    };
    
    const handleGlobalDrop = (e: DragEvent) => {
      if (isDragging) {
        e.preventDefault();
        console.log('Global drop detected - content should be available for external applications');
      }
    };
    
    if (isDragging) {
      document.addEventListener('dragover', handleGlobalDragOver);
      document.addEventListener('drop', handleGlobalDrop);
      
      return () => {
        document.removeEventListener('dragover', handleGlobalDragOver);
        document.removeEventListener('drop', handleGlobalDrop);
      };
    }
  }, [isDragging]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch subtasks for this task
  const { data: subtasks = [], isLoading } = useQuery<Subtask[]>({
    queryKey: [`/api/tasks/${taskId}/subtasks`],
    enabled: taskId > 0,
  });

  // Fetch comment counts for all subtasks
  const { data: commentCounts = {} } = useQuery<Record<number, number>>({
    queryKey: [`/api/tasks/${taskId}/subtasks/comment-counts`],
    queryFn: async () => {
      if (subtasks.length === 0) return {};
      
      const counts: Record<number, number> = {};
      for (const subtask of subtasks) {
        try {
          const response = await fetch(`/api/subtasks/${subtask.id}/comments`);
          if (response.ok) {
            const comments = await response.json();
            // Count only overall subtask comments (where sectionId is null)
            const overallComments = comments.filter((comment: any) => comment.sectionId === null);
            counts[subtask.id] = overallComments.length;
          }
        } catch (error) {
          console.error(`Failed to fetch comment count for subtask ${subtask.id}:`, error);
          counts[subtask.id] = 0;
        }
      }
      return counts;
    },
    enabled: subtasks.length > 0,
  });

  // Fetch the task data for context
  const { data: task } = useQuery<any>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: taskId > 0,
  });

  // Fetch the project data for context
  const { data: project } = useQuery<any>({
    queryKey: [`/api/projects/${task?.projectId}`],
    enabled: !!task?.projectId,
  });

  // Fetch project categories for descriptions
  const { data: projectCategories = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${task?.projectId}/template-categories`],
    enabled: !!task?.projectId,
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

  // Helper function to find category description
  const getCategoryDescription = (categoryName: string, categoryType: 'tier1' | 'tier2') => {
    // Try case-insensitive matching
    const category = projectCategories.find((cat: any) => 
      cat.name.toLowerCase() === categoryName.toLowerCase() && cat.type === categoryType
    );
    return category?.description || null;
  };

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

  const toggleSubtaskExpanded = (subtaskId: number) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [subtaskId]: !prev[subtaskId]
    }));
  };

  // Drag and drop utility functions
  const generateSubtaskPrompt = useCallback((subtask: Subtask) => {
    let prompt = `Subtask: ${subtask.title}`;
    if (subtask.description) {
      prompt += `\n\nDescription: ${subtask.description}`;
    }
    prompt += `\n\nStatus: ${subtask.status.replace('_', ' ')}`;
    if (subtask.assignedTo) {
      prompt += `\nAssigned to: ${subtask.assignedTo}`;
    }
    return prompt;
  }, []);

  const generateSubtaskContext = useCallback((subtask: Subtask) => {
    let context = `Project Context:\n`;
    if (project) {
      context += `Project: ${project.name}\n`;
      if (project.description) {
        context += `Project Description: ${project.description}\n`;
      }
    }
    
    if (task) {
      context += `\nTask Context:\n`;
      context += `Task: ${task.title}\n`;
      if (task.description) {
        context += `Task Description: ${task.description}\n`;
      }
      if (task.tier1Category) {
        context += `Category: ${task.tier1Category}`;
        if (task.tier2Category) {
          context += ` > ${task.tier2Category}`;
        }
        context += '\n';
      }
    }

    context += `\nSubtask Details:\n`;
    context += `Title: ${subtask.title}\n`;
    if (subtask.description) {
      context += `Description: ${subtask.description}\n`;
    }
    context += `Status: ${subtask.status.replace('_', ' ')}\n`;
    if (subtask.assignedTo) {
      context += `Assigned to: ${subtask.assignedTo}\n`;
    }
    
    // Add tagged items context
    const taggedItems = getSubtaskTaggedItems(subtask.id);
    if (taggedItems.labor.length > 0) {
      context += `\nLabor Tagged: ${taggedItems.labor.map(l => l.fullName).join(', ')}\n`;
    }
    if (taggedItems.contacts.length > 0) {
      context += `Contacts Tagged: ${taggedItems.contacts.map(c => c.name).join(', ')}\n`;
    }
    if (taggedItems.materials.length > 0) {
      context += `Materials Tagged: ${taggedItems.materials.map(m => m.name).join(', ')}\n`;
    }

    return context;
  }, [project, task, getSubtaskTaggedItems]);

  // Track which mode was used for dragging
  const [currentDragContent, setCurrentDragContent] = useState<string>('');
  
  // Double-click handling for alternative copy method
  const [lastClickTime, setLastClickTime] = useState<Record<number, number>>({});

  const handleDragStart = useCallback((e: React.DragEvent, subtask: Subtask) => {
    console.log('Dragging subtask content to external application:', 'processed content only');
    
    // Always use left-click behavior for HTML5 drag
    const content = generateSubtaskPrompt(subtask);
    
    setDragMode('left');
    setDragData({ subtask, content });
    setIsDragging(true);
    setCurrentDragContent(content);

    console.log('Export content length:', content.length);

    // Set multiple data formats for maximum compatibility across applications
    try {
      e.dataTransfer.setData('text/plain', content);
      e.dataTransfer.setData('text/html', `<div style="font-family: monospace; white-space: pre-wrap; margin: 0; padding: 8px;">${content.replace(/\n/g, '<br>')}</div>`);
      e.dataTransfer.setData('text/rtf', `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${content.replace(/\n/g, '\\par ')}}}`);
      
      // Also set specific MIME types for better application recognition
      e.dataTransfer.setData('application/x-subtask-prompt', content);
      e.dataTransfer.setData('application/x-project-task', JSON.stringify({
        type: 'subtask',
        id: subtask.id,
        title: subtask.title,
        content: content,
        status: subtask.status
      }));
      
      console.log('Available data types:', e.dataTransfer.types);
    } catch (error) {
      console.warn('Error setting drag data:', error);
    }
    
    // Set drag effect to allow copying to external applications - this is crucial
    e.dataTransfer.effectAllowed = 'all';  // Allow all drop effects
    
    // Prevent default to ensure the drag doesn't get cancelled
    e.stopPropagation();
    
    // Create a more visible custom drag image
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.2);
        border: 2px solid #3b82f6;
        white-space: nowrap;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        min-width: 200px;
        text-align: center;
        position: relative;
      ">
        📋 ${subtask.title.length > 30 ? subtask.title.substring(0, 30) + '...' : subtask.title}
        <div style="
          font-size: 11px;
          opacity: 0.8;
          margin-top: 4px;
          font-weight: normal;
        ">Drop to transfer content</div>
      </div>
    `;
    dragImage.style.cssText = `position: absolute; top: -2000px; left: -2000px; z-index: 9999;`;
    document.body.appendChild(dragImage);
    
    try {
      // Set drag image with better positioning
      e.dataTransfer.setDragImage(dragImage.firstElementChild as HTMLElement, 100, 30);
    } catch (error) {
      console.warn('Could not set custom drag image:', error);
    }
    
    // Clean up drag image after longer delay to ensure it doesn't interfere
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 1000);

    toast({
      title: 'Dragging Subtask Content',
      description: 'Drop into any text field, editor, or external application to transfer the content',
    });
  }, [generateSubtaskPrompt, toast]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    console.log('Drag operation ended with effect:', e.dataTransfer.dropEffect);
    
    const effect = e.dataTransfer.dropEffect;
    const draggedContent = currentDragContent;
    
    // Clean up drag state immediately to prevent UI glitches
    setIsDragging(false);
    setDragMode(null);
    setDragData(null);
    setCurrentDragContent('');
    
    // Use a small delay to ensure the drop operation has completed
    setTimeout(() => {
      if (effect && effect !== 'none') {
        toast({
          title: 'Content Transferred Successfully',
          description: `Subtask content has been ${effect === 'copy' ? 'copied' : 'transferred'} to the target application`,
        });
      } else {
        // Fallback: automatically copy to clipboard when drag fails
        console.log('Drag operation completed - may have been transferred to external application');
        
        if (draggedContent) {
          navigator.clipboard.writeText(draggedContent).then(() => {
            toast({
              title: 'Content Copied to Clipboard',
              description: 'Drag transfer detected as incomplete - content has been automatically copied to clipboard for pasting',
            });
          }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = draggedContent;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
              document.execCommand('copy');
              toast({
                title: 'Content Copied to Clipboard',
                description: 'Drag transfer backup - content is now available for pasting',
              });
            } catch (err) {
              toast({
                title: 'Drag Complete',
                description: 'Content was prepared for transfer. If it didn\'t work, try right-clicking the subtask to copy to clipboard.',
                variant: 'destructive'
              });
            } finally {
              document.body.removeChild(textArea);
            }
          });
        } else {
          toast({
            title: 'Drag Complete',
            description: 'If you dropped in an external application, the content should now be available for pasting',
          });
        }
      }
    }, 100);
  }, [toast, currentDragContent]);

  const handleRightClickDrag = useCallback((e: React.MouseEvent, subtask: Subtask) => {
    e.preventDefault();
    const content = generateSubtaskContext(subtask);
    
    // Copy to clipboard for immediate use
    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: 'Full Context Copied',
        description: 'Complete context copied to clipboard. You can now paste it anywhere.',
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: 'Full Context Copied',
          description: 'Complete context copied to clipboard using fallback method',
        });
      } catch (err) {
        toast({
          title: 'Copy Failed',
          description: 'Unable to copy to clipboard. Please try selecting and copying manually.',
          variant: 'destructive'
        });
      } finally {
        document.body.removeChild(textArea);
      }
    });
  }, [generateSubtaskContext, toast]);

  // Handle double-click for alternative copy method
  const handleSubtaskClick = useCallback((e: React.MouseEvent, subtask: Subtask) => {
    const now = Date.now();
    const lastClick = lastClickTime[subtask.id] || 0;
    
    if (now - lastClick < 500) { // Double-click detected within 500ms
      e.preventDefault();
      e.stopPropagation();
      
      // Double-click action: copy content to clipboard
      const content = generateSubtaskPrompt(subtask);
      navigator.clipboard.writeText(content).then(() => {
        toast({
          title: 'Content Copied',
          description: 'Subtask content copied to clipboard via double-click',
        });
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: 'Content Copied',
            description: 'Subtask content copied to clipboard (fallback method)',
          });
        } catch (err) {
          toast({
            title: 'Copy Failed',
            description: 'Unable to copy content. Please try right-clicking for full context.',
            variant: 'destructive'
          });
        } finally {
          document.body.removeChild(textArea);
        }
      });
      
      // Clear the click time to prevent triple-click issues
      setLastClickTime(prev => ({ ...prev, [subtask.id]: 0 }));
      return;
    }
    
    // Single click - update click time and continue with normal behavior
    setLastClickTime(prev => ({ ...prev, [subtask.id]: now }));
    
    // Don't trigger if dragging or clicking on interactive elements
    if (isDragging) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || 
        target.closest('input') || 
        target.closest('[role="checkbox"]') ||
        target.closest('[data-radix-collection-item]') ||
        target.closest('[data-badge]') ||
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-dialog-overlay]') ||
        target.closest('[data-radix-dialog-trigger]')) {
      return;
    }
    
    // Check if the dialog is already open
    const existingDialog = document.querySelector('[data-radix-dialog-content]');
    if (existingDialog) {
      return; // Don't trigger if dialog is already open
    }
    
    // Toggle subtask expansion instead of opening comment dialog
    toggleSubtaskExpanded(subtask.id);
  }, [lastClickTime, generateSubtaskPrompt, toast, isDragging, toggleSubtaskExpanded]);

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
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-grab hover:shadow-lg hover:border-blue-400 hover:scale-[1.02] active:cursor-grabbing active:scale-[0.98] ${
                      subtask.completed ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'
                    } ${isDragging ? 'pointer-events-none opacity-50 scale-95' : ''}`}
                    title="🚀 MULTIPLE COPY OPTIONS: Drag to transfer content to other apps | Double-click to copy to clipboard | Right-click for full context"
                    data-subtask-title={subtask.title}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, subtask)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={(e) => {
                      // Prevent the drag from being cancelled when leaving the element
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragOver={(e) => {
                      // Allow the drag operation to continue
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onContextMenu={(e) => handleRightClickDrag(e, subtask)}
                    onClick={(e) => handleSubtaskClick(e, subtask)}
                  >
                    {/* Enhanced drag handle */}
                    <div className="flex items-center text-gray-400 hover:text-blue-600 cursor-grab hover:bg-blue-100 rounded p-1 transition-all duration-200 group" title="Drag to transfer content">
                      <GripVertical className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </div>
                    
                    <Checkbox 
                      checked={subtask.completed || false}
                      onCheckedChange={() => handleToggleComplete(subtask)}
                      className="mt-0.5"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSubtaskExpanded(subtask.id);
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            >
                              {expandedSubtasks[subtask.id] ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Trigger the overall comments dialog
                                const subtaskContainer = document.querySelector(`[data-subtask-title="${subtask.title}"]`);
                                const commentTrigger = subtaskContainer?.querySelector('[data-subtask-comment-trigger] button') as HTMLElement;
                                commentTrigger?.click();
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 relative"
                            >
                              <MessageCircle className="h-3 w-3" />
                              {commentCounts[subtask.id] > 0 && (
                                <Badge 
                                  variant="secondary" 
                                  className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs rounded-full flex items-center justify-center"
                                >
                                  {commentCounts[subtask.id]}
                                </Badge>
                              )}
                            </Button>
                          </div>
                          {expandedSubtasks[subtask.id] && subtask.description && (
                            <div className={`mt-2 ${subtask.completed ? 'opacity-60' : ''}`}>
                              <CommentableDescription
                                description={subtask.description}
                                title={`Subtask: ${subtask.title}`}
                                className="text-sm"
                                onDescriptionChange={async (newDescription) => {
                                  await handleSubtaskDescriptionChange(subtask, newDescription);
                                }}
                                entityType="subtask"
                                entityId={subtask.id}
                                fieldName="description"
                                readOnly={false}
                                showExportButton={true}
                                contextData={{
                                  project: project ? {
                                    id: project.id,
                                    name: project.name,
                                    description: project.description
                                  } : undefined,
                                  task: task ? {
                                    id: task.id,
                                    title: task.title,
                                    description: task.description,
                                    tier1Category: task.tier1Category,
                                    tier2Category: task.tier2Category,
                                    tier1CategoryDescription: getCategoryDescription(task.tier1Category, 'tier1'),
                                    tier2CategoryDescription: getCategoryDescription(task.tier2Category, 'tier2')
                                  } : undefined,
                                  subtask: {
                                    id: subtask.id,
                                    title: subtask.title,
                                    description: subtask.description
                                  }
                                }}
                                onCommentClick={(sectionIndex) => {
                                  // Set the section ID for this subtask
                                  setCommentSectionId(prev => ({ ...prev, [subtask.id]: sectionIndex }));
                                  
                                  // Find and click the SubtaskComments button for this specific subtask
                                  const parentElement = document.querySelector(`[data-subtask-title="${subtask.title}"]`);
                                  if (parentElement) {
                                    const commentButton = parentElement.querySelector(`[data-subtask-comment-trigger] button`) as HTMLElement;
                                    if (commentButton) {
                                      commentButton.click();
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* Subtask Tags Display */}
                          {expandedSubtasks[subtask.id] && hasAnyTags && (
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
                          {expandedSubtasks[subtask.id] && showSubtaskTagging[subtask.id] && (
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

                          {expandedSubtasks[subtask.id] && (
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
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {/* Unified dropdown menu for all screen sizes */}
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
                                onClick={() => {
                                  // Find the comment trigger for this specific subtask
                                  const subtaskContainer = document.querySelector(`[data-subtask-title="${subtask.title}"]`);
                                  const commentTrigger = subtaskContainer?.querySelector('[data-subtask-comment-trigger] button') as HTMLElement;
                                  commentTrigger?.click();
                                }}
                                className="flex items-center gap-2"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Overall Comments
                                {commentCounts[subtask.id] > 0 && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    {commentCounts[subtask.id]}
                                  </Badge>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => copySubtaskReference(subtask)}
                                className="flex items-center gap-2"
                              >
                                <Copy className="h-4 w-4" />
                                Copy Reference
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setEditingSubtask(subtask)}
                                className="flex items-center gap-2"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteSubtask(subtask)}
                                className="flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {/* Comments trigger hidden but accessible */}
                          <div className="hidden" data-subtask-comment-trigger>
                            <SubtaskComments
                              subtaskId={subtask.id}
                              subtaskTitle={subtask.title}
                              sectionId={commentSectionId[subtask.id]}
                              sectionContent={(() => {
                                const sectionId = commentSectionId[subtask.id];
                                if (sectionId !== undefined && subtask.description) {
                                  // Split description into sections using the same logic as CommentableDescription
                                  const sections = subtask.description.split(
                                    /\n{2,}|(?=^#{1,2}\s)|(?=^\s*[-*]\s)|(?=^\s*\d+\.\s)/gm
                                  ).filter(Boolean);
                                  return sections[sectionId] || '';
                                }
                                return '';
                              })()}
                              onDialogClose={() => {
                                // Clear the section ID when dialog closes
                                setCommentSectionId(prev => ({ ...prev, [subtask.id]: undefined }));
                              }}
                            />
                          </div>
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
      
      {/* Drag feedback element */}
      <div 
        id="drag-feedback" 
        className="fixed z-50 pointer-events-none bg-black text-white px-3 py-2 rounded-lg text-sm shadow-lg"
        style={{ display: 'none' }}
      >
        {dragMode === 'left' ? 'Copying subtask prompt...' : 'Copying full context...'}
      </div>
    </>
  );
}