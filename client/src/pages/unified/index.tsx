import React from "react";
import { Layout } from "@/components/layout/Layout";
import { DashboardSection } from "./sections/DashboardSection";
import { TasksSection } from "./sections/TasksSection";
import { MaterialsSection } from "./sections/MaterialsSection";
import { ContactsSection } from "./sections/ContactsSection";

export default function UnifiedPage() {
  return (
    <Layout unified={true} title="Project Management">
      {/* Dashboard Section */}
      <section id="dashboard" className="min-h-screen scroll-mt-16">
        <DashboardSection />
      </section>

      {/* Tasks Section */}
      <section id="tasks" className="min-h-screen scroll-mt-16">
        <TasksSection />
      </section>

      {/* Materials Section */}
      <section id="materials" className="min-h-screen scroll-mt-16">
        <MaterialsSection />
      </section>

      {/* Contacts Section */}
      <section id="contacts" className="min-h-screen scroll-mt-16">
        <ContactsSection />
      </section>
    </Layout>
  );
}