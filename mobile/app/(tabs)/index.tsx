import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { FolderOpen, CheckSquare, TrendingUp, AlertCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiClient } from "@/services/api/client";
import { useThemeStore } from "@/stores/themeStore";
import {
  getProjectColor,
  getStatusStyles,
  getTier1Color,
  hexToRgba,
} from "@/lib/colors";

interface ProjectCardProps {
  project: any;
  onPress: () => void;
}

function DashboardProjectCard({ project, onPress }: ProjectCardProps) {
  const projectColor = getProjectColor(project.id);
  const statusStyles = getStatusStyles(project.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.projectCardContainer}
    >
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.98)',
          hexToRgba(projectColor, 0.1),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.projectCardGradient}
      >
        <View style={[styles.projectAccentBar, { backgroundColor: projectColor }]} />
        <View style={styles.projectCardContent}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.projectLocation}>{project.location || "No location"}</Text>
          <View style={styles.projectStatusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusStyles.backgroundColor },
              ]}
            >
              <Text style={[styles.statusText, { color: statusStyles.textColor }]}>
                {project.status?.replace("_", " ").toUpperCase() || "ACTIVE"}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

interface TaskCardProps {
  task: any;
  onPress: () => void;
}

function DashboardTaskCard({ task, onPress }: TaskCardProps) {
  const categoryColor = getTier1Color(task.tier1Category);
  const statusStyles = getStatusStyles(task.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.taskCardContainer}
    >
      <View style={[styles.taskAccentBar, { backgroundColor: categoryColor }]} />
      <View style={styles.taskCardContent}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={styles.taskBadgeRow}>
          {task.tier1Category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: hexToRgba(categoryColor, 0.15) },
              ]}
            >
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {task.tier1Category}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyles.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyles.textColor }]}>
              {task.status?.replace("_", " ").toUpperCase() || "PENDING"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { loadTheme } = useThemeStore();

  // Load theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.get("/api/projects"),
  });

  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiClient.get("/api/tasks"),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProjects(), refetchTasks()]);
    setRefreshing(false);
  };

  const projectCount = projects?.length ?? 0;
  const taskCount = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((t: any) => t.status === "completed").length ?? 0;
  const activeTasks = tasks?.filter((t: any) => t.status === "in_progress").length ?? 0;

  const recentProjects = projects?.slice(0, 3) ?? [];
  const recentTasks = tasks?.slice(0, 5) ?? [];

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {/* Welcome Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
            <Text className="text-gray-500 mt-1">Welcome back to SiteSetups</Text>
          </View>

          {/* Stats Cards */}
          <View className="flex-row flex-wrap gap-3 mb-6">
            <TouchableOpacity
              className="flex-1 min-w-[45%] bg-white p-4 rounded-xl shadow-sm border border-gray-100"
              onPress={() => router.push("/(tabs)/projects")}
            >
              <View className="flex-row items-center justify-between mb-2">
                <FolderOpen color="#2563eb" size={24} />
                <Text className="text-2xl font-bold text-gray-900">{projectCount}</Text>
              </View>
              <Text className="text-gray-500 text-sm">Projects</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 min-w-[45%] bg-white p-4 rounded-xl shadow-sm border border-gray-100"
              onPress={() => router.push("/(tabs)/tasks")}
            >
              <View className="flex-row items-center justify-between mb-2">
                <CheckSquare color="#22c55e" size={24} />
                <Text className="text-2xl font-bold text-gray-900">{taskCount}</Text>
              </View>
              <Text className="text-gray-500 text-sm">Total Tasks</Text>
            </TouchableOpacity>

            <View className="flex-1 min-w-[45%] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <TrendingUp color="#f59e0b" size={24} />
                <Text className="text-2xl font-bold text-gray-900">{activeTasks}</Text>
              </View>
              <Text className="text-gray-500 text-sm">In Progress</Text>
            </View>

            <View className="flex-1 min-w-[45%] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <AlertCircle color="#a855f7" size={24} />
                <Text className="text-2xl font-bold text-gray-900">{completedTasks}</Text>
              </View>
              <Text className="text-gray-500 text-sm">Completed</Text>
            </View>
          </View>

          {/* Recent Projects */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-900">Recent Projects</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/projects")}>
                <Text className="text-primary text-sm">See All</Text>
              </TouchableOpacity>
            </View>

            {recentProjects.length === 0 ? (
              <View className="bg-white p-6 rounded-xl border border-gray-100 items-center">
                <FolderOpen color="#9ca3af" size={32} />
                <Text className="text-gray-500 mt-2">No projects yet</Text>
              </View>
            ) : (
              recentProjects.map((project: any) => (
                <DashboardProjectCard
                  key={project.id}
                  project={project}
                  onPress={() => router.push(`/(tabs)/projects/${project.id}`)}
                />
              ))
            )}
          </View>

          {/* Recent Tasks */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-900">Recent Tasks</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/tasks")}>
                <Text className="text-primary text-sm">See All</Text>
              </TouchableOpacity>
            </View>

            {recentTasks.length === 0 ? (
              <View className="bg-white p-6 rounded-xl border border-gray-100 items-center">
                <CheckSquare color="#9ca3af" size={32} />
                <Text className="text-gray-500 mt-2">No tasks yet</Text>
              </View>
            ) : (
              recentTasks.map((task: any) => (
                <DashboardTaskCard
                  key={task.id}
                  task={task}
                  onPress={() => router.push(`/(tabs)/tasks/${task.id}`)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Project card styles
  projectCardContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  projectCardGradient: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  projectAccentBar: {
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  projectCardContent: {
    flex: 1,
    padding: 14,
  },
  projectName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  projectLocation: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  projectStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  // Task card styles
  taskCardContainer: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  taskAccentBar: {
    width: 4,
  },
  taskCardContent: {
    flex: 1,
    padding: 14,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  taskBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  // Shared badge styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
