import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, MapPin, Calendar } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiClient } from "@/services/api/client";
import CreateProjectModal from "./CreateProjectModal";
import {
  getProjectColor,
  getStatusStyles,
  hexToRgba,
} from "@/lib/colors";

interface ProjectCardProps {
  project: any;
  onPress: () => void;
}

function ProjectCard({ project, onPress }: ProjectCardProps) {
  const projectColor = getProjectColor(project.id);
  const statusStyles = getStatusStyles(project.status);
  const progress = project.progress || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.cardContainer}
    >
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.98)',
          hexToRgba(projectColor, 0.08),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Colored accent bar */}
        <View style={[styles.accentBar, { backgroundColor: projectColor }]} />

        <View style={styles.cardContent}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.projectName}>{project.name}</Text>
            </View>
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

          {/* Meta info */}
          {project.location && (
            <View style={styles.metaRow}>
              <MapPin color="#9ca3af" size={14} />
              <Text style={styles.metaText}>{project.location}</Text>
            </View>
          )}

          {project.startDate && (
            <View style={styles.metaRow}>
              <Calendar color="#9ca3af" size={14} />
              <Text style={styles.metaText}>
                {new Date(project.startDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(Math.max(progress, 0), 100)}%`,
                    backgroundColor: projectColor,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

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
              <ProjectCard
                key={project.id}
                project={project}
                onPress={() => router.push(`/(tabs)/projects/${project.id}`)}
              />
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

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardGradient: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  metaText: {
    color: "#6b7280",
    fontSize: 13,
    marginLeft: 6,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
