import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  User, Bell, Palette, Database, LogOut, ChevronRight,
  Wifi, WifiOff, RefreshCw
} from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

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
    </SafeAreaView>
  );
}
