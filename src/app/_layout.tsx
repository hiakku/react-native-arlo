import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          title: "Arlo",
          contentStyle: { backgroundColor: "#F3F5ED" },
        }}
      />
    </SafeAreaProvider>
  );
}
