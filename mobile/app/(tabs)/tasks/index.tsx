import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, ChevronRight, CheckCircle2, Circle, Clock } from "lucide-react-native";
import { apiClient } from "@/services/api/client";

export default function TasksScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: tasks, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiClient.get("/api/tasks"),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredTasks = (tasks ?? []).filter((task: any) => {
    const matchesSearch = !searchQuery ||
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group tasks by tier1 category
  const groupedTasks = filteredTasks.reduce((acc: any, task: any) => {
    const category = task.tier1Category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {});

  const statusFilters = [
    { label: "All", value: null },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 color="#22c55e" size={20} />;
      case "in_progress":
        return <Clock color="#3b82f6" size={20} />;
      default:
        return <Circle color="#9ca3af" size={20} />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      structural: "bg-blue-500",
      systems: "bg-green-500",
      sheathing: "bg-amber-500",
      finishings: "bg-purple-500",
      permitting: "bg-indigo-500",
    };
    return colors[category?.toLowerCase()] || "bg-gray-500";
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      {/* Search and Filter */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Search color="#9ca3af" size={20} />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search tasks..."
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
          {Object.keys(groupedTasks).length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-gray-500 text-center">
                {searchQuery ? "No tasks match your search" : "No tasks yet"}
              </Text>
            </View>
          ) : (
            Object.entries(groupedTasks).map(([category, categoryTasks]: [string, any]) => (
              <View key={category} className="mb-6">
                {/* Category Header */}
                <View className="flex-row items-center mb-3">
                  <View className={`w-3 h-3 rounded-full mr-2 ${getCategoryColor(category)}`} />
                  <Text className="font-semibold text-gray-900 capitalize">{category}</Text>
                  <Text className="text-gray-500 ml-2">({categoryTasks.length})</Text>
                </View>

                {/* Tasks in category */}
                {categoryTasks.map((task: any) => (
                  <TouchableOpacity
                    key={task.id}
                    className="bg-white p-4 rounded-xl mb-2 border border-gray-100 flex-row items-center"
                    onPress={() => router.push(`/(tabs)/tasks/${task.id}`)}
                  >
                    {getStatusIcon(task.status)}
                    <View className="flex-1 ml-3">
                      <Text className={`font-medium ${
                        task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"
                      }`}>
                        {task.title}
                      </Text>
                      <View className="flex-row items-center mt-1 gap-2">
                        {task.tier2Category && (
                          <Text className="text-xs text-gray-500">{task.tier2Category}</Text>
                        )}
                        {task.startDate && (
                          <Text className="text-xs text-gray-400">
                            {new Date(task.startDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    <ChevronRight color="#9ca3af" size={20} />
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB for creating new task */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        onPress={() => {/* TODO: Open create task modal */}}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
