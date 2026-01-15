import { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
// import Toast from "react-native-toast-message";
import { Toast } from "@/components/Toast";

import { AIFloatingButton } from "@/components/ai/AIFloatingButton";

import "../global.css";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Font file is missing in assets, so we remove the load to prevent crash.
  // const [loaded] = useFonts({
  //   SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  // });
  const loaded = true; // Assuming "loaded" immediately if no assets to wait for

  const { isConnected, isInternetReachable } = useNetworkStatus();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // User requirement: Only show if connected to internet (via hook)
  const showAIButton = isConnected && isInternetReachable;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
      {showAIButton && <AIFloatingButton />}
      <Toast />
    </ThemeProvider>
  );
}
