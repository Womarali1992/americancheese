import React, { useState, useEffect, useMemo } from 'react';
import { Check, CheckSquare, Square, Users, Plus, AtSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Labor, Contact, Material } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

interface SectionWithAssignments {
  id: string;
  title: string;
  items: ChecklistItem[];
  laborAssignments: Labor[];
  contactAssignments: Contact[];
  materialAssignments: Material[];
}

export function TaskChecklist({ taskId, description, onProgressUpdate }: TaskChecklistProps) {
  const [sections, setSections] = useState<SectionWithAssignments[]>([]);
  const [checklistData, setChecklistData] = useState<Record<string, boolean>>({});
  const [quickAddText, setQuickAddText] = useState<Record<string, string>>({});
  const [showQuickAdd, setShowQuickAdd] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<Record<string, Array<{type: 'labor' | 'contact' | 'material', item: any}>>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch labor data for this task
  const { data: taskLabor = [] } = useQuery<Labor[]>({
    queryKey: [`/api/tasks/${taskId}/labor`],
    enabled: taskId > 0,
  });

  // Fetch all labor as backup
  const { data: allLabor = [] } = useQuery<Labor[]>({
    queryKey: ['/api/labor'],
    enabled: taskId > 0,
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Fetch materials
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
  });

  // Combined labor data
  const combinedLabor = useMemo(() => {
    const directLabor = taskLabor || [];
    const filteredAllLabor = allLabor.filter(labor => labor.taskId === taskId);
    
    // Combine and deduplicate
    const laborMap = new Map();
    [...directLabor, ...filteredAllLabor].forEach(labor => {
      laborMap.set(labor.id, labor);
    });
    
    return Array.from(laborMap.values());
  }, [taskLabor, allLabor, taskId]);

  // Assign labor to sections based on tier categories and content matching
  const assignLaborToSection = (section: SectionWithAssignments, laborList: Labor[]): Labor[] => {
    return laborList.filter(labor => {
      // Match by tier2Category or content keywords
      const sectionTitle = section.title.toLowerCase();
      const laborTier2 = labor.tier2Category?.toLowerCase() || '';
      
      // Direct tier2 category match
      if (laborTier2 && sectionTitle.includes(laborTier2)) {
        return true;
      }
      
      // Keyword matching
      const keywords = {
        foundation: ['foundation', 'concrete', 'footings'],
        framing: ['framing', 'frame', 'lumber', 'structural'],
        roofing: ['roof', 'roofing', 'shingles', 'gutters'],
        electrical: ['electrical', 'electric', 'wiring', 'outlets'],
        plumbing: ['plumbing', 'pipes', 'water', 'drain'],
        hvac: ['hvac', 'heating', 'cooling', 'ventilation'],
        drywall: ['drywall', 'sheetrock', 'walls'],
        exteriors: ['siding', 'exterior', 'trim', 'windows', 'doors']
      };
      
      for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => sectionTitle.includes(word)) && 
            words.some(word => laborTier2.includes(word))) {
          return true;
        }
      }
      
      return false;
    });
  };

  // Assign contacts to sections based on type and category
  const assignContactsToSection = (section: SectionWithAssignments, contactList: Contact[]): Contact[] => {
    return contactList.filter(contact => {
      const sectionTitle = section.title.toLowerCase();
      const contactCategory = contact.category?.toLowerCase() || '';
      const contactType = contact.type?.toLowerCase() || '';
      
      // Match by category
      if (contactCategory && sectionTitle.includes(contactCategory)) {
        return true;
      }
      
      // Match by type
      if (contactType === 'contractor' && sectionTitle.includes('install')) {
        return true;
      }
      
      return false;
    });
  };

  // Assign materials to sections based on tier and content matching
  const assignMaterialsToSection = (section: SectionWithAssignments, materialList: Material[]): Material[] => {
    return materialList.filter(material => {
      const sectionTitle = section.title.toLowerCase();
      const materialTier = material.tier?.toLowerCase() || '';
      const materialTier2 = material.tier2Category?.toLowerCase() || '';
      const materialSection = material.section?.toLowerCase() || '';
      
      // Match by tier2 category
      if (materialTier2 && sectionTitle.includes(materialTier2)) {
        return true;
      }
      
      // Match by section
      if (materialSection && sectionTitle.includes(materialSection)) {
        return true;
      }
      
      // Match material to task if taskIds include current task
      if (material.taskIds && Array.isArray(material.taskIds)) {
        const taskIdNumbers = material.taskIds.map(id => typeof id === 'string' ? parseInt(id) : id);
        if (taskIdNumbers.includes(taskId)) {
          return true;
        }
      }
      
      return false;
    });
  };

  // Parse description text into structured checklist with assignments
  const parseDescriptionToChecklist = (desc: string): SectionWithAssignments[] => {
    const lines = desc.split('\n').filter(line => line.trim());
    const sections: SectionWithAssignments[] = [];
    let currentSection: SectionWithAssignments | null = null;
    
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
          items: [],
          laborAssignments: [],
          contactAssignments: [],
          materialAssignments: []
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
    
    // Assign labor, contacts, and materials to sections based on categories and content
    sections.forEach(section => {
      section.laborAssignments = assignLaborToSection(section, combinedLabor);
      section.contactAssignments = assignContactsToSection(section, contacts);
      section.materialAssignments = assignMaterialsToSection(section, materials);
    });
    
    return sections;
  };

  // Parse the description into checklist sections
  useEffect(() => {
    if (!description) return;
    
    const parsedSections = parseDescriptionToChecklist(description);
    setSections(parsedSections);
    
    // Load saved checklist state
    loadChecklistState();
  }, [description, taskId, combinedLabor, contacts, materials]);

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

  // Handle quick add functionality
  const handleQuickAdd = async (sectionId: string, text: string) => {
    if (!text.trim()) return;
    
    if (text.startsWith('@')) {
      // Handle contact/labor/material assignment
      const searchTerm = text.substring(1).toLowerCase();
      
      // Find matching contacts
      const matchingContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm)
      );
      
      // Find matching labor
      const matchingLabor = combinedLabor.filter(labor => 
        labor.fullName.toLowerCase().includes(searchTerm)
      );
      
      // Find matching materials
      const matchingMaterials = materials.filter(material => 
        material.name.toLowerCase().includes(searchTerm)
      );
      
      const totalMatches = matchingContacts.length + matchingLabor.length + matchingMaterials.length;
      
      if (totalMatches > 0) {
        // Update section assignments
        const updatedSections = sections.map(section => {
          if (section.id === sectionId) {
            return {
              ...section,
              contactAssignments: [...section.contactAssignments, ...matchingContacts.filter(c => 
                !section.contactAssignments.some(existing => existing.id === c.id)
              )],
              laborAssignments: [...section.laborAssignments, ...matchingLabor.filter(l => 
                !section.laborAssignments.some(existing => existing.id === l.id)
              )],
              materialAssignments: [...section.materialAssignments, ...matchingMaterials.filter(m => 
                !section.materialAssignments.some(existing => existing.id === m.id)
              )]
            };
          }
          return section;
        });
        setSections(updatedSections);
        
        toast({
          title: "Assignment added",
          description: `Added ${totalMatches} assignments to section`,
        });
      } else {
        toast({
          title: "No matches found",
          description: `No contacts, labor, or materials found matching "${searchTerm}"`,
          variant: "destructive"
        });
      }
    } else {
      // Add as regular checklist item
      const section = sections.find(s => s.id === sectionId);
      if (section) {
        const newItem: ChecklistItem = {
          id: `${sectionId}-item-${section.items.length}`,
          text: text.trim(),
          completed: false
        };
        
        const updatedSections = sections.map(s => {
          if (s.id === sectionId) {
            return {
              ...s,
              items: [...s.items, newItem]
            };
          }
          return s;
        });
        setSections(updatedSections);
        
        toast({
          title: "Item added",
          description: "New checklist item added to section",
        });
      }
    }
    
    // Clear the input
    setQuickAddText(prev => ({ ...prev, [sectionId]: '' }));
    setShowQuickAdd(prev => ({ ...prev, [sectionId]: false }));
  };

  const toggleQuickAdd = (sectionId: string) => {
    setShowQuickAdd(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Update suggestions based on input text
  const updateSuggestions = (sectionId: string, text: string) => {
    if (text.startsWith('@') && text.length > 1) {
      const searchTerm = text.substring(1).toLowerCase();
      
      const laborSuggestions = combinedLabor
        .filter(labor => labor.fullName.toLowerCase().includes(searchTerm))
        .map(labor => ({ type: 'labor' as const, item: labor }));
      
      const contactSuggestions = contacts
        .filter(contact => contact.name.toLowerCase().includes(searchTerm))
        .map(contact => ({ type: 'contact' as const, item: contact }));
      
      const materialSuggestions = materials
        .filter(material => material.name.toLowerCase().includes(searchTerm))
        .slice(0, 5) // Limit materials to 5 for performance
        .map(material => ({ type: 'material' as const, item: material }));
      
      setSuggestions(prev => ({
        ...prev,
        [sectionId]: [...laborSuggestions, ...contactSuggestions, ...materialSuggestions]
      }));
    } else {
      setSuggestions(prev => ({ ...prev, [sectionId]: [] }));
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (sectionId: string, suggestion: {type: 'labor' | 'contact' | 'material', item: any}) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedSections = sections.map(s => {
      if (s.id === sectionId) {
        const updated = { ...s };
        
        if (suggestion.type === 'labor') {
          if (!updated.laborAssignments.some(existing => existing.id === suggestion.item.id)) {
            updated.laborAssignments = [...updated.laborAssignments, suggestion.item];
          }
        } else if (suggestion.type === 'contact') {
          if (!updated.contactAssignments.some(existing => existing.id === suggestion.item.id)) {
            updated.contactAssignments = [...updated.contactAssignments, suggestion.item];
          }
        } else if (suggestion.type === 'material') {
          if (!updated.materialAssignments.some(existing => existing.id === suggestion.item.id)) {
            updated.materialAssignments = [...updated.materialAssignments, suggestion.item];
          }
        }
        
        return updated;
      }
      return s;
    });
    
    setSections(updatedSections);
    setQuickAddText(prev => ({ ...prev, [sectionId]: '' }));
    setSuggestions(prev => ({ ...prev, [sectionId]: [] }));
    
    toast({
      title: "Assignment added",
      description: `Added ${suggestion.item.name || suggestion.item.fullName} to section`,
    });
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <h4 className="font-medium text-gray-900 border-b pb-1 flex-1">
                  {section.title}
                </h4>
                
                {/* Individual Labor, Contact, and Material Badges */}
                <div className="flex items-center gap-1 flex-wrap">
                  {/* Individual Labor Badges (Blue) */}
                  {section.laborAssignments.map((labor) => (
                    <Badge key={`labor-badge-${labor.id}`} variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                      {labor.fullName}
                    </Badge>
                  ))}
                  
                  {/* Individual Contact Badges - Suppliers in Orange, Others in Green */}
                  {section.contactAssignments.map((contact) => {
                    const isSupplier = contact.category?.toLowerCase().includes('supplier') || 
                                     contact.type?.toLowerCase().includes('supplier');
                    return (
                      <Badge 
                        key={`contact-badge-${contact.id}`} 
                        variant="outline" 
                        className={isSupplier ? "bg-orange-100 text-orange-800 text-xs" : "bg-green-100 text-green-800 text-xs"}
                      >
                        {contact.name}
                      </Badge>
                    );
                  })}
                  
                  {/* Individual Material Badges (Purple) */}
                  {section.materialAssignments.map((material) => (
                    <Badge key={`material-badge-${material.id}`} variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                      {material.name.length > 20 ? `${material.name.substring(0, 20)}...` : material.name}
                    </Badge>
                  ))}
                  
                  {/* Quick Add Button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => toggleQuickAdd(section.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Quick Add</h4>
                        <p className="text-sm text-gray-600">
                          Add item or use @ to assign people/materials (e.g., @david, @lumber)
                        </p>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add item or @name/material"
                              value={quickAddText[section.id] || ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setQuickAddText(prev => ({ 
                                  ...prev, 
                                  [section.id]: newValue 
                                }));
                                updateSuggestions(section.id, newValue);
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleQuickAdd(section.id, quickAddText[section.id] || '');
                                }
                              }}
                              className="flex-1"
                            />
                            <Button 
                              size="sm"
                              onClick={() => handleQuickAdd(section.id, quickAddText[section.id] || '')}
                            >
                              Add
                            </Button>
                          </div>
                          
                          {/* Auto-suggestions dropdown */}
                          {suggestions[section.id] && suggestions[section.id].length > 0 && (
                            <div className="border rounded-md max-h-32 overflow-y-auto bg-white">
                              {suggestions[section.id].map((suggestion, index) => {
                                const name = suggestion.item.name || suggestion.item.fullName;
                                const isSupplier = suggestion.type === 'contact' && 
                                  (suggestion.item.category?.toLowerCase().includes('supplier') || 
                                   suggestion.item.type?.toLowerCase().includes('supplier'));
                                
                                let badgeClass = '';
                                if (suggestion.type === 'labor') {
                                  badgeClass = 'bg-blue-100 text-blue-800';
                                } else if (suggestion.type === 'contact') {
                                  badgeClass = isSupplier ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';
                                } else {
                                  badgeClass = 'bg-purple-100 text-purple-800';
                                }
                                
                                return (
                                  <div
                                    key={`${suggestion.type}-${suggestion.item.id}`}
                                    className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                                    onClick={() => selectSuggestion(section.id, suggestion)}
                                  >
                                    <Badge variant="outline" className={`text-xs ${badgeClass}`}>
                                      {suggestion.type === 'labor' ? 'Labor' : 
                                       suggestion.type === 'contact' ? (isSupplier ? 'Supplier' : 'Contact') : 
                                       'Material'}
                                    </Badge>
                                    <span className="text-sm">
                                      {name.length > 30 ? `${name.substring(0, 30)}...` : name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            {(section.laborAssignments.length > 0 || section.contactAssignments.length > 0 || section.materialAssignments.length > 0) && (
              <div className="ml-2 mb-2">
                <div className="flex flex-wrap gap-1">
                  {section.laborAssignments.map((labor) => (
                    <Badge key={`labor-${labor.id}`} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      {labor.fullName} ({labor.tier2Category})
                    </Badge>
                  ))}
                  {section.contactAssignments.map((contact) => (
                    <Badge key={`contact-${contact.id}`} variant="outline" className="text-xs bg-green-50 text-green-700">
                      {contact.name} ({contact.role})
                    </Badge>
                  ))}
                  {section.materialAssignments.map((material) => (
                    <Badge key={`material-${material.id}`} variant="outline" className="text-xs bg-purple-50 text-purple-700">
                      {material.name.substring(0, 30)}{material.name.length > 30 ? '...' : ''} ({material.tier2Category})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 ml-2">
              {section.items.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {checklistData[item.id] ? (
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
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