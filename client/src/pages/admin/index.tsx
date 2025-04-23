import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageTitle from "@/components/layout/page-title";
import CategoryManager from "@/components/admin/category-manager";
import TemplateManager from "@/components/admin/template-manager";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageTitle 
        title="Admin Panel" 
        subtitle="Manage task templates and categories"
        icon="settings-4-line"
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 w-full justify-start">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="templates">Task Templates</TabsTrigger>
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