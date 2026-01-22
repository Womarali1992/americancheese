import { Link, Stack } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-6xl mb-4">404</Text>
        <Text className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</Text>
        <Text className="text-gray-500 text-center mb-8">
          The page you're looking for doesn't exist.
        </Text>
        <Link href="/" asChild>
          <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">Go to Dashboard</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}
