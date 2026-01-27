import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  MapPin,
  Calendar,
  CheckSquare,
  Package,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Circle,
  CheckCircle2,
  Clock,
  Folder,
  Tags,
} from "lucide-react-native";
import { apiClient } from "@/services/api/client";
import { useThemeStore } from "@/stores/themeStore";
import { getThemeTier1Colors } from "@/lib/themes";
import { hexToRgba } from "@/lib/colors";

type TabType = "tasks" | "resources" | "budget";

// Category from API - tier1 categories have children array containing tier2 subcategories
interface Category {
  id: number;
  name: string;
  description: string | null;
  type: "tier1" | "tier2";
  parentId: number | null;
  color: string | null;
  sortOrder: number;
  children?: Category[];
}

// Helper to generate light background from a color
const getLightBg = (color: string): string => {
  return hexToRgba(color, 0.15);
};

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("tasks");

  // Track expanded tier1 categories
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Track selected tier2 for showing tasks
  const [selectedTier2, setSelectedTier2] = useState<{ tier1: Category; tier2: Category } | null>(null);

  // Get theme colors from the theme store
  const { getTheme } = useThemeStore();
  const currentTheme = getTheme();
  const themeColors = getThemeTier1Colors(currentTheme);

  const { data: project, refetch: refetchProject } = useQuery({
    queryKey: ["project", id],
    queryFn: () => apiClient.get(`/api/projects/${id}`),
    enabled: !!id,
  });

  // Fetch project-specific categories from the API
  const { data: categories, refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ["project-categories", id],
    queryFn: () => apiClient.get(`/api/projects/${id}/categories`),
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
    await Promise.all([refetchProject(), refetchCategories(), refetchTasks(), refetchMaterials()]);
    setRefreshing(false);
  };

  // Get task counts by category ID
  const taskCountsByCategory = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return {};

    const counts: Record<number, { total: number; completed: number; inProgress: number }> = {};

    tasks.forEach((task: any) => {
      if (task.categoryId) {
        if (!counts[task.categoryId]) {
          counts[task.categoryId] = { total: 0, completed: 0, inProgress: 0 };
        }
        counts[task.categoryId].total++;
        if (task.status === "completed") {
          counts[task.categoryId].completed++;
        } else if (task.status === "in_progress") {
          counts[task.categoryId].inProgress++;
        }
      }
    });

    return counts;
  }, [tasks]);

  // Get task counts for a tier1 category (sum of all tier2 subcategories)
  const getStatsForTier1 = (tier1Category: Category) => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;

    // Add direct tier1 tasks
    const tier1Stats = taskCountsByCategory[tier1Category.id] || { total: 0, completed: 0, inProgress: 0 };
    total += tier1Stats.total;
    completed += tier1Stats.completed;
    inProgress += tier1Stats.inProgress;

    // Add all tier2 tasks (children)
    if (tier1Category.children) {
      tier1Category.children.forEach((tier2: Category) => {
        const tier2Stats = taskCountsByCategory[tier2.id] || { total: 0, completed: 0, inProgress: 0 };
        total += tier2Stats.total;
        completed += tier2Stats.completed;
        inProgress += tier2Stats.inProgress;
      });
    }

    return { total, completed, inProgress };
  };

  // Get task counts for a tier2 category
  const getStatsForTier2 = (category: Category) => {
    return taskCountsByCategory[category.id] || { total: 0, completed: 0, inProgress: 0 };
  };

  // Get tasks for the selected tier2 category
  const filteredTasks = useMemo(() => {
    if (!selectedTier2 || !tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((task: any) => task.categoryId === selectedTier2.tier2.id);
  }, [selectedTier2, tasks]);

  // Get theme color for a category (use custom color or fallback to default)
  const getCategoryTheme = (category: Category, index: number) => {
    if (category.color) {
      return {
        primary: category.color,
        bgLight: getLightBg(category.color),
      };
    }
    return DEFAULT_THEME_COLORS[index % DEFAULT_THEME_COLORS.length];
  };

  // Toggle tier1 category expansion
  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "tasks", label: "Tasks" },
    { key: "resources", label: "Resources" },
    { key: "budget", label: "Budget" },
  ];

  const completedTasks = tasks?.filter((t: any) => t.status === "completed").length ?? 0;
  const totalTasks = tasks?.length ?? 0;

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

  // Render tier1 category card with expandable tier2 subcategories
  const renderTier1CategoryCard = (tier1Category: Category, index: number) => {
    const stats = getStatsForTier1(tier1Category);
    const theme = getCategoryTheme(tier1Category, index);
    const isExpanded = expandedCategories.has(tier1Category.id);
    const childrenCount = tier1Category.children?.length || 0;
    const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
      <View
        key={tier1Category.id}
        className="mb-4 rounded-xl overflow-hidden border border-gray-100"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Category Header - Colored top section */}
        <TouchableOpacity
          onPress={() => toggleCategory(tier1Category.id)}
          activeOpacity={0.7}
        >
          <View
            className="p-4"
            style={{ backgroundColor: theme.bgLight }}
          >
            {/* Icon centered at top */}
            <View className="items-center py-3">
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
              >
                <Tags color={theme.primary} size={28} />
              </View>
            </View>
          </View>

          {/* Category Info */}
          <View className="p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900 flex-1" numberOfLines={2}>
                {tier1Category.name}
              </Text>
              <View className="w-6 h-6 items-center justify-center">
                {isExpanded ? (
                  <ChevronDown color={theme.primary} size={22} />
                ) : (
                  <ChevronRight color={theme.primary} size={22} />
                )}
              </View>
            </View>

            {tier1Category.description && (
              <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                {tier1Category.description}
              </Text>
            )}

            {/* Stats row */}
            <View className="mt-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-600 text-sm">
                  {stats.total} {stats.total === 1 ? 'task' : 'tasks'}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {completionPercentage}% complete
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-sm">
                  {stats.completed} completed
                </Text>
                {stats.inProgress > 0 && (
                  <Text className="text-gray-500 text-sm">
                    {stats.inProgress} in progress
                  </Text>
                )}
              </View>

              {/* Progress bar */}
              <View className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${completionPercentage}%`,
                    backgroundColor: theme.primary
                  }}
                />
              </View>

              {/* Subcategories count */}
              <Text className="text-gray-400 text-xs mt-2">
                {childrenCount} subcategories
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Tier2 Subcategories */}
        {isExpanded && tier1Category.children && tier1Category.children.length > 0 && (
          <View className="px-4 pb-4 pt-0" style={{ backgroundColor: "#f9fafb" }}>
            <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Subcategories
            </Text>
            {tier1Category.children.map((tier2: Category) => {
              const tier2Stats = getStatsForTier2(tier2);
              const tier2Completion = tier2Stats.total > 0
                ? Math.round((tier2Stats.completed / tier2Stats.total) * 100)
                : 0;

              return (
                <TouchableOpacity
                  key={tier2.id}
                  className="bg-white p-3 rounded-lg border border-gray-100 mb-2 flex-row items-center"
                  onPress={() => setSelectedTier2({ tier1: tier1Category, tier2 })}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: theme.bgLight }}
                  >
                    <Text
                      className="font-bold text-xs"
                      style={{ color: theme.primary }}
                    >
                      {tier2.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{tier2.name}</Text>
                    {tier2.description && (
                      <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                        {tier2.description}
                      </Text>
                    )}
                    <View className="flex-row items-center mt-1">
                      <Text className="text-gray-500 text-sm">
                        {tier2Stats.completed}/{tier2Stats.total} completed
                      </Text>
                      {tier2Stats.total > 0 && (
                        <View className="flex-1 h-1 bg-gray-200 rounded-full ml-3 overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${tier2Completion}%`,
                              backgroundColor: theme.primary
                            }}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight color="#9ca3af" size={18} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty subcategories message */}
        {isExpanded && (!tier1Category.children || tier1Category.children.length === 0) && (
          <View className="px-4 pb-4 pt-0 items-center" style={{ backgroundColor: "#f9fafb" }}>
            <Text className="text-gray-400 text-sm italic">No subcategories defined</Text>
          </View>
        )}
      </View>
    );
  };

  // Render tasks list for selected tier2
  const renderTasksList = () => {
    if (!selectedTier2) return null;

    const tier1Index = categories?.findIndex(c => c.id === selectedTier2.tier1.id) ?? 0;
    const theme = getCategoryTheme(selectedTier2.tier1, tier1Index);

    return (
      <View>
        {/* Back button */}
        <TouchableOpacity
          className="flex-row items-center mb-4"
          onPress={() => setSelectedTier2(null)}
        >
          <ChevronLeft color={theme.primary} size={24} />
          <Text style={{ color: theme.primary }} className="font-medium ml-1">Back</Text>
        </TouchableOpacity>

        {/* Breadcrumb */}
        <View className="flex-row items-center mb-4 flex-wrap">
          <View
            className="px-2 py-1 rounded-full mr-2"
            style={{ backgroundColor: theme.bgLight }}
          >
            <Text style={{ color: theme.primary }} className="text-xs font-medium">
              {selectedTier2.tier1.name}
            </Text>
          </View>
          <ChevronRight color="#9ca3af" size={14} />
          <View
            className="px-2 py-1 rounded-full ml-2"
            style={{ backgroundColor: theme.bgLight }}
          >
            <Text style={{ color: theme.primary }} className="text-sm font-semibold">
              {selectedTier2.tier2.name}
            </Text>
          </View>
        </View>

        {/* Tasks list */}
        {filteredTasks.length === 0 ? (
          <View className="items-center py-8">
            <CheckSquare color="#9ca3af" size={40} />
            <Text className="text-gray-500 mt-2">No tasks in this category</Text>
            <Text className="text-gray-400 text-sm mt-1">Add tasks from the web app</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {filteredTasks.map((task: any) => (
              <TouchableOpacity
                key={task.id}
                className="bg-white p-4 rounded-xl border border-gray-100 flex-row items-center"
                onPress={() => router.push(`/(tabs)/tasks/${task.id}`)}
              >
                {getStatusIcon(task.status)}
                <View className="flex-1 ml-3">
                  <Text className={`font-medium ${
                    task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"
                  }`}>
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                      {task.description}
                    </Text>
                  )}
                  {task.startDate && (
                    <Text className="text-xs text-gray-400 mt-1">
                      {new Date(task.startDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <ChevronRight color="#9ca3af" size={20} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render the appropriate content based on navigation state
  const renderTasksContent = () => {
    // If viewing tasks for a specific tier2 category
    if (selectedTier2) {
      return renderTasksList();
    }

    // Show project-specific categories
    if (!categories || categories.length === 0) {
      return (
        <View className="items-center py-8">
          <Folder color="#9ca3af" size={40} />
          <Text className="text-gray-500 mt-2">No categories yet</Text>
          <Text className="text-gray-400 text-sm mt-1 text-center px-4">
            Add categories to this project from the web app
          </Text>
        </View>
      );
    }

    return (
      <View>
        {categories.map((tier1Category, index) =>
          renderTier1CategoryCard(tier1Category, index)
        )}
      </View>
    );
  };

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

          <View className="flex-row flex-wrap mt-3" style={{ gap: 16 }}>
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
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${project?.progress || 0}%` }}
              />
            </View>
          </View>

          {/* Quick Stats */}
          <View className="flex-row mt-4" style={{ gap: 12 }}>
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
              className={`flex-1 py-4 ${activeTab === tab.key ? "border-b-2 border-blue-500" : ""}`}
              onPress={() => {
                setActiveTab(tab.key);
                // Reset category navigation when switching tabs
                setExpandedCategories(new Set());
                setSelectedTier2(null);
              }}
            >
              <Text className={`text-center font-medium ${
                activeTab === tab.key ? "text-blue-500" : "text-gray-500"
              }`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View className="p-4">
          {activeTab === "tasks" && renderTasksContent()}

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
