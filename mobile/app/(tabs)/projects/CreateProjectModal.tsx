import { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ChevronDown } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  { value: "none", label: "None" },
  { value: "home-builder", label: "Home Builder" },
  { value: "standard-construction", label: "Standard Construction" },
  { value: "software-development", label: "Software Development" },
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

    try {
      await createProject.mutateAsync(projectData);
      handleClose();
      onSuccess?.();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create project"
      );
    }
  };

  const selectedPresetLabel =
    PRESET_OPTIONS.find((p) => p.value === presetId)?.label || "None";

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
                className={`border rounded-xl px-4 py-4 text-base bg-gray-50 ${
                  errors.name ? "border-red-500" : "border-gray-300"
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
                className={`border rounded-xl px-4 py-4 text-base bg-gray-50 ${
                  errors.location ? "border-red-500" : "border-gray-300"
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
                className="border border-gray-300 rounded-xl px-4 py-4 bg-gray-50 flex-row items-center justify-between"
                onPress={() => setShowPresetPicker(!showPresetPicker)}
                disabled={createProject.isPending}
              >
                <Text className="text-base text-gray-900">
                  {selectedPresetLabel}
                </Text>
                <ChevronDown color="#6b7280" size={20} />
              </TouchableOpacity>

              {showPresetPicker && (
                <View className="border border-gray-200 rounded-xl mt-2 bg-white overflow-hidden">
                  {PRESET_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`px-4 py-3 border-b border-gray-100 ${
                        presetId === option.value ? "bg-blue-50" : ""
                      }`}
                      onPress={() => {
                        setPresetId(option.value);
                        setShowPresetPicker(false);
                      }}
                    >
                      <Text
                        className={`text-base ${
                          presetId === option.value
                            ? "text-primary font-medium"
                            : "text-gray-900"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="px-4 py-4 border-t border-gray-200">
            <TouchableOpacity
              className={`py-4 rounded-xl items-center ${
                createProject.isPending ? "bg-blue-300" : "bg-primary"
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
