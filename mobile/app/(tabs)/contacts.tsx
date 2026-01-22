import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, User, Phone, Mail, Building } from "lucide-react-native";
import { apiClient } from "@/services/api/client";

export default function ContactsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"contacts" | "labor">("contacts");

  const { data: contacts, refetch: refetchContacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => apiClient.get("/api/contacts"),
  });

  const { data: labor, refetch: refetchLabor } = useQuery({
    queryKey: ["labor"],
    queryFn: () => apiClient.get("/api/labor"),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchContacts(), refetchLabor()]);
    setRefreshing(false);
  };

  const filteredContacts = (contacts ?? []).filter((contact: any) => {
    const matchesSearch = !searchQuery ||
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredLabor = (labor ?? []).filter((entry: any) => {
    const matchesSearch = !searchQuery ||
      entry.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "supplier": return "bg-blue-100 text-blue-700";
      case "contractor": return "bg-green-100 text-green-700";
      case "consultant": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      {/* Search */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Search color="#9ca3af" size={20} />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder={activeTab === "contacts" ? "Search contacts..." : "Search labor entries..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-4 ${activeTab === "contacts" ? "border-b-2 border-primary" : ""}`}
          onPress={() => setActiveTab("contacts")}
        >
          <Text className={`text-center font-medium ${
            activeTab === "contacts" ? "text-primary" : "text-gray-500"
          }`}>
            Contacts ({contacts?.length ?? 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 ${activeTab === "labor" ? "border-b-2 border-primary" : ""}`}
          onPress={() => setActiveTab("labor")}
        >
          <Text className={`text-center font-medium ${
            activeTab === "labor" ? "text-primary" : "text-gray-500"
          }`}>
            Labor ({labor?.length ?? 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {activeTab === "contacts" ? (
            filteredContacts.length === 0 ? (
              <View className="items-center py-12">
                <User color="#9ca3af" size={48} />
                <Text className="text-gray-500 mt-4">
                  {searchQuery ? "No contacts match your search" : "No contacts yet"}
                </Text>
              </View>
            ) : (
              filteredContacts.map((contact: any) => (
                <View
                  key={contact.id}
                  className="bg-white p-4 rounded-xl mb-3 border border-gray-100"
                >
                  <View className="flex-row items-start">
                    <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                      <User color="#6b7280" size={24} />
                    </View>
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-semibold text-gray-900">{contact.name}</Text>
                        <View className={`px-2 py-1 rounded-full ${getRoleColor(contact.role)}`}>
                          <Text className="text-xs font-medium">{contact.role?.toUpperCase()}</Text>
                        </View>
                      </View>

                      {contact.company && (
                        <View className="flex-row items-center mt-1">
                          <Building color="#9ca3af" size={14} />
                          <Text className="text-gray-500 text-sm ml-1">{contact.company}</Text>
                        </View>
                      )}

                      <View className="flex-row gap-3 mt-3">
                        {contact.phone && (
                          <TouchableOpacity
                            className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg"
                            onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                          >
                            <Phone color="#3b82f6" size={16} />
                            <Text className="text-blue-600 text-sm ml-1">Call</Text>
                          </TouchableOpacity>
                        )}
                        {contact.email && (
                          <TouchableOpacity
                            className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg"
                            onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                          >
                            <Mail color="#3b82f6" size={16} />
                            <Text className="text-blue-600 text-sm ml-1">Email</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )
          ) : (
            filteredLabor.length === 0 ? (
              <View className="items-center py-12">
                <User color="#9ca3af" size={48} />
                <Text className="text-gray-500 mt-4">
                  {searchQuery ? "No labor entries match your search" : "No labor entries yet"}
                </Text>
              </View>
            ) : (
              filteredLabor.map((entry: any) => (
                <View
                  key={entry.id}
                  className="bg-white p-4 rounded-xl mb-3 border border-gray-100"
                >
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="font-semibold text-gray-900">{entry.fullName}</Text>
                      {entry.company && (
                        <Text className="text-gray-500 text-sm">{entry.company}</Text>
                      )}
                    </View>
                    <View className={`px-2 py-1 rounded-full ${
                      entry.status === "completed" ? "bg-green-100" :
                      entry.status === "in_progress" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <Text className={`text-xs font-medium ${
                        entry.status === "completed" ? "text-green-700" :
                        entry.status === "in_progress" ? "text-blue-700" : "text-gray-700"
                      }`}>
                        {entry.status?.replace("_", " ").toUpperCase() || "PENDING"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
                    <View>
                      <Text className="text-xs text-gray-500">Hours</Text>
                      <Text className="font-medium">{entry.totalHours || 0}h</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-gray-500">Rate</Text>
                      <Text className="font-medium">${entry.hourlyRate || 0}/hr</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-gray-500">Total</Text>
                      <Text className="font-semibold text-gray-900">
                        ${entry.laborCost || (entry.totalHours || 0) * (entry.hourlyRate || 0)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        onPress={() => {/* TODO: Open create modal */}}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
