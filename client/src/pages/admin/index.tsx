import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Layers, PaintBucket } from 'lucide-react';
import PageTitle from "@/components/layout/page-title";
import CategoryManager from "@/components/admin/category-manager";
import TemplateManager from "@/components/admin/template-manager";
import ProjectSelector from "@/components/admin/project-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import ThemeSelector from "@/components/admin/ThemeSelector";
import { useToast } from "@/hooks/use-toast";
import { 
  EARTH_TONE_THEME, 
  PASTEL_THEME, 
  FUTURISTIC_THEME,
  CLASSIC_CONSTRUCTION_THEME,
  VIBRANT_THEME,
  ColorTheme 
} from "@/lib/color-themes";
import { applyThemeColors } from "@/lib/theme-utils";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [location, setLocation] = useLocation();
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(EARTH_TONE_THEME);
  const { toast } = useToast();
  
  // Load the saved theme from localStorage on component mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('colorTheme');
      if (savedTheme) {
        // Map the saved theme name to the actual theme object
        if (savedTheme === 'earth-tone') setSelectedTheme(EARTH_TONE_THEME);
        else if (savedTheme === 'pastel') setSelectedTheme(PASTEL_THEME);
        else if (savedTheme === 'futuristic') setSelectedTheme(FUTURISTIC_THEME);
        else if (savedTheme === 'classic-construction') setSelectedTheme(CLASSIC_CONSTRUCTION_THEME);
        else if (savedTheme === 'vibrant') setSelectedTheme(VIBRANT_THEME);
      }
    } catch (error) {
      console.error("Failed to load theme from localStorage:", error);
    }
  }, []);
  
  // Handle theme change
  const handleThemeChange = (theme: ColorTheme) => {
    setSelectedTheme(theme);
    
    // Apply the theme directly
    applyThemeColors(theme);
    
    toast({
      title: "Theme Updated",
      description: `Applied the ${theme.name} theme to all categories.`,
    });
  };
  
  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId);
    
    // Navigate to the project templates page
    if (projectId) {
      setLocation(`/admin/project-templates/${projectId}`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <PageTitle 
        title="Admin Settings" 
        icon={<Settings className="w-6 h-6" />}
        description="Configure project categories, templates, and theme settings."
      />
      
      <div className="mt-8">
        {/* Global Theme Section */}
        <div className="bg-slate-50 p-6 rounded-lg mb-8 border">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <PaintBucket className="w-5 h-5 mr-2 text-orange-500" />
            Color Theme Settings
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Choose a color theme that will be applied across all projects. This affects how construction categories
            are displayed throughout the application.
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap max-w-lg">
              {Object.entries(selectedTheme.tier1).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs capitalize">{key}</span>
                </div>
              ))}
            </div>
            
            <ThemeSelector
              onThemeSelect={handleThemeChange}
              currentTheme={selectedTheme}
            />
          </div>
        </div>
      
        {/* Project selector at the top level */}
        <h2 className="text-xl font-semibold mb-4">Project Configuration</h2>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Select a project to configure its templates, or use the tabs below to manage global categories.
          </AlertDescription>
        </Alert>
        
        <div className="mb-6">
          <ProjectSelector 
            onSelect={handleProjectSelect}
            selectedId={selectedProjectId}
          />
        </div>
        
        {/* Tabs for different admin sections */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="categories" className="flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-4">
            <CategoryManager />
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <TemplateManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}