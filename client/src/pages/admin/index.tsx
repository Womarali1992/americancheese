import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Layers, PaintBucket, Home, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CategoryNameManager from "@/components/admin/CategoryNameManager";
import SimplifiedCategoryManager from "@/components/admin/SimplifiedCategoryManager";
import ProjectCategorySettings from "@/components/admin/ProjectCategorySettings";
import TemplateManager from "@/components/admin/template-manager";
import ProjectSelector from "@/components/admin/project-selector";
import ThemeSelector from "@/components/admin/ThemeSelector";
import { useToast } from "@/hooks/use-toast";
// Theme utilities
const EARTH_TONE_THEME = {
  name: "Earth Tone",
  description: "Natural earth tones for construction projects",
  tier1: {
    structural: "#556b2f",
    systems: "#445566", 
    sheathing: "#9b2c2c",
    finishings: "#8b4513"
  },
  tier2: {}
};

interface ColorTheme {
  name: string;
  tier1: {
    structural: string;
    systems: string;
    sheathing: string;
    finishings: string;
  };
  tier2: {
    [key: string]: string;
  };
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(EARTH_TONE_THEME);

  useEffect(() => {
    const storedTheme = localStorage.getItem('selectedTheme');
    if (storedTheme) {
      try {
        const theme = JSON.parse(storedTheme);
        setSelectedTheme(theme);
      } catch (error) {
        console.error('Error parsing stored theme:', error);
      }
    }
  }, []);

  const handleThemeChange = (theme: ColorTheme) => {
    setSelectedTheme(theme);
    localStorage.setItem('selectedTheme', JSON.stringify(theme));
    
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(theme.tier1).forEach(([key, color]) => {
      root.style.setProperty(`--color-${key}`, color);
    });
    
    toast({
      title: "Theme Updated",
      description: `Successfully applied ${theme.name} theme.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Admin Panel
                </h1>
                <p className="text-muted-foreground mt-1">
                  Configure project categories, templates, and theme settings
                </p>
              </div>
            </div>
            
            <Button asChild variant="outline" className="shadow-sm hover:shadow-md transition-all">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Global Theme Section */}
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                <PaintBucket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Global Theme Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Choose colors that will be applied across all projects
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(selectedTheme.tier1).map(([key, color]) => (
                    <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm font-medium capitalize">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <ThemeSelector
                  onThemeSelect={handleThemeChange}
                  currentTheme={selectedTheme}
                />
              </div>
            </div>
          </div>

          {/* Project Configuration Section */}
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Project Configuration</h2>
                <p className="text-sm text-muted-foreground">
                  Select a project to manage its specific settings
                </p>
              </div>
            </div>

            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <strong>Important:</strong> Changes will only affect the selected project and won't impact other projects.
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted/30 rounded-xl p-4 border border-dashed">
              <ProjectSelector 
                onChange={setSelectedProjectId}
                value={selectedProjectId}
              />
            </div>
          </div>

          {/* Management Sections */}
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md transition-all">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b bg-muted/20 rounded-t-2xl">
                <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-2">
                  <TabsTrigger 
                    value="categories" 
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl"
                  >
                    <Layers className="w-4 h-4" />
                    Categories
                  </TabsTrigger>
                  <TabsTrigger 
                    value="templates" 
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl"
                  >
                    <Settings className="w-4 h-4" />
                    Templates
                  </TabsTrigger>
                  <TabsTrigger 
                    value="category-names" 
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl"
                  >
                    <FileText className="w-4 h-4" />
                    Legacy Names
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="categories" className="space-y-0 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Layers className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Category Management</h3>
                        <p className="text-sm text-muted-foreground">
                          Organize your project categories and subcategories
                        </p>
                      </div>
                    </div>

                    {selectedProjectId ? (
                      <ProjectCategorySettings projectId={selectedProjectId} />
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
                        <Layers className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Project Selected</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Please select a project above to manage its categories and organize your workflow
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-0 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Template Management</h3>
                        <p className="text-sm text-muted-foreground">
                          Configure task templates for your project
                        </p>
                      </div>
                    </div>

                    {selectedProjectId ? (
                      <TemplateManager projectId={selectedProjectId} />
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
                        <Settings className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Project Selected</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Please select a project above to manage its templates and automate task creation
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="category-names" className="space-y-0 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Legacy Category Names</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage legacy category name customizations
                        </p>
                      </div>
                    </div>

                    <Alert className="mb-6 bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700">
                        <strong>Legacy Feature:</strong> This manages old localStorage-based category names. 
                        For new projects, use the Category Management tab instead.
                      </AlertDescription>
                    </Alert>
                    
                    <CategoryNameManager />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}