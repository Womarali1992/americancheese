import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building, CheckSquare, Calendar, Package, Users } from "lucide-react";
import { useNav } from "@/contexts/NavContext";
import type { NavPillData } from "@/contexts/NavContext";

type ActivePill = "projects" | "tasks" | "events" | "materials" | "contacts";

/**
 * Shared hook that injects nav pills into TopNav via NavContext.
 * Each page calls this with its own `activePill` id.
 * Fetches counts for all 5 sections. No cleanup on unmount to prevent
 * flash when switching between pages (new page overwrites pills immediately).
 */
export function useNavPills(activePill: ActivePill) {
  const { setPills } = useNav();

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ["/api/materials"],
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });

  const openTasks = useMemo(
    () => tasks.filter((t: any) => !t.completed).length,
    [tasks]
  );

  const pendingMaterials = useMemo(
    () => materials.filter((m: any) => m.status === "ordered").length,
    [materials]
  );

  const upcomingEventsCount = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks.filter((t: any) => {
      if (t.completed) return false;
      const end = t.endDate ? new Date(t.endDate) : null;
      return end && end >= now && end <= weekFromNow;
    }).length;
  }, [tasks]);

  useEffect(() => {
    const pillData: NavPillData[] = [
      { id: "projects", icon: Building, count: projects.length, label: "Projects", navigateTo: "/", color: "#6366f1", isActive: activePill === "projects" },
      { id: "tasks", icon: CheckSquare, count: openTasks, label: "Tasks", navigateTo: "/tasks", color: "#22c55e", isActive: activePill === "tasks" },
      { id: "events", icon: Calendar, count: upcomingEventsCount, label: "Events", navigateTo: "/calendar", color: "#06b6d4", isActive: activePill === "events" },
      { id: "materials", icon: Package, count: pendingMaterials, label: "Materials", navigateTo: "/materials", color: "#f97316", isActive: activePill === "materials" },
      { id: "contacts", icon: Users, count: contacts.length, label: "Contacts", navigateTo: "/contacts", color: "#64748b", isActive: activePill === "contacts" },
    ];
    setPills(pillData);
  }, [activePill, projects.length, openTasks, upcomingEventsCount, pendingMaterials, contacts.length, setPills]);
}
