import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Calendar, CheckSquare, Package, Users, ChevronRight } from "lucide-react-native";
import { apiClient } from "@/services/api/client";

type TabType = "tasks" | "resources" | "budget";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("tasks");

  const { data: project, refetch: refetchProject } = useQuery({
    queryKey: ["project", id],
    queryFn: () => apiClient.get(`/api/projects/${id}`),
    enabled: !!id,
  });

  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ["project-tasks", id],
    queryFn: () => apiClient.get(`/api/projects/${id}/tasks`),
    enabled: !!id,
  });

  const { data: materials, refetch: refetchMaterials } = useQuery({
    queryKey: ["project-materials", id],
    queryFn: () => apiClient.get(`/api/projects/${id}/materials`),
    enabled: !!id,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProject(), refetchTasks(), refetchMaterials()]);
    setRefreshing(false);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "tasks", label: "Tasks" },
    { key: "resources", label: "Resources" },
    { key: "budget", label: "Budget" },
  ];

  const completedTasks = tasks?.filter((t: any) => t.status === "completed").length ?? 0;
  const totalTasks = tasks?.length ?? 0;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: project?.name || "Project",
        }}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Project Header */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">{project?.name}</Text>

          <View className="flex-row flex-wrap mt-3 gap-4">
            {project?.location && (
              <View className="flex-row items-center">
                <MapPin color="#6b7280" size={16} />
                <Text className="text-gray-600 ml-1">{project.location}</Text>
              </View>
            )}

            {project?.startDate && (
              <View className="flex-row items-center">
                <Calendar color="#6b7280" size={16} />
                <Text className="text-gray-600 ml-1">
                  {new Date(project.startDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Progress */}
          <View className="mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-500">Overall Progress</Text>
              <Text className="text-sm font-semibold text-gray-900">{project?.progress || 0}%</Text>
            </View>
            <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${project?.progress || 0}%` }}
              />
            </View>
          </View>

          {/* Quick Stats */}
          <View className="flex-row mt-4 gap-3">
            <View className="flex-1 bg-gray-50 p-3 rounded-xl">
              <View className="flex-row items-center">
                <CheckSquare color="#22c55e" size={18} />
                <Text className="ml-2 text-gray-500 text-sm">Tasks</Text>
              </View>
              <Text className="text-lg font-bold mt-1">{completedTasks}/{totalTasks}</Text>
            </View>
            <View className="flex-1 bg-gray-50 p-3 rounded-xl">
              <View className="flex-row items-center">
                <Package color="#f59e0b" size={18} />
                <Text className="ml-2 text-gray-500 text-sm">Materials</Text>
              </View>
              <Text className="text-lg font-bold mt-1">{materials?.length ?? 0}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white border-b border-gray-200">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-4 ${activeTab === tab.key ? "border-b-2 border-primary" : ""}`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text className={`text-center font-medium ${
                activeTab === tab.key ? "text-primary" : "text-gray-500"
              }`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View className="p-4">
          {activeTab === "tasks" && (
            <View>
              {(!tasks || tasks.length === 0) ? (
                <View className="items-center py-8">
                  <CheckSquare color="#9ca3af" size={40} />
                  <Text className="text-gray-500 mt-2">No tasks yet</Text>
                </View>
              ) : (
                tasks.map((task: any) => (
                  <TouchableOpacity
                    key={task.id}
                    className="bg-white p-4 rounded-xl mb-2 border border-gray-100 flex-row items-center"
                    onPress={() => router.push(`/(tabs)/tasks/${task.id}`)}
                  >
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{task.title}</Text>
                      <View className="flex-row items-center mt-2 gap-2">
                        {task.tier1Category && (
                          <View className="px-2 py-1 rounded bg-gray-100">
                            <Text className="text-xs text-gray-600">{task.tier1Category}</Text>
                          </View>
                        )}
                        <View className={`px-2 py-1 rounded ${
                          task.status === "completed" ? "bg-green-100" :
                          task.status === "in_progress" ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          <Text className={`text-xs ${
                            task.status === "completed" ? "text-green-700" :
                            task.status === "in_progress" ? "text-blue-700" : "text-gray-700"
                          }`}>
                            {task.status?.replace("_", " ")}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <ChevronRight color="#9ca3af" size={20} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === "resources" && (
            <View>
              <Text className="font-semibold text-gray-900 mb-3">Materials</Text>
              {(!materials || materials.length === 0) ? (
                <View className="items-center py-8">
                  <Package color="#9ca3af" size={40} />
                  <Text className="text-gray-500 mt-2">No materials yet</Text>
                </View>
              ) : (
                materials.map((material: any) => (
                  <View
                    key={material.id}
                    className="bg-white p-4 rounded-xl mb-2 border border-gray-100"
                  >
                    <Text className="font-medium text-gray-900">{material.name}</Text>
                    <View className="flex-row justify-between mt-2">
                      <Text className="text-gray-500 text-sm">Qty: {material.quantity} {material.unit}</Text>
                      {material.cost && (
                        <Text className="text-gray-900 font-medium">${material.cost}</Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "budget" && (
            <View className="items-center py-8">
              <Text className="text-gray-500">Budget tracking coming soon</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
