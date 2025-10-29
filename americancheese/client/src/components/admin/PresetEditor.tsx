import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Save, X, Package, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useToast } from "@/hooks/use-toast";
// Define types locally to avoid import issues
interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  estimatedDuration?: number;
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
      tasks?: TaskTemplate[];
    }>>;
  };
}

// Default presets data
const DEFAULT_PRESETS: CategoryPreset[] = [
  {
    id: 'home-builder',
    name: 'Home Builder',
    description: 'Comprehensive home building preset with permitting, structural, systems, and finishings phases',
    categories: {
      tier1: [
        { name: 'Permitting', description: 'Permits, approvals, and regulatory compliance', sortOrder: 1 },
        { name: 'Structural', description: 'Foundation, framing, and structural elements', sortOrder: 2 },
        { name: 'Systems', description: 'Electrical, plumbing, and HVAC systems', sortOrder: 3 },
        { name: 'Finishings', description: 'Flooring, paint, fixtures, and final touches', sortOrder: 4 }
      ],
      tier2: {
        'Permitting': [
          { 
            name: 'Building Permits', 
            description: 'Main building permit and approvals',
            tasks: [
              { id: 'BP1', title: 'Submit Building Plans', description: 'Submit architectural and structural plans to local building department', estimatedDuration: 1 },
              { id: 'BP2', title: 'Permit Review Process', description: 'Follow up on permit review and address any plan review comments', estimatedDuration: 7 }
            ]
          },
          { 
            name: 'Utility Permits', 
            description: 'Water, sewer, and utility connections',
            tasks: [
              { id: 'UP1', title: 'Water Connection Permit', description: 'Apply for water connection permit', estimatedDuration: 2 },
              { id: 'UP2', title: 'Sewer Connection Permit', description: 'Apply for sewer connection permit', estimatedDuration: 2 }
            ]
          }
        ],
        'Structural': [
          { 
            name: 'Foundation', 
            description: 'Foundation and excavation work',
            tasks: [
              { id: 'FN1', title: 'Form & Soil Preparation', description: 'Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly', estimatedDuration: 3 },
              { id: 'FN2', title: 'Foundation Utilities Installation', description: 'Install foundation stub plumbing and HVAC gas lines', estimatedDuration: 2 },
              { id: 'FN3', title: 'Foundation Base & Reinforcement', description: 'Prepare foundation base with crushed stone and reinforcing wire mesh', estimatedDuration: 2 }
            ]
          },
          { 
            name: 'Framing', 
            description: 'Structural framing and support',
            tasks: [
              { id: 'FR1', title: 'Floor System Framing', description: 'Install floor joists, beams, and subfloor', estimatedDuration: 3 },
              { id: 'FR2', title: 'Wall Framing', description: 'Frame exterior and interior walls with studs, plates, and headers', estimatedDuration: 5 },
              { id: 'FR3', title: 'Roof Framing', description: 'Install roof trusses or rafters and roof decking', estimatedDuration: 4 }
            ]
          },
          { 
            name: 'Roofing', 
            description: 'Roof installation and weatherproofing',
            tasks: [
              { id: 'RF1', title: 'Roof Sheathing Installation', description: 'Install plywood or OSB roof sheathing over framing', estimatedDuration: 2 },
              { id: 'RF2', title: 'Roofing Material Installation', description: 'Install shingles, metal roofing, or other roofing materials', estimatedDuration: 3 },
              { id: 'RF3', title: 'Gutters and Drainage', description: 'Install gutters, downspouts, and roof drainage systems', estimatedDuration: 1 }
            ]
          },
          { 
            name: 'Lumber & Materials', 
            description: 'Structural lumber and building materials',
            tasks: [
              { id: 'LM1', title: 'Lumber Delivery & Storage', description: 'Coordinate delivery and proper storage of structural lumber', estimatedDuration: 1 },
              { id: 'LM2', title: 'Material Quality Inspection', description: 'Inspect lumber and materials for defects and proper grades', estimatedDuration: 1 },
              { id: 'LM3', title: 'Structural Hardware Installation', description: 'Install structural connectors, bolts, and specialty hardware', estimatedDuration: 2 }
            ]
          }
        ],
        'Systems': [
          { 
            name: 'Electrical', 
            description: 'Electrical wiring and fixtures',
            tasks: [
              { id: 'EL1', title: 'Rough Electrical Wiring', description: 'Install electrical wiring, outlets, and switch boxes', estimatedDuration: 3 },
              { id: 'EL2', title: 'Electrical Panel Installation', description: 'Install main electrical panel and connect circuits', estimatedDuration: 1 },
              { id: 'EL3', title: 'Final Electrical Fixtures', description: 'Install light fixtures, switches, and outlet covers', estimatedDuration: 2 }
            ]
          },
          { 
            name: 'Plumbing', 
            description: 'Plumbing systems and fixtures',
            tasks: [
              { id: 'PL1', title: 'Rough Plumbing Installation', description: 'Install water supply and drain lines throughout structure', estimatedDuration: 3 },
              { id: 'PL2', title: 'Plumbing Fixtures Installation', description: 'Install sinks, toilets, tubs, and water heater', estimatedDuration: 2 },
              { id: 'PL3', title: 'Final Plumbing Connections', description: 'Connect fixtures and test all plumbing systems', estimatedDuration: 1 }
            ]
          },
          { 
            name: 'HVAC', 
            description: 'Heating, ventilation, and air conditioning systems',
            tasks: [
              { id: 'HV1', title: 'HVAC Rough-In', description: 'Install ductwork, vents, and HVAC rough connections', estimatedDuration: 3 },
              { id: 'HV2', title: 'HVAC Equipment Installation', description: 'Install furnace, air conditioning unit, and related equipment', estimatedDuration: 2 },
              { id: 'HV3', title: 'HVAC System Testing', description: 'Test and balance HVAC system for proper operation', estimatedDuration: 1 }
            ]
          },
          { 
            name: 'Communication & Security', 
            description: 'Low voltage systems, security, and communications',
            tasks: [
              { id: 'CS1', title: 'Low Voltage Wiring', description: 'Install network, phone, and cable wiring throughout structure', estimatedDuration: 2 },
              { id: 'CS2', title: 'Security System Installation', description: 'Install security cameras, alarms, and access control systems', estimatedDuration: 2 },
              { id: 'CS3', title: 'Smart Home Integration', description: 'Install and configure smart home automation systems', estimatedDuration: 1 }
            ]
          }
        ],
        'Finishings': [
          { 
            name: 'Flooring', 
            description: 'Floor materials and installation',
            tasks: [
              { id: 'FL1', title: 'Subfloor Preparation', description: 'Prepare and level subfloor for finish flooring', estimatedDuration: 1 },
              { id: 'FL2', title: 'Hardwood Floor Installation', description: 'Install hardwood flooring in designated areas', estimatedDuration: 4 },
              { id: 'FL3', title: 'Tile and Carpet Installation', description: 'Install tile in bathrooms and carpet in bedrooms', estimatedDuration: 3 }
            ]
          },
          { 
            name: 'Paint', 
            description: 'Interior and exterior painting',
            tasks: [
              { id: 'PT1', title: 'Surface Preparation', description: 'Prep walls, ceilings, and trim for painting', estimatedDuration: 2 },
              { id: 'PT2', title: 'Primer Application', description: 'Apply primer to all surfaces to be painted', estimatedDuration: 1 },
              { id: 'PT3', title: 'Final Paint Application', description: 'Apply finish coats of paint to all interior and exterior surfaces', estimatedDuration: 3 }
            ]
          },
          { 
            name: 'Cabinets & Fixtures', 
            description: 'Cabinetry, countertops, and built-in fixtures',
            tasks: [
              { id: 'CF1', title: 'Cabinet Installation', description: 'Install kitchen and bathroom cabinets', estimatedDuration: 3 },
              { id: 'CF2', title: 'Countertop Installation', description: 'Install countertops in kitchen and bathrooms', estimatedDuration: 2 },
              { id: 'CF3', title: 'Built-in Fixtures', description: 'Install built-in shelving, closet organizers, and specialty fixtures', estimatedDuration: 2 }
            ]
          },
          { 
            name: 'Trim & Millwork', 
            description: 'Interior trim, doors, and finish carpentry',
            tasks: [
              { id: 'TM1', title: 'Door Installation', description: 'Install interior and exterior doors with hardware', estimatedDuration: 2 },
              { id: 'TM2', title: 'Trim Installation', description: 'Install baseboards, crown molding, and window trim', estimatedDuration: 3 },
              { id: 'TM3', title: 'Finish Carpentry', description: 'Complete custom millwork and finish carpentry details', estimatedDuration: 2 }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'software-development',
    name: 'Software Development',
    description: 'Comprehensive software development preset with engineering, product management, design, and marketing phases',
    categories: {
      tier1: [
        { name: 'Software Engineering', description: 'Development, architecture, and technical implementation', sortOrder: 1 },
        { name: 'Product Management', description: 'Strategy, planning, and product lifecycle management', sortOrder: 2 },
        { name: 'Design / UX', description: 'User experience, interface design, and usability', sortOrder: 3 },
        { name: 'Marketing / Go-to-Market (GTM)', description: 'Marketing strategy, positioning, and market launch', sortOrder: 4 }
      ],
      tier2: {
        'Software Engineering': [
          { name: 'DevOps & Infrastructure', description: 'CI/CD, deployment, monitoring, and infrastructure' },
          { name: 'Application Development', description: 'Frontend, backend, and mobile development' },
          { name: 'Testing & Quality Assurance', description: 'Automated testing, code quality, and QA processes' },
          { name: 'Architecture & Database', description: 'System architecture, database design, and data modeling' }
        ],
        'Product Management': [
          { name: 'Strategy & Vision', description: 'Product strategy, vision, and goal setting' },
          { name: 'Discovery & Research', description: 'Market research, user research, and validation' },
          { name: 'Planning & Roadmap', description: 'Sprint planning, roadmap management, and prioritization' },
          { name: 'Analytics & Metrics', description: 'Data analysis, KPI tracking, and performance monitoring' }
        ],
        'Design / UX': [
          { name: 'Research and Usability', description: 'User research, usability testing, and design validation' },
          { name: 'UI/UX Design', description: 'Interface design, prototyping, and design systems' },
          { name: 'Visual & Brand Design', description: 'Visual design, branding, and graphic design elements' },
          { name: 'Design Systems & Standards', description: 'Design system management, style guides, and standards' }
        ],
        'Marketing / Go-to-Market (GTM)': [
          { name: 'Positioning & Messaging', description: 'Brand positioning, messaging, and content strategy' },
          { name: 'Demand Gen & Acquisition', description: 'Lead generation, acquisition, and growth marketing' },
          { name: 'Content & Communications', description: 'Content creation, PR, and external communications' },
          { name: 'Sales & Partnership', description: 'Sales enablement, partnerships, and business development' }
        ]
      }
    }
  }
];

interface PresetEditorProps {
  onPresetChange?: (presets: CategoryPreset[]) => void;
}

export default function PresetEditor({ onPresetChange }: PresetEditorProps) {
  const [presets, setPresets] = useState<CategoryPreset[]>(DEFAULT_PRESETS);
  const [editingPreset, setEditingPreset] = useState<CategoryPreset | null>(null);
  const [isNewPreset, setIsNewPreset] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    tier1Categories: [] as Array<{ name: string; description: string; sortOrder: number }>,
    tier2Categories: {} as Record<string, Array<{ name: string; description: string; tasks?: TaskTemplate[] }>>
  });

  useEffect(() => {
    if (editingPreset) {
      setFormData({
        id: editingPreset.id,
        name: editingPreset.name,
        description: editingPreset.description,
        tier1Categories: [...editingPreset.categories.tier1],
        tier2Categories: { ...editingPreset.categories.tier2 }
      });
    }
  }, [editingPreset]);

  const handleNewPreset = () => {
    const newPreset: CategoryPreset = {
      id: '',
      name: '',
      description: '',
      categories: {
        tier1: [],
        tier2: {}
      }
    };
    setEditingPreset(newPreset);
    setIsNewPreset(true);
    setFormData({
      id: '',
      name: '',
      description: '',
      tier1Categories: [],
      tier2Categories: {}
    });
    setIsDialogOpen(true);
  };

  const handleEditPreset = (preset: CategoryPreset) => {
    setEditingPreset(preset);
    setIsNewPreset(false);
    setIsDialogOpen(true);
  };

  const handleSavePreset = () => {
    if (!formData.name || !formData.id) {
      toast({
        title: "Validation Error",
        description: "Please provide both name and ID for the preset.",
        variant: "destructive"
      });
      return;
    }

    const updatedPreset: CategoryPreset = {
      id: formData.id,
      name: formData.name,
      description: formData.description,
      categories: {
        tier1: formData.tier1Categories,
        tier2: formData.tier2Categories
      }
    };

    let updatedPresets;
    if (isNewPreset) {
      updatedPresets = [...presets, updatedPreset];
    } else {
      updatedPresets = presets.map(p => p.id === editingPreset?.id ? updatedPreset : p);
    }

    setPresets(updatedPresets);
    onPresetChange?.(updatedPresets);
    
    toast({
      title: "Preset Saved",
      description: `${isNewPreset ? 'Created' : 'Updated'} preset "${formData.name}" successfully.`
    });

    setIsDialogOpen(false);
    setEditingPreset(null);
  };

  const handleDeletePreset = (presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    onPresetChange?.(updatedPresets);
    
    toast({
      title: "Preset Deleted",
      description: "The preset has been removed successfully."
    });
  };

  const addTier1Category = () => {
    const newCategory = {
      name: '',
      description: '',
      sortOrder: formData.tier1Categories.length + 1
    };
    setFormData({
      ...formData,
      tier1Categories: [...formData.tier1Categories, newCategory]
    });
  };

  const updateTier1Category = (index: number, field: string, value: string | number) => {
    const updated = [...formData.tier1Categories];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({
      ...formData,
      tier1Categories: updated
    });
  };

  const removeTier1Category = (index: number) => {
    const categoryName = formData.tier1Categories[index].name;
    const updatedTier1 = formData.tier1Categories.filter((_, i) => i !== index);
    const updatedTier2 = { ...formData.tier2Categories };
    delete updatedTier2[categoryName];
    
    setFormData({
      ...formData,
      tier1Categories: updatedTier1,
      tier2Categories: updatedTier2
    });
  };

  const addTier2Category = (tier1Name: string) => {
    const newCategory = { name: '', description: '', tasks: [] };
    const updatedTier2 = { ...formData.tier2Categories };
    if (!updatedTier2[tier1Name]) {
      updatedTier2[tier1Name] = [];
    }
    updatedTier2[tier1Name] = [...updatedTier2[tier1Name], newCategory];
    
    setFormData({
      ...formData,
      tier2Categories: updatedTier2
    });
  };

  const updateTier2Category = (tier1Name: string, index: number, field: string, value: string) => {
    const updatedTier2 = { ...formData.tier2Categories };
    updatedTier2[tier1Name][index] = { ...updatedTier2[tier1Name][index], [field]: value };
    
    setFormData({
      ...formData,
      tier2Categories: updatedTier2
    });
  };

  const removeTier2Category = (tier1Name: string, index: number) => {
    const updatedTier2 = { ...formData.tier2Categories };
    updatedTier2[tier1Name] = updatedTier2[tier1Name].filter((_, i) => i !== index);
    
    setFormData({
      ...formData,
      tier2Categories: updatedTier2
    });
  };

  // Task management functions
  const addTask = (tier1Name: string, tier2Index: number) => {
    const updatedTier2 = { ...formData.tier2Categories };
    const tier2Category = updatedTier2[tier1Name][tier2Index];
    
    if (!tier2Category.tasks) {
      tier2Category.tasks = [];
    }
    
    const newTask: TaskTemplate = {
      id: `TASK_${Date.now()}`,
      title: '',
      description: '',
      estimatedDuration: 1
    };
    
    tier2Category.tasks.push(newTask);
    
    setFormData({
      ...formData,
      tier2Categories: updatedTier2
    });
  };

  const updateTask = (tier1Name: string, tier2Index: number, taskIndex: number, field: keyof TaskTemplate, value: string | number) => {
    const updatedTier2 = { ...formData.tier2Categories };
    const tasks = updatedTier2[tier1Name][tier2Index].tasks;
    
    if (tasks && tasks[taskIndex]) {
      tasks[taskIndex] = { ...tasks[taskIndex], [field]: value };
    }
    
    setFormData({
      ...formData,
      tier2Categories: updatedTier2
    });
  };

  const removeTask = (tier1Name: string, tier2Index: number, taskIndex: number) => {
    const updatedTier2 = { ...formData.tier2Categories };
    const tier2Category = updatedTier2[tier1Name][tier2Index];
    
    if (tier2Category.tasks) {
      tier2Category.tasks = tier2Category.tasks.filter((_, i) => i !== taskIndex);
    }
    
    setFormData({
      ...formData,
      tier2Categories: updatedTier2
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Template Presets</h3>
          <p className="text-sm text-muted-foreground">
            Manage category presets that define the structure for different project types
          </p>
        </div>
        <Button onClick={handleNewPreset} className="gap-2">
          <Plus className="w-4 h-4" />
          New Preset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <Card key={preset.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{preset.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPreset(preset)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePreset(preset.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">{preset.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Tier 1 Categories</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {preset.categories.tier1.map((cat: any) => (
                      <Badge key={cat.name} variant="secondary" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Subcategories & Tasks</Label>
                  <div className="text-sm font-medium mt-1">
                    {Object.values(preset.categories.tier2).reduce((acc: number, cats: any) => acc + (cats?.length || 0), 0)} subcategories
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Object.values(preset.categories.tier2).reduce((acc: number, cats: any) => {
                      return acc + (cats?.reduce((taskAcc: number, cat: any) => taskAcc + (cat.tasks?.length || 0), 0) || 0);
                    }, 0)} total tasks
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {isNewPreset ? 'Create New Preset' : 'Edit Preset'}
            </DialogTitle>
            <DialogDescription>
              Define the category structure for this preset type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preset-id">Preset ID</Label>
                <Input
                  id="preset-id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g., custom-construction"
                />
              </div>
              <div>
                <Label htmlFor="preset-name">Name</Label>
                <Input
                  id="preset-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Custom Construction"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="preset-description">Description</Label>
              <Textarea
                id="preset-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of when to use this preset"
                className="h-20"
              />
            </div>

            {/* Categories */}
            <Tabs defaultValue="tier1" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tier1">Tier 1 Categories</TabsTrigger>
                <TabsTrigger value="tier2">Tier 2 Subcategories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tier1" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Main Categories</Label>
                  <Button onClick={addTier1Category} size="sm" variant="outline" className="gap-2">
                    <Plus className="w-3 h-3" />
                    Add Category
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.tier1Categories.map((category, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={category.name}
                          onChange={(e) => updateTier1Category(index, 'name', e.target.value)}
                          placeholder="Category name"
                        />
                      </div>
                      <div className="col-span-6">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={category.description}
                          onChange={(e) => updateTier1Category(index, 'description', e.target.value)}
                          placeholder="Brief description"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Order</Label>
                        <Input
                          type="number"
                          value={category.sortOrder}
                          onChange={(e) => updateTier1Category(index, 'sortOrder', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          onClick={() => removeTier1Category(index)}
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="tier2" className="space-y-4">
                <Label className="text-sm font-medium">Subcategories by Main Category</Label>
                
                {formData.tier1Categories.map((tier1Cat) => (
                  <Card key={tier1Cat.name} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{tier1Cat.name || 'Unnamed Category'}</h4>
                      <Button
                        onClick={() => addTier2Category(tier1Cat.name)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        disabled={!tier1Cat.name}
                      >
                        <Plus className="w-3 h-3" />
                        Add Subcategory
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {(formData.tier2Categories[tier1Cat.name] || []).map((subcat, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50/50">
                          {/* Subcategory Info */}
                          <div className="grid grid-cols-12 gap-2 items-end mb-3">
                            <div className="col-span-5">
                              <Label className="text-xs">Subcategory Name</Label>
                              <Input
                                value={subcat.name}
                                onChange={(e) => updateTier2Category(tier1Cat.name, index, 'name', e.target.value)}
                                placeholder="Subcategory name"
                              />
                            </div>
                            <div className="col-span-6">
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={subcat.description}
                                onChange={(e) => updateTier2Category(tier1Cat.name, index, 'description', e.target.value)}
                                placeholder="Brief description"
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                onClick={() => removeTier2Category(tier1Cat.name, index)}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Tasks Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium text-muted-foreground">Individual Tasks</Label>
                              <Button
                                onClick={() => addTask(tier1Cat.name, index)}
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 gap-1 text-xs"
                                disabled={!subcat.name}
                              >
                                <Plus className="w-3 h-3" />
                                Add Task
                              </Button>
                            </div>
                            
                            {subcat.tasks && subcat.tasks.length > 0 ? (
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {subcat.tasks.map((task, taskIndex) => (
                                  <div key={taskIndex} className="bg-white p-2 rounded border space-y-2">
                                    <div className="grid grid-cols-12 gap-2">
                                      <div className="col-span-2">
                                        <Input
                                          value={task.id}
                                          onChange={(e) => updateTask(tier1Cat.name, index, taskIndex, 'id', e.target.value)}
                                          placeholder="ID"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div className="col-span-4">
                                        <Input
                                          value={task.title}
                                          onChange={(e) => updateTask(tier1Cat.name, index, taskIndex, 'title', e.target.value)}
                                          placeholder="Task title"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div className="col-span-4">
                                        <Input
                                          value={task.description}
                                          onChange={(e) => updateTask(tier1Cat.name, index, taskIndex, 'description', e.target.value)}
                                          placeholder="Task description"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div className="col-span-1">
                                        <Input
                                          type="number"
                                          value={task.estimatedDuration}
                                          onChange={(e) => updateTask(tier1Cat.name, index, taskIndex, 'estimatedDuration', parseInt(e.target.value) || 1)}
                                          placeholder="Days"
                                          className="h-7 text-xs"
                                          min="1"
                                        />
                                      </div>
                                      <div className="col-span-1">
                                        <Button
                                          onClick={() => removeTask(tier1Cat.name, index, taskIndex)}
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic py-2">
                                No tasks defined. Click "Add Task" to create individual tasks for this subcategory.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreset} className="gap-2">
                <Save className="w-4 h-4" />
                {isNewPreset ? 'Create Preset' : 'Update Preset'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}