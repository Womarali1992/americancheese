import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { InvoiceManager } from "@/components/invoices/InvoiceManager";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function InvoicesPage() {
  const [, setLocation] = useLocation();
  const [projectId, setProjectId] = useState<number | undefined>(undefined);

  // Fetch projects for the breadcrumb/header
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const handleProjectChange = (selectedId: string) => {
    if (selectedId === "all") {
      setProjectId(undefined);
    } else {
      setProjectId(Number(selectedId));
    }
  };

  // Get project name for selected project
  const getProjectName = (id: number) => {
    const project = projects.find(p => p.id === id);
    return project ? project.name : "Unknown Project";
  };

  return (
    <Layout title="Invoices">
      <div className="space-y-4 p-4">
        {/* Header Section */}
        <div className="bg-white border-2 border-blue-500 rounded-lg shadow-sm">
          <div className="flex justify-between items-center p-3 sm:p-4 bg-blue-50 rounded-t-lg">
            <div className="flex items-center gap-4 flex-1">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Invoices</h1>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {/* Project selector on desktop */}
              <div className="w-[180px]">
                <ProjectSelector 
                  selectedProjectId={projectId} 
                  onChange={handleProjectChange}
                  className="bg-transparent border-0 rounded-none focus:ring-0"
                  theme="blue"
                />
              </div>
              
              {/* Show All Projects button on desktop only when a project is selected */}
              {projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-blue-50 text-blue-600 hover:text-blue-700 hover:bg-blue-100 border-2 border-blue-500 shadow-sm h-9"
                  onClick={() => handleProjectChange("all")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Projects
                </Button>
              )}
            </div>
          </div>
          
          {/* Project selector on mobile */}
          <div className="px-3 pb-3 flex flex-col gap-2 sm:hidden">
            <div className="w-full">
              <ProjectSelector 
                selectedProjectId={projectId} 
                onChange={handleProjectChange}
                className="w-full bg-transparent border-0 rounded-none focus:ring-0"
                theme="blue"
              />
            </div>
            {/* Show All Projects button on mobile only when a project is selected */}
            {projectId && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-blue-50 text-blue-600 hover:text-blue-700 hover:bg-blue-100 border-blue-300 shadow-sm mt-2 w-full"
                onClick={() => handleProjectChange("all")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Projects
              </Button>
            )}
          </div>
        </div>
        
        {/* Show selected project banner if a project is selected */}
        {projectId && (
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <div className="flex justify-between items-start">
                <div className="flex items-start flex-1">
                  <div className="h-full w-1 rounded-full bg-blue-500 mr-3 self-stretch"></div>
                  <div className="flex-1">
                    <div className="mb-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-800">{getProjectName(projectId)}</h3>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center text-sm text-slate-700 font-medium">
                        <Receipt className="h-4 w-4 mr-1 text-slate-600" />
                        Invoices for this project
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full hover:bg-white hover:bg-opacity-70"
                    onClick={() => handleProjectChange("all")}
                  >
                    <span className="sr-only">Show all invoices</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invoice Manager Component */}
        <InvoiceManager projectId={projectId} />
      </div>
    </Layout>
  );
}