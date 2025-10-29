import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit3, Trash2, Save, X, Palette, Copy, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
// Define ColorTheme type locally
interface ColorTheme {
  name: string;
  description: string;
  tier1: {
    subcategory1: string;
    subcategory2: string;
    subcategory3: string;
    subcategory4: string;
    subcategory5: string;
    default: string;
  };
  tier2: {
    [key: string]: string;
  };
}

// Default themes
const DEFAULT_THEMES: Record<string, ColorTheme> = {
  "earth-tone": {
    name: "Earth Tone",
    description: "Natural earthy colors inspired by traditional building materials",
    tier1: {
      subcategory1: "#556b2f",
      subcategory2: "#445566",
      subcategory3: "#9b2c2c",
      subcategory4: "#8b4513",
      subcategory5: "#5c4033",
      default: "#6b7280"
    },
    tier2: {
      tier2_1: "#047857", tier2_2: "#65a30d", tier2_3: "#15803d", tier2_4: "#047857", tier2_5: "#166534",
      tier2_6: "#2563eb", tier2_7: "#0891b2", tier2_8: "#0284c7", tier2_9: "#e11d48", tier2_10: "#db2777",
      foundation: "#047857", framing: "#65a30d", roofing: "#15803d", electrical: "#2563eb", plumbing: "#0891b2",
      other: "#4b5563"
    }
  },
  "pastel": {
    name: "Pastel",
    description: "Soft, modern colors for a clean and contemporary look",
    tier1: {
      subcategory1: "#93c5fd",
      subcategory2: "#a5b4fc",
      subcategory3: "#fda4af",
      subcategory4: "#fcd34d",
      subcategory5: "#d8b4fe",
      default: "#d8b4fe"
    },
    tier2: {
      tier2_1: "#93c5fd", tier2_2: "#bfdbfe", tier2_3: "#60a5fa", tier2_4: "#3b82f6", tier2_5: "#2563eb",
      tier2_6: "#a5b4fc", tier2_7: "#818cf8", tier2_8: "#6366f1", tier2_9: "#fda4af", tier2_10: "#fb7185",
      foundation: "#93c5fd", framing: "#a5b4fc", roofing: "#fda4af", electrical: "#60a5fa", plumbing: "#818cf8",
      other: "#a78bfa"
    }
  }
};

const applyThemeToCSS = (theme: ColorTheme): void => {
  if (typeof document === 'undefined') return;
  
  document.documentElement.style.setProperty('--tier1-subcategory1', theme.tier1.subcategory1);
  document.documentElement.style.setProperty('--tier1-subcategory2', theme.tier1.subcategory2);
  document.documentElement.style.setProperty('--tier1-subcategory3', theme.tier1.subcategory3);
  document.documentElement.style.setProperty('--tier1-subcategory4', theme.tier1.subcategory4);
  document.documentElement.style.setProperty('--tier1-subcategory5', theme.tier1.subcategory5);
};

const getActiveColorTheme = (): ColorTheme => {
  return DEFAULT_THEMES["earth-tone"];
};

interface ThemeEditorProps {
  onThemeChange?: (themes: Record<string, ColorTheme>) => void;
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function ColorInput({ label, value, onChange, className = "" }: ColorInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 p-1 border rounded cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );
}

