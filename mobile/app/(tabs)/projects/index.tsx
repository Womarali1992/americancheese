import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, MapPin, Calendar } from "lucide-react-native";
import { apiClient } from "@/services/api/client";
import CreateProjectModal from "./CreateProjectModal";

export default function ProjectsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.get("/api/projects"),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredProjects = (projects ?? []).filter((project: any) => {
    const matchesSearch = !searchQuery ||
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusFilters = [
    { label: "All", value: null },
    { label: "Active", value: "active" },
    { label: "On Hold", value: "on_hold" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      {/* Search and Filter */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Search color="#9ca3af" size={20} />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search projects..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <View className="flex-row gap-2">
            {statusFilters.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                className={`px-4 py-2 rounded-full ${
                  statusFilter === filter.value ? "bg-primary" : "bg-gray-100"
                }`}
                onPress={() => setStatusFilter(filter.value)}
              >
                <Text className={`font-medium ${
                  statusFilter === filter.value ? "text-white" : "text-gray-700"
                }`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {filteredProjects.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-gray-500 text-center">
                {searchQuery ? "No projects match your search" : "No projects yet"}
              </Text>
            </View>
          ) : (
            filteredProjects.map((project: any) => (
              <TouchableOpacity
                key={project.id}
                className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm"
                onPress={() => router.push(`/(tabs)/projects/${project.id}`)}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 text-lg">{project.name}</Text>

                    {project.location && (
                      <View className="flex-row items-center mt-2">
                        <MapPin color="#9ca3af" size={14} />
                        <Text className="text-gray-500 text-sm ml-1">{project.location}</Text>
                      </View>
                    )}

                    {project.startDate && (
                      <View className="flex-row items-center mt-1">
                        <Calendar color="#9ca3af" size={14} />
                        <Text className="text-gray-500 text-sm ml-1">
                          {new Date(project.startDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className={`px-3 py-1 rounded-full ${
                    project.status === "active" ? "bg-green-100" :
                    project.status === "on_hold" ? "bg-yellow-100" :
                    project.status === "completed" ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      project.status === "active" ? "text-green-700" :
                      project.status === "on_hold" ? "text-yellow-700" :
                      project.status === "completed" ? "text-blue-700" : "text-gray-700"
                    }`}>
                      {project.status?.replace("_", " ").toUpperCase() || "ACTIVE"}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View className="mt-4">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-500">Progress</Text>
                    <Text className="text-xs text-gray-700 font-medium">{project.progress || 0}%</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB for creating new project */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowCreateModal(true)}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

      <CreateProjectModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetch()}
      />
    </SafeAreaView>
  );
}
