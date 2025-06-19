import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2, Palette } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";

// Types
interface TemplateCategory {
  id: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
  projectId: number | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormValues {
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
  projectId?: number | null;
  color?: string | null;
}

interface CategoryManagerProps {
  projectId: number | null;
}

// Predefined theme presets
type PredefinedTheme = {
  name: string;
  description: string;
  colors: {
    structural: string;
    systems: string;
    sheathing: string;
    finishings: string;
    foundation: string;
    framing: string;
    electrical: string;
    plumbing: string;
    hvac: string;
    drywall: string;
    insulation: string;
    windows: string;
    doors: string;
  };
};

const PREDEFINED_THEMES: Record<string, PredefinedTheme> = {
  "Earth Tone": {
    name: "Earth Tone",
    description: "Natural earthy colors inspired by traditional building materials",
    colors: {
      structural: "#556b2f", systems: "#445566", sheathing: "#9b2c2c", finishings: "#8b4513",
      foundation: "#047857", framing: "#65a30d", electrical: "#2563eb", plumbing: "#0891b2",
      hvac: "#0284c7", drywall: "#db2777", insulation: "#b91c1c", windows: "#f59e0b", doors: "#ca8a04"
    }
  },
  "Pastel": {
    name: "Pastel",
    description: "Soft, modern colors for a clean and contemporary look",
    colors: {
      structural: "#93c5fd", systems: "#a5b4fc", sheathing: "#fda4af", finishings: "#fcd34d",
      foundation: "#93c5fd", framing: "#bfdbfe", electrical: "#a5b4fc", plumbing: "#818cf8",
      hvac: "#6366f1", drywall: "#fb7185", insulation: "#be123c", windows: "#fcd34d", doors: "#fbbf24"
    }
  },
  "Futuristic": {
    name: "Futuristic",
    description: "Bold, vibrant colors for a modern tech-forward look",
    colors: {
      structural: "#3b82f6", systems: "#8b5cf6", sheathing: "#ec4899", finishings: "#10b981",
      foundation: "#1d4ed8", framing: "#2563eb", electrical: "#7c3aed", plumbing: "#8b5cf6",
      hvac: "#a78bfa", drywall: "#db2777", insulation: "#f9a8d4", windows: "#047857", doors: "#10b981"
    }
  },
  "Classic Construction": {
    name: "Classic Construction",
    description: "Traditional construction colors inspired by safety equipment and signage",
    colors: {
      structural: "#fbbf24", systems: "#1e3a8a", sheathing: "#ef4444", finishings: "#0f172a",
      foundation: "#92400e", framing: "#b45309", electrical: "#1e40af", plumbing: "#1d4ed8",
      hvac: "#2563eb", drywall: "#b91c1c", insulation: "#f87171", windows: "#1e293b", doors: "#334155"
    }
  },
  "Vibrant": {
    name: "Vibrant",
    description: "High-contrast, saturated colors for maximum visibility and distinction",
    colors: {
      structural: "#16a34a", systems: "#2563eb", sheathing: "#dc2626", finishings: "#d97706",
      foundation: "#14532d", framing: "#15803d", electrical: "#1e3a8a", plumbing: "#1d4ed8",
      hvac: "#3b82f6", drywall: "#b91c1c", insulation: "#fca5a5", windows: "#92400e", doors: "#b45309"
    }
  },
  "Molten Core": {
    name: "Molten Core",
    description: "Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks",
    colors: {
      structural: "#330000", systems: "#8B0000", sheathing: "#FF4500", finishings: "#FFA500",
      foundation: "#0F0000", framing: "#220000", electrical: "#660000", plumbing: "#8B0000",
      hvac: "#AA0000", drywall: "#DD4400", insulation: "#FF7700", windows: "#CC8500", doors: "#FFA500"
    }
  },
  "Cloud Circuit": {
    name: "Cloud Circuit",
    description: "Futuristic whites and cool metallics inspired by tech and cloud computing",
    colors: {
      structural: "#E0E0E0", systems: "#C0C0C0", sheathing: "#B0E0E6", finishings: "#FFFFFF",
      foundation: "#A9A9A9", framing: "#C0C0C0", electrical: "#A0A0A0", plumbing: "#B0B0B0",
      hvac: "#C0C0C0", drywall: "#ADD8E6", insulation: "#D0F0F8", windows: "#F0F0F0", doors: "#FFFFFF"
    }
  },
  "Solar Flare": {
    name: "Solar Flare",
    description: "Explosive energy in bright yellows, golds, and radiant reds",
    colors: {
      structural: "#FFD700", systems: "#FF8C00", sheathing: "#FF0000", finishings: "#FFFFE0",
      foundation: "#B8860B", framing: "#DAA520", electrical: "#FF4500", plumbing: "#FF6347",
      hvac: "#FF8C00", drywall: "#B22222", insulation: "#FF4444", windows: "#FFFF00", doors: "#FFFFF0"
    }
  },
  "Obsidian Mirage": {
    name: "Obsidian Mirage",
    description: "Deep blacks, iridescent purples, and flashes of green inspired by volcanic glass",
    colors: {
      structural: "#0B0B0B", systems: "#4B0082", sheathing: "#2E8B57", finishings: "#9932CC",
      foundation: "#000000", framing: "#0A0A0A", electrical: "#2E0854", plumbing: "#4B0082",
      hvac: "#663399", drywall: "#228B22", insulation: "#66CDAA", windows: "#800080", doors: "#DA70D6"
    }
  },
  "Neon Noir": {
    name: "Neon Noir",
    description: "Cyberpunk aesthetic with vibrant neons over shadowy backdrops",
    colors: {
      structural: "#0A0A0A", systems: "#FF073A", sheathing: "#39FF14", finishings: "#00FFFF",
      foundation: "#000000", framing: "#1A1A1A", electrical: "#FF1A75", plumbing: "#1AFF8C",
      hvac: "#8C1AFF", drywall: "#FF4DFF", insulation: "#4DFF4D", windows: "#4DFFFF", doors: "#FFFF4D"
    }
  },
  "Dust Planet": {
    name: "Dust Planet",
    description: "Martian reds and dusty browns reminiscent of alien worlds",
    colors: {
      structural: "#8B4513", systems: "#CD853F", sheathing: "#A0522D", finishings: "#DEB887",
      foundation: "#654321", framing: "#8B4513", electrical: "#CD853F", plumbing: "#A0522D",
      hvac: "#D2B48C", drywall: "#DEB887", insulation: "#F5DEB3", windows: "#FFEFD5", doors: "#FFF8DC"
    }
  },
  "Crystal Cavern": {
    name: "Crystal Cavern",
    description: "Ethereal blues and purples like mystical underground gems",
    colors: {
      structural: "#191970", systems: "#483D8B", sheathing: "#6A5ACD", finishings: "#9370DB",
      foundation: "#000080", framing: "#191970", electrical: "#4169E1", plumbing: "#6495ED",
      hvac: "#87CEEB", drywall: "#B0C4DE", insulation: "#E6E6FA", windows: "#F0F8FF", doors: "#FFFFFF"
    }
  },
  "Paper Studio": {
    name: "Paper Studio",
    description: "Clean minimalist whites and soft paper tones",
    colors: {
      structural: "#F5F5F5", systems: "#E8E8E8", sheathing: "#DCDCDC", finishings: "#D3D3D3",
      foundation: "#F0F0F0", framing: "#EEEEEE", electrical: "#E0E0E0", plumbing: "#D8D8D8",
      hvac: "#D0D0D0", drywall: "#C8C8C8", insulation: "#F8F8F8", windows: "#FAFAFA", doors: "#FFFFFF"
    }
  },
  "Biohazard Zone": {
    name: "Biohazard Zone",
    description: "Toxic yellows and warning greens for high-alert projects",
    colors: {
      structural: "#FFFF00", systems: "#ADFF2F", sheathing: "#9ACD32", finishings: "#32CD32",
      foundation: "#DAA520", framing: "#FFD700", electrical: "#FFFF66", plumbing: "#98FB98",
      hvac: "#90EE90", drywall: "#F0E68C", insulation: "#FAFAD2", windows: "#00FF7F", doors: "#7FFF00"
    }
  },
  "Velvet Lounge": {
    name: "Velvet Lounge",
    description: "Rich burgundies and deep purples for a luxurious feel",
    colors: {
      structural: "#722F37", systems: "#8E24AA", sheathing: "#AB47BC", finishings: "#CE93D8",
      foundation: "#4A148C", framing: "#6A1B9A", electrical: "#8E24AA", plumbing: "#AB47BC",
      hvac: "#BA68C8", drywall: "#CE93D8", insulation: "#E1BEE7", windows: "#F3E5F5", doors: "#FCE4EC"
    }
  }
};

// Helper function to get tier2 category default colors
const tier2DefaultColor = (tier2Name: string, tier1Name: string) => {
  const t2 = tier2Name.toLowerCase();
  const t1 = tier1Name.toLowerCase();
  
  // Structural subcategories
  if (t1.includes('structural')) {
    if (t2.includes('foundation')) return "#047857"; // emerald-600
    if (t2.includes('framing')) return "#65a30d";    // lime-600
    if (t2.includes('roof')) return "#15803d";       // green-700
    return "#047857";  // Default structural subcategory
  }
  
  // Systems subcategories
  if (t1.includes('system')) {
    if (t2.includes('electric')) return "#2563eb";  // blue-600
    if (t2.includes('plumbing')) return "#0891b2";  // cyan-600
    if (t2.includes('hvac')) return "#0284c7";      // sky-600
    return "#0284c7";  // Default systems subcategory
  }
  
  // Sheathing subcategories
  if (t1.includes('sheath')) {
    if (t2.includes('barrier')) return "#e11d48";    // rose-600
    if (t2.includes('drywall')) return "#db2777";    // pink-600
    if (t2.includes('exterior')) return "#ef4444";   // red-500
    if (t2.includes('siding')) return "#f43f5e";     // rose-500
    if (t2.includes('insulation')) return "#b91c1c"; // red-700
    return "#ef4444";  // Default sheathing subcategory
  }
  
  // Finishings subcategories
  if (t1.includes('finish')) {
    if (t2.includes('window')) return "#f59e0b";   // amber-500
    if (t2.includes('door')) return "#ca8a04";     // yellow-600
    if (t2.includes('cabinet')) return "#ea580c";  // orange-600
    if (t2.includes('fixture')) return "#b45309";  // amber-700
    if (t2.includes('floor')) return "#a16207";    // yellow-700
    if (t2.includes('paint')) return "#f97316";    // orange-500
    return "#f59e0b";  // Default finishings subcategory
  }
  
  return "#6366f1"; // Default indigo
};

// Component
export default function CategoryManager({ projectId }: CategoryManagerProps) {
  const { toast } = useToast();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openThemeDialog, setOpenThemeDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<TemplateCategory | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [themeColors, setThemeColors] = useState<{[key: string]: string}>({});
  const [savedThemes, setSavedThemes] = useState<{[themeName: string]: {[categoryId: string]: string}}>({});
  const [currentThemeName, setCurrentThemeName] = useState<string>('');
  const [newThemeName, setNewThemeName] = useState<string>('');

  // Fetch categories - use global admin endpoint if projectId is null
  const { data: categories = [], isLoading } = useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories'],
    queryFn: async () => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories`
        : '/api/admin/template-categories';
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    enabled: true
  });

  // Initialize theme colors from current categories and load saved themes
  useEffect(() => {
    if (categories.length > 0) {
      const colorMap: {[key: string]: string} = {};
      categories.forEach((cat: TemplateCategory) => {
        if (cat.color) {
          colorMap[cat.id.toString()] = cat.color;
        }
      });
      setThemeColors(colorMap);
      
      // Load saved themes for this project from localStorage
      if (projectId) {
        const savedThemesKey = `project-themes-${projectId}`;
        const storedThemes = localStorage.getItem(savedThemesKey);
        if (storedThemes) {
          try {
            setSavedThemes(JSON.parse(storedThemes));
          } catch (error) {
            console.error('Failed to parse saved themes:', error);
          }
        }
      }
    }
  }, [categories, projectId]);
  const [formValues, setFormValues] = useState<CategoryFormValues>({
    name: "",
    type: "tier1",
    parentId: null,
    projectId: null,
    color: "#6366f1" // Default color (indigo)
  });

  // Listen for theme changes and force refresh
  useEffect(() => {
    const handleThemeChange = () => {
      console.log('Category manager: Theme changed event received');
      // Force component refresh to pick up new colors
      setRefreshKey(prev => prev + 1);
      
      // Invalidate categories query to refetch with new colors
      queryClient.invalidateQueries({ 
        queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories']
      });
    };

    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, [projectId]);

  const tier1Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier1');
  const tier2Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier2');
  
  // Listen for theme changes
  const [forceUpdate, setForceUpdate] = useState(0);
  
  useEffect(() => {
    // Function to handle theme change events
    const handleThemeChange = () => {
      console.log("Theme changed event detected in CategoryManager");
      // Force re-render by updating state
      setForceUpdate(prev => prev + 1);
    };
    
    // Listen for the custom theme-change event
    window.addEventListener('theme-changed', handleThemeChange);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories`
        : '/api/admin/template-categories';
      const response = await apiRequest(endpoint, 'POST', {
        ...data,
        projectId // Ensure projectId is included
      });
      return response;
    },
    onSuccess: () => {
      const queryKey = projectId 
        ? [`/api/projects/${projectId}/template-categories`]
        : ['/api/admin/template-categories'];
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Category created successfully", variant: "default" });
      setOpenCreateDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CategoryFormValues }) => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories/${id}`
        : `/api/admin/template-categories/${id}`;
      const response = await apiRequest(endpoint, 'PUT', {
        ...data,
        projectId // Ensure projectId is included
      });
      return response;
    },
    onSuccess: () => {
      const queryKey = projectId 
        ? [`/api/projects/${projectId}/template-categories`]
        : ['/api/admin/template-categories'];
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Category updated successfully", variant: "default" });
      setOpenEditDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories/${id}`
        : `/api/admin/template-categories/${id}`;
      const response = await apiRequest(endpoint, 'DELETE');
      return true;
    },
    onSuccess: () => {
      const queryKey = projectId 
        ? [`/api/projects/${projectId}/template-categories`]
        : ['/api/admin/template-categories'];
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Category deleted successfully", variant: "default" });
      setOpenDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Bulk theme update mutation
  const themeUpdateMutation = useMutation({
    mutationFn: async (colorUpdates: {[categoryId: string]: string}) => {
      const updates = Object.entries(colorUpdates).map(([categoryId, color]) => 
        apiRequest(`/api/admin/template-categories/${categoryId}`, 'PUT', { color })
      );
      return Promise.all(updates);
    },
    onSuccess: () => {
      const queryKey = projectId 
        ? [`/api/projects/${projectId}/template-categories`]
        : ['/api/admin/template-categories'];
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Theme colors updated successfully", variant: "default" });
      setOpenThemeDialog(false);
      setRefreshKey(prev => prev + 1);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update theme colors", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Form handlers
  const resetForm = () => {
    setFormValues({
      name: "",
      type: "tier1",
      parentId: null,
      projectId: projectId, // Include the projectId
      color: "#6366f1" // Default color (indigo)
    });
    setCurrentCategory(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formValues);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCategory) {
      updateMutation.mutate({ id: currentCategory.id, data: formValues });
    }
  };

  const handleDelete = () => {
    if (currentCategory) {
      deleteMutation.mutate(currentCategory.id);
    }
  };

  const handleEditClick = (category: TemplateCategory) => {
    setCurrentCategory(category);
    
    // Preserve the current color - use stored color if available, otherwise use theme-based color
    let preservedColor = category.color;
    if (!preservedColor) {
      if (category.type === 'tier2' && category.parentId) {
        // Find the parent category to get the tier1 name for default color
        const parentCategory = categories.find((c: TemplateCategory) => c.id === category.parentId);
        if (parentCategory) {
          preservedColor = tier2DefaultColor(category.name, parentCategory.name);
        } else {
          preservedColor = "#6366f1"; // Default indigo for tier2
        }
      } else {
        preservedColor = "#6366f1"; // Default indigo for tier1
      }
    }
    
    setFormValues({
      name: category.name,
      type: category.type,
      parentId: category.parentId,
      projectId: projectId,
      color: preservedColor
    });
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (category: TemplateCategory) => {
    setCurrentCategory(category);
    setOpenDeleteDialog(true);
  };

  const handleThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    themeUpdateMutation.mutate(themeColors);
  };

  const handleThemeColorChange = (categoryId: string, color: string) => {
    setThemeColors(prev => ({
      ...prev,
      [categoryId]: color
    }));
  };

  const saveTheme = () => {
    if (!newThemeName.trim() || !projectId) return;
    
    const updatedThemes = {
      ...savedThemes,
      [newThemeName]: { ...themeColors }
    };
    
    setSavedThemes(updatedThemes);
    const savedThemesKey = `project-themes-${projectId}`;
    localStorage.setItem(savedThemesKey, JSON.stringify(updatedThemes));
    setNewThemeName('');
    
    toast({ 
      title: "Theme saved successfully", 
      description: `Theme "${newThemeName}" has been saved for this project`,
      variant: "default" 
    });
  };

  const loadTheme = (themeName: string) => {
    if (savedThemes[themeName]) {
      setThemeColors(savedThemes[themeName]);
      setCurrentThemeName(themeName);
    }
  };

  const deleteTheme = (themeName: string) => {
    if (!projectId) return;
    
    const updatedThemes = { ...savedThemes };
    delete updatedThemes[themeName];
    
    setSavedThemes(updatedThemes);
    const savedThemesKey = `project-themes-${projectId}`;
    localStorage.setItem(savedThemesKey, JSON.stringify(updatedThemes));
    
    if (currentThemeName === themeName) {
      setCurrentThemeName('');
    }
    
    toast({ 
      title: "Theme deleted", 
      description: `Theme "${themeName}" has been removed`,
      variant: "default" 
    });
  };

  const applyPredefinedTheme = (themeKey: string) => {
    const theme = PREDEFINED_THEMES[themeKey];
    if (!theme) return;

    // Create a mapping of category names to their IDs and apply colors
    const newThemeColors: {[categoryId: string]: string} = {};
    
    categories.forEach((category: TemplateCategory) => {
      const categoryName = category.name.toLowerCase();
      
      // Try to match with predefined colors
      let color = "#6366f1"; // default
      
      // Check tier1 categories first - be more flexible with matching
      if (category.type === 'tier1') {
        if (categoryName.includes('structural') || categoryName === 'structural') {
          color = theme.colors.structural;
        } else if (categoryName.includes('system') || categoryName === 'systems') {
          color = theme.colors.systems;
        } else if (categoryName.includes('sheath') || categoryName === 'sheathing') {
          color = theme.colors.sheathing;
        } else if (categoryName.includes('finish') || categoryName === 'finishings') {
          color = theme.colors.finishings;
        } else {
          // Apply a default tier1 color based on theme
          color = theme.colors.structural; // Use structural as default for tier1
        }
      }
      // Check tier2 categories - be more flexible with matching
      else if (category.type === 'tier2') {
        if (categoryName.includes('foundation') || categoryName === 'foundation') {
          color = theme.colors.foundation;
        } else if (categoryName.includes('framing') || categoryName === 'framing') {
          color = theme.colors.framing;
        } else if (categoryName.includes('electric') || categoryName === 'electrical') {
          color = theme.colors.electrical;
        } else if (categoryName.includes('plumbing') || categoryName === 'plumbing') {
          color = theme.colors.plumbing;
        } else if (categoryName.includes('hvac') || categoryName === 'hvac') {
          color = theme.colors.hvac;
        } else if (categoryName.includes('drywall') || categoryName === 'drywall') {
          color = theme.colors.drywall;
        } else if (categoryName.includes('insulation') || categoryName === 'insulation') {
          color = theme.colors.insulation;
        } else if (categoryName.includes('window') || categoryName === 'windows') {
          color = theme.colors.windows;
        } else if (categoryName.includes('door') || categoryName === 'doors') {
          color = theme.colors.doors;
        } else if (categoryName.includes('cabinet') || categoryName === 'cabinets') {
          color = theme.colors.doors; // Use doors color for cabinets
        } else if (categoryName.includes('fixture') || categoryName === 'fixtures') {
          color = theme.colors.windows; // Use windows color for fixtures
        } else if (categoryName.includes('lumber') || categoryName === 'lumber') {
          color = theme.colors.framing; // Use framing color for lumber
        } else if (categoryName.includes('roof') || categoryName === 'roofing') {
          color = theme.colors.framing; // Use framing color for roofing
        } else if (categoryName.includes('siding') || categoryName === 'siding') {
          color = theme.colors.insulation; // Use insulation color for siding
        } else {
          // Fall back to parent category color if no specific match
          if (category.parentId) {
            const parentCategory = categories.find((c: TemplateCategory) => c.id === category.parentId);
            if (parentCategory) {
              const parentName = parentCategory.name.toLowerCase();
              if (parentName.includes('structural') || parentName === 'structural') {
                color = theme.colors.structural;
              } else if (parentName.includes('system') || parentName === 'systems') {
                color = theme.colors.systems;
              } else if (parentName.includes('sheath') || parentName === 'sheathing') {
                color = theme.colors.sheathing;
              } else if (parentName.includes('finish') || parentName === 'finishings') {
                color = theme.colors.finishings;
              } else {
                color = theme.colors.structural; // Default fallback
              }
            }
          } else {
            // Use a default tier2 color
            color = theme.colors.foundation;
          }
        }
      }
      
      newThemeColors[category.id.toString()] = color;
    });
    
    setThemeColors(newThemeColors);
    setCurrentThemeName(theme.name);
    
    // Debug: log how many categories were themed
    const themedCount = Object.keys(newThemeColors).length;
    console.log(`Applied ${theme.name} theme to ${themedCount} categories:`, newThemeColors);
    
    toast({ 
      title: "Predefined theme applied", 
      description: `${theme.name} theme has been applied to all ${themedCount} categories`,
      variant: "default" 
    });
  };

  const getParentName = (parentId: number | null) => {
    if (!parentId) return "None";
    const parent = categories.find((c: TemplateCategory) => c.id === parentId);
    return parent ? parent.name : "Unknown";
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Task Categories</h3>
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { resetForm(); setOpenCreateDialog(true); }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category for organizing task templates
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter category name"
                    value={formValues.name}
                    onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Category Type</Label>
                  <Select
                    value={formValues.type}
                    onValueChange={(value: 'tier1' | 'tier2') => {
                      setFormValues({ 
                        ...formValues, 
                        type: value,
                        // Reset parentId if switching to tier1
                        parentId: value === 'tier1' ? null : formValues.parentId
                      });
                    }}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier1">Tier 1 (Main Category)</SelectItem>
                      <SelectItem value="tier2">Tier 2 (Sub-Category)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formValues.type === 'tier2' && (
                  <div className="grid gap-2">
                    <Label htmlFor="parentId">Parent Category</Label>
                    <Select
                      value={formValues.parentId?.toString() || ""}
                      onValueChange={(value) => {
                        setFormValues({ 
                          ...formValues, 
                          parentId: value ? parseInt(value) : null 
                        });
                      }}
                    >
                      <SelectTrigger id="parentId">
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        {tier1Categories.map((cat: TemplateCategory) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <ColorPicker
                    label="Category Color"
                    value={formValues.color || "#6366f1"}
                    onChange={(color) => setFormValues({ ...formValues, color })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a color to identify this category in the dashboard
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hierarchical Category View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Category Hierarchy</CardTitle>
              <CardDescription>Task categories and their sub-categories</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenThemeDialog(true)}
              className="flex items-center gap-2"
            >
              <Palette className="h-4 w-4" />
              Theme Colors
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tier1Categories.length === 0 ? (
            <div className="text-center p-4 border rounded-md bg-muted/50">
              No categories found. Add your first category with the button above.
            </div>
          ) : (
            <div className="space-y-4">
              {tier1Categories.map((tier1Category: TemplateCategory) => {
                const relatedTier2Categories = tier2Categories.filter(
                  (c: TemplateCategory) => c.parentId === tier1Category.id
                );
                
                return (
                  <div key={`${tier1Category.id}-${refreshKey}`} className="border rounded-md overflow-hidden">
                    <div className="bg-muted/50 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-5 h-5 rounded-md shadow-sm flex-shrink-0" 
                          style={{ 
                            backgroundColor: tier1Category.color || "#6366f1"
                          }}
                        />
                        <div>
                          <h3 className="text-lg font-semibold">{tier1Category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {relatedTier2Categories.length} sub-categories
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(tier1Category)}
                          className="flex items-center gap-1"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(tier1Category)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {relatedTier2Categories.length > 0 && (
                      <div className="p-2">
                        <h4 className="text-sm font-medium mb-2 px-2">Sub-categories</h4>
                        <div className="space-y-1">
                          {relatedTier2Categories.map((tier2Category: TemplateCategory) => (
                            <div 
                              key={tier2Category.id} 
                              className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50"
                            >
                              <div className="flex items-center gap-2 pl-3">
                                <div 
                                  className="w-3 h-3 rounded-sm shadow-sm flex-shrink-0" 
                                  style={{ 
                                    backgroundColor: tier2Category.color || "#6366f1"
                                  }}
                                />
                                <div className="font-medium">{tier2Category.name}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(tier2Category)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(tier2Category)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter category name"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Category Type</Label>
                <Select
                  value={formValues.type}
                  onValueChange={(value: 'tier1' | 'tier2') => {
                    setFormValues({ 
                      ...formValues, 
                      type: value,
                      parentId: value === 'tier1' ? null : formValues.parentId 
                    });
                  }}
                  disabled={true} // Type cannot be changed after creation
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier1">Tier 1 (Main Category)</SelectItem>
                    <SelectItem value="tier2">Tier 2 (Sub-Category)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formValues.type === 'tier2' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-parentId">Parent Category</Label>
                  <Select
                    value={formValues.parentId?.toString() || ""}
                    onValueChange={(value) => {
                      setFormValues({ 
                        ...formValues, 
                        parentId: value ? parseInt(value) : null 
                      });
                    }}
                  >
                    <SelectTrigger id="edit-parentId">
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {tier1Categories.map((cat: TemplateCategory) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <ColorPicker
                  label="Category Color"
                  value={formValues.color || "#6366f1"}
                  onChange={(color) => setFormValues({ ...formValues, color })}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a color to identify this category in the dashboard
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the category <strong>{currentCategory?.name}</strong>{" "}
              {currentCategory?.type === 'tier1' && 
                'and all its sub-categories. All associated task templates will also be deleted.'}
              {currentCategory?.type === 'tier2' && 
                'and all associated task templates.'}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Theme Colors Dialog */}
      <Dialog open={openThemeDialog} onOpenChange={setOpenThemeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Theme Colors</DialogTitle>
            <DialogDescription>
              {projectId ? `Customize colors for all categories and subcategories in this project` : 'Select a project to manage theme colors'}
            </DialogDescription>
          </DialogHeader>
          
          {!projectId ? (
            <div className="text-center p-8 text-muted-foreground">
              Please select a specific project to manage theme colors.
            </div>
          ) : (
            <form onSubmit={handleThemeSubmit}>
              {/* Predefined Themes Section */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/10">
                <h4 className="font-medium mb-3">Predefined Themes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 max-h-80 overflow-y-auto">
                  {Object.entries(PREDEFINED_THEMES).map(([themeKey, theme]) => (
                    <Card 
                      key={themeKey}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        currentThemeName === theme.name 
                          ? 'ring-2 ring-primary shadow-lg border-primary/50' 
                          : 'hover:border-primary/30'
                      }`}
                      onClick={() => applyPredefinedTheme(themeKey)}
                    >
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{theme.name}</CardTitle>
                        <CardDescription className="text-xs">{theme.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="flex gap-1">
                          <div 
                            className="w-4 h-4 rounded border border-white/20" 
                            style={{ backgroundColor: theme.colors.structural }}
                            title="Structural"
                          />
                          <div 
                            className="w-4 h-4 rounded border border-white/20" 
                            style={{ backgroundColor: theme.colors.systems }}
                            title="Systems"
                          />
                          <div 
                            className="w-4 h-4 rounded border border-white/20" 
                            style={{ backgroundColor: theme.colors.sheathing }}
                            title="Sheathing"
                          />
                          <div 
                            className="w-4 h-4 rounded border border-white/20" 
                            style={{ backgroundColor: theme.colors.finishings }}
                            title="Finishings"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Saved Themes Section */}
              {Object.keys(savedThemes).length > 0 && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-medium mb-3">Saved Themes</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.keys(savedThemes).map((themeName) => (
                      <div key={themeName} className="flex items-center gap-2 p-2 border rounded-md bg-background">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => loadTheme(themeName)}
                          className={currentThemeName === themeName ? "bg-primary text-primary-foreground" : ""}
                        >
                          {themeName}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTheme(themeName)}
                          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Save New Theme */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter theme name..."
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={saveTheme}
                      disabled={!newThemeName.trim()}
                    >
                      Save Current
                    </Button>
                  </div>
                </div>
              )}
              
              {/* No saved themes - show save option */}
              {Object.keys(savedThemes).length === 0 && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-medium mb-3">Save Theme</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter theme name..."
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={saveTheme}
                      disabled={!newThemeName.trim()}
                    >
                      Save Current
                    </Button>
                  </div>
                </div>
              )}

              <div className="max-h-96 overflow-y-auto space-y-4 py-4">
                {/* Tier 1 Categories */}
                <div>
                  <h4 className="font-medium mb-3">Main Categories</h4>
                  <div className="space-y-3">
                    {tier1Categories.map((category: TemplateCategory) => (
                      <div key={category.id} className="flex items-center gap-3 p-2 rounded-md border">
                        <ColorPicker
                          value={themeColors[category.id.toString()] || category.color || "#6366f1"}
                          onChange={(color) => handleThemeColorChange(category.id.toString(), color)}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tier 2 Categories */}
                {tier2Categories.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Sub-Categories</h4>
                    <div className="space-y-3">
                      {tier2Categories.map((category: TemplateCategory) => {
                        const parentCategory = tier1Categories.find((c: TemplateCategory) => c.id === category.parentId);
                        return (
                          <div key={category.id} className="flex items-center gap-3 p-2 rounded-md border">
                            <ColorPicker
                              value={themeColors[category.id.toString()] || category.color || "#6366f1"}
                              onChange={(color) => handleThemeColorChange(category.id.toString(), color)}
                            />
                            <div>
                              <span className="font-medium">{category.name}</span>
                              {parentCategory && (
                                <div className="text-xs text-muted-foreground">
                                  under {parentCategory.name}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpenThemeDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={themeUpdateMutation.isPending}>
                  {themeUpdateMutation.isPending ? "Updating..." : "Apply Theme"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}