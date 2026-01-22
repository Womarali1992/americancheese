import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Calendar, Package, Users, Paperclip, CheckSquare,
  Circle, CheckCircle2, ChevronDown, ChevronUp
} from "lucide-react-native";
import { apiClient } from "@/services/api/client";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);
  const [showMaterials, setShowMaterials] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);

  const { data: task, refetch: refetchTask } = useQuery({
    queryKey: ["task", id],
    queryFn: () => apiClient.get(`/api/tasks/${id}`),
    enabled: !!id,
  });

  const { data: checklist, refetch: refetchChecklist } = useQuery({
    queryKey: ["task-checklist", id],
    queryFn: () => apiClient.get(`/api/tasks/${id}/checklist`),
    enabled: !!id,
  });

  const { data: attachments, refetch: refetchAttachments } = useQuery({
    queryKey: ["task-attachments", id],
    queryFn: () => apiClient.get(`/api/tasks/${id}/attachments`),
    enabled: !!id,
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: number; completed: boolean }) => {
      return apiClient.put(`/api/checklist/${itemId}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-checklist", id] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTask(), refetchChecklist(), refetchAttachments()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const completedItems = checklist?.filter((item: any) => item.completed).length ?? 0;
  const totalItems = checklist?.length ?? 0;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: task?.title || "Task",
        }}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Task Header */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">{task?.title}</Text>

              <View className="flex-row flex-wrap gap-2 mt-3">
                {task?.tier1Category && (
                  <View className="px-3 py-1 rounded-full bg-gray-100">
                    <Text className="text-sm text-gray-700">{task.tier1Category}</Text>
                  </View>
                )}
                {task?.tier2Category && (
                  <View className="px-3 py-1 rounded-full bg-gray-100">
                    <Text className="text-sm text-gray-600">{task.tier2Category}</Text>
                  </View>
                )}
                <View className={`px-3 py-1 rounded-full ${getStatusColor(task?.status)}`}>
                  <Text className="text-sm font-medium">
                    {task?.status?.replace("_", " ").toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Dates */}
          <View className="flex-row gap-4 mt-4">
            {task?.startDate && (
              <View className="flex-row items-center">
                <Calendar color="#6b7280" size={16} />
                <Text className="text-gray-600 ml-2 text-sm">
                  Start: {new Date(task.startDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {task?.endDate && (
              <View className="flex-row items-center">
                <Calendar color="#6b7280" size={16} />
                <Text className="text-gray-600 ml-2 text-sm">
                  End: {new Date(task.endDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {task?.description && (
            <View className="mt-4">
              <Text className="text-gray-700">{task.description}</Text>
            </View>
          )}

          {/* Cost Info */}
          {(task?.estimatedCost || task?.actualCost) && (
            <View className="flex-row gap-4 mt-4 p-3 bg-gray-50 rounded-xl">
              {task?.estimatedCost && (
                <View>
                  <Text className="text-xs text-gray-500">Estimated</Text>
                  <Text className="font-semibold text-gray-900">${task.estimatedCost}</Text>
                </View>
              )}
              {task?.actualCost && (
                <View>
                  <Text className="text-xs text-gray-500">Actual</Text>
                  <Text className="font-semibold text-gray-900">${task.actualCost}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Checklist Section */}
        <View className="bg-white mt-2 border-y border-gray-200">
          <TouchableOpacity
            className="flex-row items-center justify-between p-4"
            onPress={() => setShowChecklist(!showChecklist)}
          >
            <View className="flex-row items-center">
              <CheckSquare color="#6b7280" size={20} />
              <Text className="font-semibold text-gray-900 ml-2">Checklist</Text>
              {totalItems > 0 && (
                <Text className="text-gray-500 ml-2">({completedItems}/{totalItems})</Text>
              )}
            </View>
            {showChecklist ? (
              <ChevronUp color="#6b7280" size={20} />
            ) : (
              <ChevronDown color="#6b7280" size={20} />
            )}
          </TouchableOpacity>

          {showChecklist && (
            <View className="px-4 pb-4">
              {(!checklist || checklist.length === 0) ? (
                <Text className="text-gray-500 text-center py-4">No checklist items</Text>
              ) : (
                checklist.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row items-center py-3 border-b border-gray-100"
                    onPress={() => toggleChecklistMutation.mutate({
                      itemId: item.id,
                      completed: !item.completed
                    })}
                  >
                    {item.completed ? (
                      <CheckCircle2 color="#22c55e" size={24} />
                    ) : (
                      <Circle color="#9ca3af" size={24} />
                    )}
                    <Text className={`flex-1 ml-3 ${
                      item.completed ? "text-gray-400 line-through" : "text-gray-900"
                    }`}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Materials Section */}
        <View className="bg-white mt-2 border-y border-gray-200">
          <TouchableOpacity
            className="flex-row items-center justify-between p-4"
            onPress={() => setShowMaterials(!showMaterials)}
          >
            <View className="flex-row items-center">
              <Package color="#6b7280" size={20} />
              <Text className="font-semibold text-gray-900 ml-2">Materials</Text>
              {task?.materialIds?.length > 0 && (
                <Text className="text-gray-500 ml-2">({task.materialIds.length})</Text>
              )}
            </View>
            {showMaterials ? (
              <ChevronUp color="#6b7280" size={20} />
            ) : (
              <ChevronDown color="#6b7280" size={20} />
            )}
          </TouchableOpacity>

          {showMaterials && (
            <View className="px-4 pb-4">
              {(!task?.materialIds || task.materialIds.length === 0) ? (
                <Text className="text-gray-500 text-center py-4">No materials assigned</Text>
              ) : (
                <Text className="text-gray-500 text-center py-4">
                  {task.materialIds.length} materials assigned
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Attachments Section */}
        <View className="bg-white mt-2 border-y border-gray-200">
          <TouchableOpacity
            className="flex-row items-center justify-between p-4"
            onPress={() => setShowAttachments(!showAttachments)}
          >
            <View className="flex-row items-center">
              <Paperclip color="#6b7280" size={20} />
              <Text className="font-semibold text-gray-900 ml-2">Attachments</Text>
              {attachments?.length > 0 && (
                <Text className="text-gray-500 ml-2">({attachments.length})</Text>
              )}
            </View>
            {showAttachments ? (
              <ChevronUp color="#6b7280" size={20} />
            ) : (
              <ChevronDown color="#6b7280" size={20} />
            )}
          </TouchableOpacity>

          {showAttachments && (
            <View className="px-4 pb-4">
              {(!attachments || attachments.length === 0) ? (
                <View className="items-center py-4">
                  <Text className="text-gray-500">No attachments</Text>
                  <TouchableOpacity className="mt-2 px-4 py-2 bg-primary rounded-lg">
                    <Text className="text-white font-medium">Add Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {attachments.map((attachment: any) => (
                    <View key={attachment.id} className="w-20 h-20 bg-gray-200 rounded-lg" />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
