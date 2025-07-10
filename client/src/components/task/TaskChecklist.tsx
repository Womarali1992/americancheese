import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Subtask } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TaskChecklistProps {
  taskId: number;
  description: string;
  onProgressUpdate?: (progress: number) => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  originalText?: string;
  completed: boolean;
  subtaskId?: number;
  isSubtaskReference: boolean;
}

export function TaskChecklist({ taskId, description, onProgressUpdate }: TaskChecklistProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Function to render text with strikethrough support
  const renderTextWithStrikethrough = (text: string) => {
    const parts = text.split(/~~(.+?)~~/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // Odd indices are the strikethrough text
        return (
          <span key={index} className="line-through text-muted-foreground">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Fetch subtasks for this task
  const { data: subtasks = [] } = useQuery<Subtask[]>({
    queryKey: [`/api/tasks/${taskId}/subtasks`],
    enabled: !!taskId
  });

  // Parse description and extract checklist items
  useEffect(() => {
    const items = parseDescriptionForChecklist(description, subtasks);
    setChecklistItems(items);
  }, [description, subtasks?.length]);

  // Calculate progress
  useEffect(() => {
    if (checklistItems.length > 0) {
      const completedCount = checklistItems.filter(item => item.completed).length;
      const progress = Math.round((completedCount / checklistItems.length) * 100);
      onProgressUpdate?.(progress);
    }
  }, [checklistItems, onProgressUpdate]);

  const parseDescriptionForChecklist = (desc: string, subtasksList: Subtask[]): ChecklistItem[] => {
    const lines = desc.split('\n');
    const items: ChecklistItem[] = [];
    
    lines.forEach((line, index) => {
      // Match checkbox patterns: - [ ] text, - [x] text, - [X] text
      const checkboxMatch = line.match(/^(\s*)-\s*\[([ xX]?)\]\s*(.+)$/);
      if (checkboxMatch) {
        const [, indent, checked, text] = checkboxMatch;
        const isCompleted = checked.toLowerCase() === 'x';
        
        // Check if this references a subtask using @subtask pattern
        const subtaskMatch = text.match(/@subtask:(.+?)$/);
        let subtaskId: number | undefined;
        let displayText = text;
        
        if (subtaskMatch) {
          const subtaskTitle = subtaskMatch[1].trim();
          console.log('Attempting to match subtask:', subtaskTitle);
          console.log('Available subtasks:', subtasksList.map(st => st.title));
          
          // Try exact match first
          let matchedSubtask = subtasksList.find(st => 
            st.title.toLowerCase() === subtaskTitle.toLowerCase()
          );
          
          // If no exact match, try partial matching
          if (!matchedSubtask) {
            matchedSubtask = subtasksList.find(st => 
              st.title.toLowerCase().includes(subtaskTitle.toLowerCase()) ||
              subtaskTitle.toLowerCase().includes(st.title.toLowerCase())
            );
          }
          
          if (matchedSubtask) {
            subtaskId = matchedSubtask.id;
            // Replace the entire @subtask: reference with the arrow notation
            displayText = `→ ${matchedSubtask.title}`;
            console.log('Matched subtask:', matchedSubtask.title, 'ID:', matchedSubtask.id);
          } else {
            console.log('No matching subtask found for:', subtaskTitle);
            // Keep the original text but mark it as a failed reference
            displayText = `@subtask:${subtaskTitle} (not found)`;
          }
        }
        
        items.push({
          id: `item-${index}`,
          text: displayText,
          originalText: subtaskMatch ? subtaskMatch[1].trim() : text,
          completed: subtaskId ? (subtasksList.find(st => st.id === subtaskId)?.completed || false) : isCompleted,
          subtaskId,
          isSubtaskReference: !!subtaskId
        });
      }
    });
    
    return items;
  };

  const handleItemToggle = async (itemId: string) => {
    const item = checklistItems.find(i => i.id === itemId);
    if (!item) return;

    // If this is a subtask reference, update the actual subtask
    if (item.subtaskId) {
      try {
        await fetch(`/api/subtasks/${item.subtaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            completed: !item.completed
          })
        });

        // Invalidate subtasks query to refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/subtasks`] });
        
        toast({
          title: "Subtask Updated",
          description: `"${item.text}" has been ${!item.completed ? 'completed' : 'reopened'}.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update subtask. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    // Update local state for immediate feedback
    setChecklistItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, completed: !i.completed } : i
    ));
  };

  const handleSaveDescription = async () => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: editedDescription
        })
      });

      // Invalidate task query to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      
      setIsEditing(false);
      toast({
        title: "Description Updated",
        description: "Task description has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update description. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderDescription = () => {
    if (checklistItems.length === 0) {
      // No checklist items, render as markdown-style text with strikethrough support
      return (
        <div className="prose prose-sm max-w-none">
          {description.split('\n').map((line, index) => (
            <p key={index} className="mb-2">
              {renderTextWithStrikethrough(line)}
            </p>
          ))}
        </div>
      );
    }

    // Render with interactive checklist
    const lines = description.split('\n');
    let itemIndex = 0;

    return (
      <div className="space-y-2">
        {lines.map((line, lineIndex) => {
          const checkboxMatch = line.match(/^(\s*)-\s*\[([ xX]?)\]\s*(.+)$/);
          
          if (checkboxMatch && itemIndex < checklistItems.length) {
            const item = checklistItems[itemIndex];
            itemIndex++;
            
            return (
              <div key={lineIndex} className="flex items-start gap-2 py-1">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleItemToggle(item.id)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <span className={`${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {item.text}
                  </span>
                </div>
                {item.isSubtaskReference && (
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      // Find the subtask element by its title and scroll to it
                      // Extract the original subtask title from the stored reference
                      let subtaskTitle = item.originalText || item.text;
                      
                      // Remove the @subtask: prefix if present
                      if (subtaskTitle.includes('@subtask:')) {
                        subtaskTitle = subtaskTitle.replace('@subtask:', '');
                      }
                      
                      // Clean up the title
                      subtaskTitle = subtaskTitle.trim();
                      console.log('Looking for subtask:', subtaskTitle);
                      console.log('Original item text:', item.text);
                      console.log('Original item originalText:', item.originalText);
                      
                      // First ensure the subtasks accordion is expanded
                      const subtasksAccordion = document.querySelector('[data-state="closed"][data-accordion-value="subtasks"]');
                      if (subtasksAccordion) {
                        const trigger = subtasksAccordion.querySelector('[data-accordion-trigger]');
                        if (trigger) {
                          (trigger as HTMLElement).click();
                        }
                      }
                      
                      // Wait a moment for the accordion to expand, then scroll
                      setTimeout(() => {
                        const subtaskElements = document.querySelectorAll('[data-subtask-title]');
                        console.log('Found subtask elements:', subtaskElements.length);
                        
                        let found = false;
                        Array.from(subtaskElements).forEach(element => {
                          const elementTitle = element.getAttribute('data-subtask-title');
                          console.log('Checking element title:', elementTitle);
                          
                          if (elementTitle === subtaskTitle) {
                            console.log('Match found! Scrolling to:', elementTitle);
                            element.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'center' 
                            });
                            // Add a brief highlight effect
                            element.classList.add('ring-2', 'ring-blue-300', 'ring-opacity-50');
                            setTimeout(() => {
                              element.classList.remove('ring-2', 'ring-blue-300', 'ring-opacity-50');
                            }, 2000);
                            found = true;
                          }
                        });
                        
                        if (!found) {
                          console.log('No matching subtask found for:', subtaskTitle);
                        }
                      }, 300);
                    }}
                  >
                    Subtask
                  </Badge>
                )}
              </div>
            );
          }
          
          // Regular text line with strikethrough support
          if (line.trim()) {
            return (
              <p key={lineIndex} className="text-sm text-gray-700 leading-relaxed">
                {renderTextWithStrikethrough(line)}
              </p>
            );
          }
          
          return <div key={lineIndex} className="h-2" />;
        })}
      </div>
    );
  };

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Task Description</CardTitle>
            {totalCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {completedCount}/{totalCount} completed
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (isEditing) {
                setEditedDescription(description);
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </>
            )}
          </Button>
        </div>
        {totalCount > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Enter task description...

Use checklist format:
- [ ] Regular checklist item
- [x] Completed checklist item
- [ ] @subtask:Title Reference a subtask by title

Text formatting:
~~strikethrough text~~ for crossed out text"
              rows={10}
              className="min-h-[200px]"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveDescription} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditedDescription(description);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          renderDescription()
        )}
      </CardContent>
    </Card>
  );
}