import { Layout } from "@/components/layout/Layout";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";

export default function MaterialsPage() {
  return (
    <Layout title="Materials & Inventory">
      <TaskMaterialsView />
    </Layout>
  );
}