import { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ChevronDown, Home, Building2, Code, Megaphone, Dumbbell, FileX } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import type { InsertProject, Project } from "@/shared/types";

// Inline mutation hook to avoid import issues
function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertProject) =>
      apiClient.post<Project>("/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_OPTIONS = [
  { value: "none", label: "None", description: "Start with no preset categories", icon: FileX },
  { value: "home-builder", label: "Home Builder", description: "Residential construction", icon: Home },
  { value: "standard-construction", label: "Standard Construction", description: "Commercial construction", icon: Building2 },
  { value: "software-development", label: "Software Development", description: "Tech & software projects", icon: Code },
  { value: "digital-marketing", label: "Digital Marketing", description: "Marketing campaigns", icon: Megaphone },
  { value: "fitness", label: "Fitness", description: "Workout & fitness tracking", icon: Dumbbell },
];

export default function CreateProjectModal({
  visible,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [presetId, setPresetId] = useState("none");
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; location?: string }>({});

  const createProject = useCreateProject();

  // Fetch enabled presets from API
  const { data: enabledPresetsData } = useQuery({
    queryKey: ["enabled-presets"],
    queryFn: () => apiClient.get("/api/global-settings/enabled-presets"),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Filter presets based on what's enabled
  const availablePresets = useMemo(() => {
    if (!enabledPresetsData?.enabledPresets || enabledPresetsData.enabledPresets.length === 0) {
      return PRESET_OPTIONS; // Show all if no restrictions
    }

    return PRESET_OPTIONS.filter(preset =>
      preset.value === "none" || enabledPresetsData.enabledPresets.includes(preset.value)
    );
  }, [enabledPresetsData]);

  const resetForm = () => {
    setName("");
    setLocation("");
    setDescription("");
    setPresetId("none");
    setErrors({});
    setShowPresetPicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: { name?: string; location?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!location.trim()) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const projectData: InsertProject = {
      name: name.trim(),
      location: location.trim(),
      description: description.trim() || undefined,
      presetId: presetId,
      status: "active",
      progress: 0,
    };

    console.log("[CreateProject] Submitting project data:", JSON.stringify(projectData, null, 2));

    try {
      const result = await createProject.mutateAsync(projectData);
      Alert.alert("Success", "Project created successfully!");
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("[CreateProject] Error creating project:", error);

      // Build detailed error message for debugging
      let errorMessage = "Failed to create project";
      let errorDetails = "";

      if (error?.response) {
        errorMessage = error.response.data?.message
          || error.response.data?.error
          || `Server error: ${error.response.status}`;
        errorDetails = `\n\nStatus: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}`;
      } else if (error?.request) {
        errorMessage = "Network error - cannot reach server";
        errorDetails = "\n\nCheck that:\n1. Server is running on port 5000\n2. Your phone is on the same WiFi\n3. IP address is correct in .env";
      } else {
        errorMessage = error?.message || "Unknown error";
      }

      Alert.alert("Error", errorMessage + errorDetails);
    }
  };

  const selectedPreset = availablePresets.find((p) => p.value === presetId) || availablePresets[0];
  const SelectedIcon = selectedPreset.icon;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={handleClose} className="p-2 -ml-2">
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              Create New Project
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            {/* Project Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Project Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-4 text-base bg-gray-50 ${errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter project name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                }}
                autoCapitalize="words"
                editable={!createProject.isPending}
              />
              {errors.name && (
                <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
              )}
            </View>

            {/* Location */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Location <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-4 text-base bg-gray-50 ${errors.location ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter project location"
                value={location}
                onChangeText={(text) => {
                  setLocation(text);
                  if (errors.location)
                    setErrors((e) => ({ ...e, location: undefined }));
                }}
                autoCapitalize="words"
                editable={!createProject.isPending}
              />
              {errors.location && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.location}
                </Text>
              )}
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Description
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-4 text-base bg-gray-50"
                placeholder="Enter project description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
                editable={!createProject.isPending}
              />
            </View>

            {/* Category Preset */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Category Preset
              </Text>
              <TouchableOpacity
                style={styles.presetSelector}
                onPress={() => setShowPresetPicker(!showPresetPicker)}
                disabled={createProject.isPending}
              >
                <View style={styles.presetSelectorContent}>
                  <View style={styles.presetIconContainer}>
                    <SelectedIcon color="#6b7280" size={20} />
                  </View>
                  <View style={styles.presetTextContainer}>
                    <Text style={styles.presetLabel}>{selectedPreset.label}</Text>
                    <Text style={styles.presetDescription}>{selectedPreset.description}</Text>
                  </View>
                </View>
                <ChevronDown color="#6b7280" size={20} />
              </TouchableOpacity>

              {showPresetPicker && (
                <View style={styles.presetDropdown}>
                  {availablePresets.map((option) => {
                    const Icon = option.icon;
                    const isSelected = presetId === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.presetOption,
                          isSelected && styles.presetOptionSelected,
                        ]}
                        onPress={() => {
                          setPresetId(option.value);
                          setShowPresetPicker(false);
                        }}
                      >
                        <View style={styles.presetOptionContent}>
                          <View style={[
                            styles.presetOptionIcon,
                            isSelected && styles.presetOptionIconSelected,
                          ]}>
                            <Icon
                              color={isSelected ? "#2563eb" : "#6b7280"}
                              size={18}
                            />
                          </View>
                          <View>
                            <Text style={[
                              styles.presetOptionLabel,
                              isSelected && styles.presetOptionLabelSelected,
                            ]}>
                              {option.label}
                            </Text>
                            <Text style={styles.presetOptionDescription}>
                              {option.description}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="px-4 py-4 border-t border-gray-200">
            <TouchableOpacity
              className={`py-4 rounded-xl items-center ${createProject.isPending ? "bg-blue-300" : "bg-primary"
                }`}
              onPress={handleSubmit}
              disabled={createProject.isPending}
            >
              {createProject.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Create Project
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 mt-2 items-center"
              onPress={handleClose}
              disabled={createProject.isPending}
            >
              <Text className="text-gray-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  presetSelector: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  presetSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  presetIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  presetTextContainer: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  presetDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  presetDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  presetOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  presetOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  presetOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  presetOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  presetOptionIconSelected: {
    backgroundColor: "#dbeafe",
  },
  presetOptionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  presetOptionLabelSelected: {
    color: "#2563eb",
  },
  presetOptionDescription: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 1,
  },
});
