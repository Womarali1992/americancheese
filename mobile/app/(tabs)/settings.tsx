import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Modal, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  User, Bell, Palette, Database, LogOut, ChevronRight,
  Wifi, WifiOff, RefreshCw, Check, X
} from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { getThemeList, getThemeTier1Colors, ColorTheme } from "@/lib/themes";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { themeKey, setTheme, loadTheme, getTheme } = useThemeStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Load theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleThemeSelect = async (key: string) => {
    await setTheme(key);
    setShowThemePicker(false);
  };

  const currentTheme = getTheme();
  const themeList = getThemeList();

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    hasSwitch,
    switchValue,
    onSwitchChange,
    destructive,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      className={`flex-row items-center py-4 ${onPress ? "" : ""}`}
      onPress={onPress}
      disabled={hasSwitch}
    >
      <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
        {icon}
      </View>
      <View className="flex-1 ml-3">
        <Text className={`font-medium ${destructive ? "text-red-600" : "text-gray-900"}`}>
          {label}
        </Text>
        {value && <Text className="text-gray-500 text-sm">{value}</Text>}
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
          thumbColor={switchValue ? "#2563eb" : "#f3f4f6"}
        />
      ) : onPress ? (
        <ChevronRight color="#9ca3af" size={20} />
      ) : null}
    </TouchableOpacity>
  );

  const renderThemeItem = ({ item }: { item: { key: string; theme: ColorTheme } }) => {
    const { key, theme } = item;
    const isSelected = themeKey === key;
    const tier1Colors = getThemeTier1Colors(theme);

    return (
      <TouchableOpacity
        style={[
          styles.themeItem,
          isSelected && styles.themeItemSelected,
        ]}
        onPress={() => handleThemeSelect(key)}
        activeOpacity={0.7}
      >
        <View style={styles.themeInfo}>
          <Text style={[styles.themeName, isSelected && styles.themeNameSelected]}>
            {theme.name}
          </Text>
          <Text style={styles.themeDescription} numberOfLines={1}>
            {theme.description}
          </Text>
          <View style={styles.colorDots}>
            {tier1Colors.map((color, index) => (
              <View
                key={index}
                style={[styles.colorDot, { backgroundColor: color }]}
              />
            ))}
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkContainer}>
            <Check color="#2563eb" size={20} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Account Section */}
        <View className="bg-white mx-4 mt-4 rounded-xl px-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">Account</Text>

          <SettingRow
            icon={<User color="#6b7280" size={20} />}
            label="Profile"
            value="Manage your profile"
            onPress={() => {/* TODO */}}
          />

          <View className="h-px bg-gray-100" />

          <SettingRow
            icon={<Bell color="#6b7280" size={20} />}
            label="Push Notifications"
            hasSwitch
            switchValue={notifications}
            onSwitchChange={setNotifications}
          />
        </View>

        {/* Appearance Section */}
        <View className="bg-white mx-4 mt-4 rounded-xl px-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">Appearance</Text>

          <SettingRow
            icon={<Palette color="#6b7280" size={20} />}
            label="Color Theme"
            value={currentTheme.name}
            onPress={() => setShowThemePicker(true)}
          />

          <View className="h-px bg-gray-100" />

          <SettingRow
            icon={<Palette color="#6b7280" size={20} />}
            label="Dark Mode"
            hasSwitch
            switchValue={darkMode}
            onSwitchChange={setDarkMode}
          />
        </View>

        {/* Data & Sync Section */}
        <View className="bg-white mx-4 mt-4 rounded-xl px-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">Data & Sync</Text>

          <SettingRow
            icon={offlineMode ? <WifiOff color="#6b7280" size={20} /> : <Wifi color="#6b7280" size={20} />}
            label="Offline Mode"
            value={offlineMode ? "Using cached data" : "Connected"}
            hasSwitch
            switchValue={offlineMode}
            onSwitchChange={setOfflineMode}
          />

          <View className="h-px bg-gray-100" />

          <SettingRow
            icon={<RefreshCw color="#6b7280" size={20} />}
            label="Sync Now"
            value="Last synced: Just now"
            onPress={() => {/* TODO: Trigger sync */}}
          />

          <View className="h-px bg-gray-100" />

          <SettingRow
            icon={<Database color="#6b7280" size={20} />}
            label="Clear Cache"
            value="Free up storage space"
            onPress={() => {
              Alert.alert(
                "Clear Cache",
                "This will clear all cached data. You will need to be online to reload data.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear", style: "destructive", onPress: () => {/* TODO */} },
                ]
              );
            }}
          />
        </View>

        {/* Logout Section */}
        <View className="bg-white mx-4 mt-4 rounded-xl px-4 mb-8">
          <SettingRow
            icon={<LogOut color="#dc2626" size={20} />}
            label="Logout"
            onPress={handleLogout}
            destructive
          />
        </View>

        {/* App Info */}
        <View className="items-center mb-8">
          <Text className="text-gray-400 text-sm">SiteSetups Mobile</Text>
          <Text className="text-gray-400 text-xs">Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Theme</Text>
            <TouchableOpacity
              onPress={() => setShowThemePicker(false)}
              style={styles.closeButton}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>

          {/* Theme List */}
          <FlatList
            data={themeList}
            renderItem={renderThemeItem}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.themeList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  themeList: {
    padding: 16,
  },
  themeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  themeItemSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  themeNameSelected: {
    color: "#2563eb",
  },
  themeDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  colorDots: {
    flexDirection: "row",
    gap: 6,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  checkContainer: {
    marginLeft: 12,
  },
});
