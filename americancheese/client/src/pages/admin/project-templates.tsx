import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import PageTitle from '@/components/layout/page-title';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search, CheckSquare, Square, ChevronLeft, Save, FileText, Settings, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getPresetById, getPresetOptions } from '@shared/presets.ts';

// Types
interface Project {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: string;
  progress: number;
  hiddenCategories?: string[];
  selectedTemplates?: string[];
}

interface CategoryPreset {
  id: string;
  name: string;
  description: string;
  categories: {
    tier1: Array<{
      name: string;
      description: string;
      sortOrder: number;
    }>;
    tier2: Record<string, Array<{
      name: string;
      description: string;
    }>>;
  };
}

interface TemplateCategory {
  id: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
}

interface TaskTemplate {
  id: number;
  templateId: string;
  title: string;
  description: string;
  tier1CategoryId: number;
  tier2CategoryId: number;
  estimatedDuration: number;
}

// Component
export default function ProjectTemplatesPage() {
  const [location, setLocation] = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier1, setSelectedTier1] = useState<number | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<TaskTemplate | null>(null);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CategoryPreset | null>(null);
  
  // Fetch data
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      return response.json();
    },
    enabled: !!projectId,
  });
  
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/admin/template-categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/template-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    }
  });
  
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/admin/task-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/task-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    }
  });
  
  const { data: projectTemplates = [], isLoading: isLoadingProjectTemplates } = useQuery({
    queryKey: [`/api/projects/${projectId}/templates`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/templates`);
      if (!response.ok) {
        throw new Error('Failed to fetch project templates');
      }
      return response.json();
    },
    enabled: !!projectId,
  });
  
  // Set initial selected templates when data is loaded
  useEffect(() => {
    if (projectTemplates && projectTemplates.length > 0) {
      setSelectedTemplates(projectTemplates.map((template: any) => template.templateId));
    } else if (project && project.selectedTemplates) {
      setSelectedTemplates(project.selectedTemplates);
    }
  }, [project, projectTemplates]);
  
  // Filter categories and templates
  const tier1Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier1');
  const tier2Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier2');
  
  // Filter templates by search and selected category
  const filteredTemplates = templates.filter((template: TaskTemplate) => {
    const matchesSearch = searchQuery === '' || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.templateId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedTier1 === null || template.tier1CategoryId === selectedTier1;
    
    return matchesSearch && matchesCategory;
  });
  
  // Save mutations
  const updateProjectTemplatesMutation = useMutation({
    mutationFn: async (templateIds: string[]) => {
      const response = await apiRequest(
        `/api/projects/${projectId}/templates`,
        'PUT',
        { templateIds }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/templates`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({ title: "Templates updated successfully", variant: "default" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update templates", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  // Create tasks from templates mutation
  const createTasksFromTemplatesMutation = useMutation({
    mutationFn: async (templateIds: string[]) => {
      const response = await apiRequest(
        `/api/projects/${projectId}/create-tasks-from-templates`,
        'POST',
        { templateIds }
      );
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks`] });
      toast({
        title: "Tasks created successfully",
        description: `Created ${data.createdTasks.length} tasks for this project`,
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create tasks",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Load preset categories mutation
  const loadPresetCategoriesMutation = useMutation({
    mutationFn: async (presetId: string) => {
      const response = await apiRequest(
        `/api/projects/${projectId}/load-preset-categories`,
        'POST',
        { presetId, replaceExisting: true }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Preset categories loaded",
        description: `Successfully loaded categories for the ${selectedPreset?.name} preset`,
        variant: "default"
      });
      setShowPresetDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to load preset categories",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handlers
  const handleSaveTemplates = () => {
    updateProjectTemplatesMutation.mutate(selectedTemplates);
  };
  
  const handleCreateTasks = () => {
    if (selectedTemplates.length === 0) {
      toast({
        title: "No templates selected",
        description: "Please select at least one template to create tasks",
        variant: "destructive"
      });
      return;
    }

    createTasksFromTemplatesMutation.mutate(selectedTemplates);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (preset) {
      setSelectedPreset(preset);
      setShowPresetDialog(true);
    }
  };

  const handleLoadPresetCategories = () => {
    if (selectedPreset) {
      loadPresetCategoriesMutation.mutate(selectedPreset.id);
    }
  };

  const handleSelectTemplatesByPreset = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    // Get templates that match the preset's categories
    const presetTemplates = templates.filter((template: TaskTemplate) => {
      const tier1CategoryName = getCategoryName(template.tier1CategoryId);
      const tier2CategoryName = getCategoryName(template.tier2CategoryId);
      
      // Check if this template's categories exist in the selected preset (case-insensitive)
      const tier1Exists = preset.categories.tier1.some(cat => 
        cat.name.toLowerCase() === tier1CategoryName.toLowerCase()
      );
      
      // Find the matching tier1 category name for tier2 lookup
      const matchingTier1 = preset.categories.tier1.find(cat => 
        cat.name.toLowerCase() === tier1CategoryName.toLowerCase()
      );
      
      const tier2Exists = matchingTier1 && preset.categories.tier2[matchingTier1.name]?.some(cat => 
        cat.name.toLowerCase() === tier2CategoryName.toLowerCase()
      );
      
      return tier1Exists && tier2Exists;
    });

    // Select all templates that match the preset
    const templateIds = presetTemplates.map((template: TaskTemplate) => template.templateId);
    setSelectedTemplates(templateIds);

    toast({
      title: "Templates selected by preset",
      description: `Selected ${templateIds.length} templates matching the ${preset.name} preset`,
      variant: "default"
    });
  };
  
  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };
  
  const handleSelectAllInCategory = (tier1Id: number, tier2Id: number, select: boolean) => {
    const templatesInCategory = templates.filter(
      (t: TaskTemplate) => t.tier1CategoryId === tier1Id && t.tier2CategoryId === tier2Id
    );
    
    const templateIds = templatesInCategory.map((t: TaskTemplate) => t.templateId);
    
    if (select) {
      // Add templates that aren't already selected
      setSelectedTemplates(prev => {
        const newSelection = [...prev];
        templateIds.forEach((id: string) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } else {
      // Remove these templates from selection
      setSelectedTemplates(prev => prev.filter(id => !templateIds.includes(id)));
    }
  };
  
  const isLoading = isLoadingProject || isLoadingCategories || isLoadingTemplates || isLoadingProjectTemplates;
  const getCategoryName = (id: number) => {
    const category = categories.find((c: TemplateCategory) => c.id === id);
    return category ? category.name : 'Unknown';
  };
  
  if (isLoading) {
    return <div className="container mx-auto p-6 max-w-7xl">Loading...</div>;
  }
  
  if (!project) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <h2 className="text-2xl font-bold mb-4">Project not found</h2>
        <Button onClick={() => setLocation('/admin')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageTitle 
        title={`Templates for ${project.name}`}
        subtitle="Select templates to use for this project"
        icon="layers-line"
      />
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start">
        <Button variant="outline" onClick={() => setLocation('/admin')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleSaveTemplates}
            disabled={updateProjectTemplatesMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Selection
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowPresetDialog(true)}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Load Preset Categories
          </Button>

          <Select onValueChange={handleSelectTemplatesByPreset}>
            <SelectTrigger className="w-auto min-w-[200px]">
              <SelectValue placeholder="Select templates by preset" />
            </SelectTrigger>
            <SelectContent>
              {getPresetOptions().map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="default"
            onClick={handleCreateTasks}
            disabled={createTasksFromTemplatesMutation.isPending || selectedTemplates.length === 0}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Create Tasks
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="flex items-center bg-background rounded-md border">
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    id="search"
                    placeholder="Search templates..."
                    className="border-0 focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category Filter</Label>
                <Select
                  value={selectedTier1?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedTier1(value ? parseInt(value) : null);
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {tier1Categories.map((cat: TemplateCategory) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 pt-4">
                <div className="font-medium">Selected Templates</div>
                <div className="text-sm text-muted-foreground">
                  {selectedTemplates.length} templates selected
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setSelectedTemplates([])}
                  disabled={selectedTemplates.length === 0}
                >
                  Clear All Selections
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Template Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center p-4 border rounded-md bg-muted/50">
                    {searchQuery 
                      ? "No templates found matching your search" 
                      : "No templates found. Create templates in the admin panel first."}
                  </div>
                ) : (
                  <Accordion type="multiple" className="space-y-4">
                    {tier1Categories
                      .filter((tier1: TemplateCategory) => {
                        if (selectedTier1 !== null) {
                          return tier1.id === selectedTier1;
                        }
                        return true;
                      })
                      .map((tier1Category: TemplateCategory) => {
                        // Get templates for this tier1 category
                        const categoryTemplates = filteredTemplates.filter(
                          (t: TaskTemplate) => t.tier1CategoryId === tier1Category.id
                        );
                        
                        if (categoryTemplates.length === 0) {
                          return null; // Skip categories with no templates
                        }
                        
                        // Get all tier2 categories under this tier1
                        const relatedTier2Categories = tier2Categories.filter(
                          (c: TemplateCategory) => c.parentId === tier1Category.id
                        );
                        
                        return (
                          <AccordionItem 
                            key={tier1Category.id} 
                            value={`tier1-${tier1Category.id}`}
                            className="border rounded-md overflow-hidden"
                          >
                            <AccordionTrigger className="px-4 py-2 hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4">
                                <span>{tier1Category.name}</span>
                                <Badge variant="outline" className="ml-2">
                                  {categoryTemplates.length} templates
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-0">
                              <div className="space-y-2">
                                {relatedTier2Categories.map((tier2Category: TemplateCategory) => {
                                  // Get templates for this tier2 category
                                  const tier2Templates = categoryTemplates.filter(
                                    (t: TaskTemplate) => t.tier2CategoryId === tier2Category.id
                                  );
                                  
                                  if (tier2Templates.length === 0) {
                                    return null; // Skip subcategories with no templates
                                  }
                                  
                                  // Check if all templates in this tier2 are selected
                                  const allTier2TemplateIds = tier2Templates.map((t: TaskTemplate) => t.templateId);
                                  const allSelected = allTier2TemplateIds.every((id: string) => 
                                    selectedTemplates.includes(id)
                                  );
                                  
                                  return (
                                    <div key={tier2Category.id} className="border rounded-md overflow-hidden">
                                      <div className="bg-muted/50 p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Checkbox 
                                            checked={allSelected}
                                            id={`select-all-${tier2Category.id}`}
                                            onCheckedChange={(checked) => {
                                              handleSelectAllInCategory(
                                                tier1Category.id, 
                                                tier2Category.id, 
                                                checked === true
                                              );
                                            }}
                                          />
                                          <Label 
                                            htmlFor={`select-all-${tier2Category.id}`}
                                            className="font-medium cursor-pointer"
                                          >
                                            {tier2Category.name}
                                          </Label>
                                        </div>
                                        <Badge variant="secondary">
                                          {tier2Templates.length} templates
                                        </Badge>
                                      </div>
                                      
                                      <div className="divide-y">
                                        {tier2Templates.map((template: TaskTemplate) => {
                                          const isSelected = selectedTemplates.includes(template.templateId);
                                          
                                          return (
                                            <div 
                                              key={template.id} 
                                              className="p-3 flex items-center justify-between hover:bg-accent/50"
                                            >
                                              <div className="flex items-center gap-3">
                                                <Checkbox 
                                                  checked={isSelected}
                                                  id={`template-${template.id}`}
                                                  onCheckedChange={() => {
                                                    handleTemplateToggle(template.templateId);
                                                  }}
                                                />
                                                <div className="flex flex-col max-w-md">
                                                  <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono">
                                                      {template.templateId}
                                                    </Badge>
                                                    <span className="font-medium">{template.title}</span>
                                                  </div>
                                                  {template.description ? (
                                                    <div className="mt-1">
                                                      <span className="text-sm text-muted-foreground line-clamp-2">
                                                        {template.description}
                                                      </span>
                                                      {template.description.length > 100 && (
                                                        <span 
                                                          className="text-xs text-primary cursor-pointer hover:underline mt-1"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCurrentTemplate(template);
                                                            setDescriptionDialogOpen(true);
                                                          }}
                                                        >
                                                          Read more
                                                        </span>
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground italic mt-1">
                                                      No description provided
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                  </Accordion>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Template Description Dialog */}
      <Dialog open={descriptionDialogOpen} onOpenChange={setDescriptionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {currentTemplate?.title}
            </DialogTitle>
            <DialogDescription>
              <Badge variant="outline" className="font-mono mt-1">
                {currentTemplate?.templateId}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Category</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentTemplate && getCategoryName(currentTemplate.tier1CategoryId)}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="secondary">
                  {currentTemplate && getCategoryName(currentTemplate.tier2CategoryId)}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <div className="border rounded-md p-3 bg-muted/20 whitespace-pre-wrap">
                {currentTemplate?.description || <em className="text-muted-foreground">No description provided</em>}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Estimated Duration</h4>
              <div className="flex items-center gap-2">
                <Badge>
                  {currentTemplate?.estimatedDuration} {currentTemplate?.estimatedDuration === 1 ? 'day' : 'days'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preset Selection Dialog */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Load Category Preset
            </DialogTitle>
            <DialogDescription>
              Choose a preset to automatically load category templates for this project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedPreset ? (
              <div className="grid grid-cols-1 gap-3">
                {getPresetOptions().map((preset) => (
                  <Card
                    key={preset.value}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handlePresetSelect(preset.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{preset.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {preset.description}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPreset.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPreset.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPreset(null)}
                  >
                    Change Preset
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Categories to be loaded:</h4>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">Tier 1 Categories:</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedPreset.categories.tier1.map((tier1, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <span className="text-xs bg-primary/20 px-1 rounded">{tier1.sortOrder}</span>
                          {tier1.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">Tier 2 Categories:</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(selectedPreset.categories.tier2).map(([parentName, tier2Categories]) => (
                        <div key={parentName} className="border rounded-md p-3">
                          <div className="font-medium text-sm mb-2">{parentName} →</div>
                          <div className="flex flex-wrap gap-1">
                            {tier2Categories.map((tier2, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tier2.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPresetDialog(false);
                      setSelectedPreset(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLoadPresetCategories}
                    disabled={loadPresetCategoriesMutation.isPending}
                  >
                    {loadPresetCategoriesMutation.isPending ? 'Loading...' : 'Load Categories'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}