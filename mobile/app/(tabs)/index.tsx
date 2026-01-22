import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FolderOpen, CheckSquare, TrendingUp, AlertCircle } from "lucide-react-native";
import { apiClient } from "@/services/api/client";

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

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
                <TouchableOpacity
                  key={project.id}
                  className="bg-white p-4 rounded-xl mb-2 border border-gray-100"
                  onPress={() => router.push(`/(tabs)/projects/${project.id}`)}
                >
                  <Text className="font-medium text-gray-900">{project.name}</Text>
                  <Text className="text-gray-500 text-sm mt-1">{project.location || "No location"}</Text>
                  <View className="flex-row items-center mt-2">
                    <View className={`px-2 py-1 rounded-full ${
                      project.status === "active" ? "bg-green-100" :
                      project.status === "on_hold" ? "bg-yellow-100" :
                      project.status === "completed" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <Text className={`text-xs font-medium ${
                        project.status === "active" ? "text-green-700" :
                        project.status === "on_hold" ? "text-yellow-700" :
                        project.status === "completed" ? "text-blue-700" : "text-gray-700"
                      }`}>
                        {project.status?.replace("_", " ").toUpperCase() || "ACTIVE"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
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
                <TouchableOpacity
                  key={task.id}
                  className="bg-white p-4 rounded-xl mb-2 border border-gray-100"
                  onPress={() => router.push(`/(tabs)/tasks/${task.id}`)}
                >
                  <Text className="font-medium text-gray-900">{task.title}</Text>
                  <View className="flex-row items-center mt-2 gap-2">
                    {task.tier1Category && (
                      <View className="px-2 py-1 rounded-full bg-gray-100">
                        <Text className="text-xs text-gray-600">{task.tier1Category}</Text>
                      </View>
                    )}
                    <View className={`px-2 py-1 rounded-full ${
                      task.status === "completed" ? "bg-green-100" :
                      task.status === "in_progress" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <Text className={`text-xs font-medium ${
                        task.status === "completed" ? "text-green-700" :
                        task.status === "in_progress" ? "text-blue-700" : "text-gray-700"
                      }`}>
                        {task.status?.replace("_", " ").toUpperCase() || "PENDING"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
