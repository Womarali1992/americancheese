import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, Package, DollarSign } from "lucide-react-native";
import { apiClient } from "@/services/api/client";

export default function MaterialsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: materials, refetch } = useQuery({
    queryKey: ["materials"],
    queryFn: () => apiClient.get("/api/materials"),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredMaterials = (materials ?? []).filter((material: any) => {
    const matchesSearch = !searchQuery ||
      material.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalCost = filteredMaterials.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50">
      {/* Search */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Search color="#9ca3af" size={20} />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search materials..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Summary */}
        <View className="flex-row gap-3 mt-3">
          <View className="flex-1 bg-gray-50 p-3 rounded-xl flex-row items-center">
            <Package color="#f59e0b" size={18} />
            <Text className="ml-2 text-gray-500 text-sm">Items:</Text>
            <Text className="ml-1 font-bold">{filteredMaterials.length}</Text>
          </View>
          <View className="flex-1 bg-gray-50 p-3 rounded-xl flex-row items-center">
            <DollarSign color="#22c55e" size={18} />
            <Text className="ml-2 text-gray-500 text-sm">Total:</Text>
            <Text className="ml-1 font-bold">${totalCost.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {filteredMaterials.length === 0 ? (
            <View className="items-center py-12">
              <Package color="#9ca3af" size={48} />
              <Text className="text-gray-500 mt-4">
                {searchQuery ? "No materials match your search" : "No materials yet"}
              </Text>
            </View>
          ) : (
            filteredMaterials.map((material: any) => (
              <View
                key={material.id}
                className="bg-white p-4 rounded-xl mb-3 border border-gray-100"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{material.name}</Text>
                    {material.type && (
                      <Text className="text-gray-500 text-sm mt-1">{material.type}</Text>
                    )}
                  </View>
                  <View className={`px-2 py-1 rounded-full ${
                    material.status === "ordered" ? "bg-blue-100" :
                    material.status === "delivered" ? "bg-green-100" :
                    material.status === "pending" ? "bg-yellow-100" : "bg-gray-100"
                  }`}>
                    <Text className={`text-xs font-medium ${
                      material.status === "ordered" ? "text-blue-700" :
                      material.status === "delivered" ? "text-green-700" :
                      material.status === "pending" ? "text-yellow-700" : "text-gray-700"
                    }`}>
                      {material.status?.toUpperCase() || "PENDING"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
                  <View>
                    <Text className="text-xs text-gray-500">Quantity</Text>
                    <Text className="font-medium">{material.quantity || 0} {material.unit || "units"}</Text>
                  </View>
                  {material.cost != null && (
                    <View className="items-end">
                      <Text className="text-xs text-gray-500">Cost</Text>
                      <Text className="font-semibold text-gray-900">${material.cost}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        onPress={() => {/* TODO: Open create material modal */}}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
