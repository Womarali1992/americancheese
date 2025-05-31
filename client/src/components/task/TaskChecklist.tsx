import React, { useState, useEffect } from 'react';
import { Check, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface TaskChecklistProps {
  taskId: number;
  description: string;
  onProgressUpdate?: (progress: number) => void;
}

export function TaskChecklist({ taskId, description, onProgressUpdate }: TaskChecklistProps) {
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [checklistData, setChecklistData] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Parse the description into checklist sections
  useEffect(() => {
    if (!description) return;
    
    const parsedSections = parseDescriptionToChecklist(description);
    setSections(parsedSections);
    
    // Load saved checklist state
    loadChecklistState();
  }, [description, taskId]);

  // Parse description text into structured checklist
  const parseDescriptionToChecklist = (desc: string): ChecklistSection[] => {
    const lines = desc.split('\n').filter(line => line.trim());
    const sections: ChecklistSection[] = [];
    let currentSection: ChecklistSection | null = null;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if it's a section header (starts with number followed by period)
      const sectionMatch = trimmedLine.match(/^(\d+)\.\s*(.+):?\s*$/);
      if (sectionMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: `section-${sectionMatch[1]}`,
          title: sectionMatch[2],
          items: []
        };
      }
      // Check if it's a checklist item (starts with bullet point)
      else if (trimmedLine.startsWith('•') && currentSection) {
        const itemText = trimmedLine.substring(1).trim();
        if (itemText) {
          currentSection.items.push({
            id: `${currentSection.id}-item-${currentSection.items.length}`,
            text: itemText,
            completed: false
          });
        }
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  // Load checklist state from localStorage
  const loadChecklistState = () => {
    try {
      const saved = localStorage.getItem(`task-checklist-${taskId}`);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setChecklistData(parsedData);
      }
    } catch (error) {
      console.error('Error loading checklist state:', error);
    }
  };

  // Save checklist state to localStorage
  const saveChecklistState = (newData: Record<string, boolean>) => {
    try {
      localStorage.setItem(`task-checklist-${taskId}`, JSON.stringify(newData));
      setChecklistData(newData);
    } catch (error) {
      console.error('Error saving checklist state:', error);
    }
  };

  // Toggle item completion
  const toggleItem = async (itemId: string) => {
    const newData = { ...checklistData, [itemId]: !checklistData[itemId] };
    saveChecklistState(newData);
    
    // Calculate and update progress
    const totalItems = sections.reduce((total, section) => total + section.items.length, 0);
    const completedItems = Object.values(newData).filter(Boolean).length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    if (onProgressUpdate) {
      onProgressUpdate(progress);
    }

    toast({
      title: newData[itemId] ? "Item completed" : "Item unchecked",
      description: `Progress: ${completedItems}/${totalItems} items completed`,
    });
  };

  // Calculate overall progress
  const calculateProgress = () => {
    const totalItems = sections.reduce((total, section) => total + section.items.length, 0);
    const completedItems = Object.values(checklistData).filter(Boolean).length;
    return { completed: completedItems, total: totalItems };
  };

  // Clear all items
  const clearAll = () => {
    const newData: Record<string, boolean> = {};
    sections.forEach(section => {
      section.items.forEach(item => {
        newData[item.id] = false;
      });
    });
    saveChecklistState(newData);
    if (onProgressUpdate) onProgressUpdate(0);
  };

  // Mark all items as complete
  const completeAll = () => {
    const newData: Record<string, boolean> = {};
    sections.forEach(section => {
      section.items.forEach(item => {
        newData[item.id] = true;
      });
    });
    saveChecklistState(newData);
    if (onProgressUpdate) onProgressUpdate(100);
  };

  const { completed, total } = calculateProgress();
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 text-center">No checklist items found in task description</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Task Checklist</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={completeAll}>
              Complete All
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{completed} of {total} items completed</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h4 className="font-medium text-gray-900 border-b pb-1">
              {section.title}
            </h4>
            <div className="space-y-2 ml-2">
              {section.items.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleItem(item.id)}
                >
                  <button className="mt-0.5 flex-shrink-0">
                    {checklistData[item.id] ? (
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <span 
                    className={`text-sm leading-relaxed ${
                      checklistData[item.id] 
                        ? 'line-through text-gray-500' 
                        : 'text-gray-700'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}