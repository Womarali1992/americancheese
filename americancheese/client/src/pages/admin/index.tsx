import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Settings, Layers, PaintBucket, Home, AlertCircle, Sparkles, Package, Palette, TableProperties, Eye, ToggleLeft, Key } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CategoryOrderManager from "@/components/admin/CategoryOrderManager";
import ProjectSelector from "@/components/admin/project-selector";
import { ThemeAvailability } from "@/components/admin/ThemeAvailability";
import { PresetAvailability } from "@/components/admin/PresetAvailability";
import TaskCatalogTable from "@/components/admin/TaskCatalogTable";

export default function AdminPage() {
  const [, navigate] = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("categories");

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
            
            <div className="flex gap-2">
              <Button asChild variant="outline" className="shadow-sm hover:shadow-md transition-all">
                <Link href="/settings">
                  <Key className="w-4 h-4 mr-2" />
                  API Tokens
                </Link>
              </Button>
              <Button asChild variant="outline" className="shadow-sm hover:shadow-md transition-all">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Global Theme & Preset Settings Section */}
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md transition-all">
            <Tabs defaultValue="theme-availability" className="w-full">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                    <PaintBucket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Global Settings</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage themes and presets available across all projects
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b bg-muted/20 px-6">
                <TabsList className="bg-transparent h-auto p-0 gap-2">
                  <TabsTrigger
                    value="theme-availability"
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <Eye className="w-4 h-4" />
                    Theme Availability
                  </TabsTrigger>
                  <TabsTrigger
                    value="preset-availability"
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <ToggleLeft className="w-4 h-4" />
                    Preset Availability
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="theme-availability" className="m-0">
                  <ThemeAvailability />
                </TabsContent>

                <TabsContent value="preset-availability" className="m-0">
                  <PresetAvailability />
                </TabsContent>
              </div>
            </Tabs>
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

          {/* Management Sections - Only show when project is selected */}
          {selectedProjectId && (
            <div className="bg-card/50 backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md transition-all">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b bg-muted/20 rounded-t-2xl">
                <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-2">
                  <TabsTrigger
                    value="categories"
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl"
                  >
                    <Layers className="w-4 h-4" />
                    Categories
                  </TabsTrigger>
                  <TabsTrigger
                    value="catalog"
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl"
                  >
                    <TableProperties className="w-4 h-4" />
                    Catalog
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
                          Organize your project categories and subcategories with custom ordering
                        </p>
                      </div>
                    </div>

                    {selectedProjectId ? (
                      <CategoryOrderManager projectId={selectedProjectId} />
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

                <TabsContent value="catalog" className="space-y-0 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <TableProperties className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Task Catalog</h3>
                        <p className="text-sm text-muted-foreground">
                          Browse and search all task templates with categories and subcategories
                        </p>
                      </div>
                    </div>

                    {!selectedProjectId ? (
                      <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
                        <TableProperties className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Project Selected</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Please select a project above to view its task catalog with categories and subcategories
                        </p>
                      </div>
                    ) : (
                      <TaskCatalogTable projectId={selectedProjectId} />
                    )}
                  </div>
                </TabsContent>

              </div>
            </Tabs>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}