import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ResourcesTab } from "@/components/project/ResourcesTab";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MaterialsPage() {
  const [activeView, setActiveView] = useState<string>("tasks");
  
  return (
    <Layout title="Materials & Inventory">
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="tasks" className="text-base">Task View</TabsTrigger>
          <TabsTrigger value="inventory" className="text-base">Inventory View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <TaskMaterialsView />
        </TabsContent>
        
        <TabsContent value="inventory">
          <ResourcesTab />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}