export default function ThemeEditor({ onThemeChange }: ThemeEditorProps) {
  const [themes, setThemes] = useState<Record<string, ColorTheme>>(DEFAULT_THEMES);
  const [editingTheme, setEditingTheme] = useState<ColorTheme | null>(null);
  const [isNewTheme, setIsNewTheme] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ColorTheme>(getActiveColorTheme());
  const { toast } = useToast();

  const [formData, setFormData] = useState<ColorTheme>({
    name: '',
    description: '',
    tier1: {
      subcategory1: '#556b2f',
      subcategory2: '#445566',
      subcategory3: '#9b2c2c',
      subcategory4: '#8b4513',
      subcategory5: '#5c4033',
      default: '#6b7280'
    },
    tier2: {
      tier2_1: '#047857', tier2_2: '#65a30d', tier2_3: '#15803d', tier2_4: '#047857', tier2_5: '#166534',
      tier2_6: '#2563eb', tier2_7: '#0891b2', tier2_8: '#0284c7', tier2_9: '#e11d48', tier2_10: '#db2777',
      tier2_11: '#ef4444', tier2_12: '#f43f5e', tier2_13: '#b91c1c', tier2_14: '#f59e0b', tier2_15: '#ca8a04',
      tier2_16: '#ea580c', tier2_17: '#b45309', tier2_18: '#a16207', tier2_19: '#f97316', tier2_20: '#4b5563',
      foundation: '#047857', framing: '#65a30d', roofing: '#15803d', electrical: '#2563eb', plumbing: '#0891b2',
      other: '#4b5563'
    }
  });

  useEffect(() => {
    if (editingTheme) {
      setFormData({ ...editingTheme });
    }
  }, [editingTheme]);

  const generateThemeKey = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleNewTheme = () => {
    const newTheme: ColorTheme = {
      name: '',
      description: '',
      tier1: {
        subcategory1: '#556b2f',
        subcategory2: '#445566',
        subcategory3: '#9b2c2c',
        subcategory4: '#8b4513',
        subcategory5: '#5c4033',
        default: '#6b7280'
      },
      tier2: {
        tier2_1: '#047857', tier2_2: '#65a30d', tier2_3: '#15803d', tier2_4: '#047857', tier2_5: '#166534',
        tier2_6: '#2563eb', tier2_7: '#0891b2', tier2_8: '#0284c7', tier2_9: '#e11d48', tier2_10: '#db2777',
        tier2_11: '#ef4444', tier2_12: '#f43f5e', tier2_13: '#b91c1c', tier2_14: '#f59e0b', tier2_15: '#ca8a04',
        tier2_16: '#ea580c', tier2_17: '#b45309', tier2_18: '#a16207', tier2_19: '#f97316', tier2_20: '#4b5563',
        foundation: '#047857', framing: '#65a30d', roofing: '#15803d', lumber: '#047857', shingles: '#166534',
        electrical: '#2563eb', plumbing: '#0891b2', hvac: '#0284c7', barriers: '#e11d48', drywall: '#db2777',
        exteriors: '#ef4444', siding: '#f43f5e', insulation: '#b91c1c', windows: '#f59e0b', doors: '#ca8a04',
        cabinets: '#ea580c', fixtures: '#b45309', flooring: '#a16207', paint: '#f97316', permits: '#4b5563',
        other: '#4b5563'
      }
    };
    setEditingTheme(newTheme);
    setIsNewTheme(true);
    setFormData(newTheme);
    setIsDialogOpen(true);
  };

  const handleEditTheme = (theme: ColorTheme) => {
    setEditingTheme(theme);
    setIsNewTheme(false);
    setIsDialogOpen(true);
  };

  const handleDuplicateTheme = (theme: ColorTheme) => {
    const duplicatedTheme = {
      ...theme,
      name: `${theme.name} Copy`,
      description: `Copy of ${theme.description}`
    };
    setEditingTheme(duplicatedTheme);
    setIsNewTheme(true);
    setFormData(duplicatedTheme);
    setIsDialogOpen(true);
  };

  const handlePreviewTheme = (theme: ColorTheme) => {
    applyThemeToCSS(theme);
    setActiveTheme(theme);
    toast({
      title: "Preview Applied",
      description: `Now previewing "${theme.name}" theme. Changes are temporary.`,
    });
  };

  const handleSaveTheme = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a name for the theme.",
        variant: "destructive"
      });
      return;
    }

    const themeKey = generateThemeKey(formData.name);
    const updatedThemes = { ...themes };

    // If it's a new theme or the name changed, handle key management
    if (isNewTheme || (editingTheme && generateThemeKey(editingTheme.name) !== themeKey)) {
      if (updatedThemes[themeKey]) {
        toast({
          title: "Name Conflict",
          description: "A theme with this name already exists. Please choose a different name.",
          variant: "destructive"
        });
        return;
      }
      
      // If editing and name changed, remove the old key
      if (!isNewTheme && editingTheme) {
        const oldKey = generateThemeKey(editingTheme.name);
        delete updatedThemes[oldKey];
      }
    }

    updatedThemes[themeKey] = { ...formData };
    setThemes(updatedThemes);
    onThemeChange?.(updatedThemes);
    
    toast({
      title: "Theme Saved",
      description: `${isNewTheme ? 'Created' : 'Updated'} theme "${formData.name}" successfully.`
    });

    setIsDialogOpen(false);
    setEditingTheme(null);
  };

  const handleDeleteTheme = (themeKey: string, themeName: string) => {
    const updatedThemes = { ...themes };
    delete updatedThemes[themeKey];
    setThemes(updatedThemes);
    onThemeChange?.(updatedThemes);
    
    toast({
      title: "Theme Deleted",
      description: `Removed theme "${themeName}" successfully.`
    });
  };

  const updateTier1Color = (key: keyof ColorTheme['tier1'], value: string) => {
    setFormData({
      ...formData,
      tier1: { ...formData.tier1, [key]: value }
    });
  };

  const updateTier2Color = (key: keyof ColorTheme['tier2'], value: string) => {
    setFormData({
      ...formData,
      tier2: { ...formData.tier2, [key]: value }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Color Themes</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage color themes that define the visual appearance of categories
          </p>
        </div>
        <Button onClick={handleNewTheme} className="gap-2">
          <Plus className="w-4 h-4" />
          New Theme
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(themes).map(([key, theme]) => (
          <Card key={key} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{theme.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewTheme(theme)}
                    className="h-8 w-8 p-0"
                    title="Preview Theme"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateTheme(theme)}
                    className="h-8 w-8 p-0"
                    title="Duplicate Theme"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTheme(theme)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTheme(key, theme.name)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">{theme.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Main Categories</Label>
                  <div className="flex gap-1 mt-1">
                    {Object.entries(theme.tier1)
                      .filter(([key]) => key.startsWith('subcategory') || key === 'default')
                      .map(([key, color]) => (
                        <div
                          key={key}
                          className="w-6 h-6 rounded border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={key}
                        />
                      ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    Active: {activeTheme.name === theme.name ? 'Yes' : 'No'}
                  </Label>
                  {activeTheme.name === theme.name && (
                    <Badge variant="secondary" className="text-xs mt-1">Currently Active</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {isNewTheme ? 'Create New Theme' : 'Edit Theme'}
            </DialogTitle>
            <DialogDescription>
              Customize colors for main categories and subcategories
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="theme-name">Theme Name</Label>
                <Input
                  id="theme-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., My Custom Theme"
                />
              </div>
              <div>
                <Label htmlFor="theme-description">Description</Label>
                <Textarea
                  id="theme-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the theme's style or purpose"
                  className="h-20"
                />
              </div>
            </div>

            {/* Color Settings */}
            <Tabs defaultValue="tier1" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tier1">Main Categories (Tier 1)</TabsTrigger>
                <TabsTrigger value="tier2">Subcategories (Tier 2)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tier1" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ColorInput
                    label="Category 1"
                    value={formData.tier1.subcategory1}
                    onChange={(value) => updateTier1Color('subcategory1', value)}
                  />
                  <ColorInput
                    label="Category 2"
                    value={formData.tier1.subcategory2}
                    onChange={(value) => updateTier1Color('subcategory2', value)}
                  />
                  <ColorInput
                    label="Category 3"
                    value={formData.tier1.subcategory3}
                    onChange={(value) => updateTier1Color('subcategory3', value)}
                  />
                  <ColorInput
                    label="Category 4"
                    value={formData.tier1.subcategory4}
                    onChange={(value) => updateTier1Color('subcategory4', value)}
                  />
                  <ColorInput
                    label="Category 5"
                    value={formData.tier1.subcategory5}
                    onChange={(value) => updateTier1Color('subcategory5', value)}
                  />
                  <ColorInput
                    label="Default"
                    value={formData.tier1.default}
                    onChange={(value) => updateTier1Color('default', value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="tier2" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Generic tier2 colors */}
                  {Array.from({ length: 20 }, (_, i) => {
                    const key = `tier2_${i + 1}` as keyof ColorTheme['tier2'];
                    return (
                      <ColorInput
                        key={key}
                        label={`Tier 2 Color ${i + 1}`}
                        value={formData.tier2[key]}
                        onChange={(value) => updateTier2Color(key, value)}
                        className="min-w-0"
                      />
                    );
                  })}
                </div>
                
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-3 block">Legacy Subcategory Colors (Backward Compatibility)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(formData.tier2)
                      .filter(([key]) => !key.startsWith('tier2_') && key !== 'other')
                      .map(([key, value]) => (
                        <ColorInput
                          key={key}
                          label={key.charAt(0).toUpperCase() + key.slice(1)}
                          value={value}
                          onChange={(newValue) => updateTier2Color(key as keyof ColorTheme['tier2'], newValue)}
                          className="min-w-0"
                        />
                      ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handlePreviewTheme(formData)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button onClick={handleSaveTheme} className="gap-2">
                <Save className="w-4 h-4" />
                {isNewTheme ? 'Create Theme' : 'Update Theme'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}