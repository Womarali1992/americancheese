import { Stack } from "expo-router";

export default function ProjectsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Projects",
          headerStyle: { backgroundColor: "#ffffff" },
          headerTitleStyle: { fontWeight: "600", color: "#111827" },
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Project Details",
          headerStyle: { backgroundColor: "#ffffff" },
          headerTitleStyle: { fontWeight: "600", color: "#111827" },
        }}
      />
    </Stack>
  );
}
