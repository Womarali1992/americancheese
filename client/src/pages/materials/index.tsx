import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ResourcesTab } from "@/components/project/ResourcesTab";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";
import { Button } from "@/components/ui/button";
import { Package, ListChecks } from "lucide-react";

export default function MaterialsPage() {
  const [activeView, setActiveView] = useState<"tasks" | "inventory">("tasks");
  
  return (
    <Layout title="Materials & Inventory">
      <div className="mb-6 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <Button
            variant={activeView === "tasks" ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-1 rounded-l-md rounded-r-none px-3 ${
              activeView === "tasks" ? "bg-orange-500 hover:bg-orange-600" : ""
            }`}
            onClick={() => setActiveView("tasks")}
          >
            <ListChecks className="h-4 w-4" />
            Task View
          </Button>
          <Button
            variant={activeView === "inventory" ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-1 rounded-r-md rounded-l-none px-3 ${
              activeView === "inventory" ? "bg-orange-500 hover:bg-orange-600" : ""
            }`}
            onClick={() => setActiveView("inventory")}
          >
            <Package className="h-4 w-4" />
            Inventory View
          </Button>
        </div>
      </div>
      
      {activeView === "tasks" ? (
        <TaskMaterialsView />
      ) : (
        <ResourcesTab />
      )}
    </Layout>
  );
}