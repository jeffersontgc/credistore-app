import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  rightAction,
  children,
}: Props) {
  return (
    <LinearGradient
      colors={["#4338ca", "#1e1b4b"]}
      className="pb-8 pt-2 px-6 rounded-b-[40px] shadow-2xl z-20"
      style={styles.shadow}
    >
      <SafeAreaView edges={["top"]}>
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <View>
            {subtitle && (
              <Text className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-1">
                {subtitle}
              </Text>
            )}
            <Text className="text-white text-3xl font-black">{title}</Text>
          </View>
          {rightAction && <View>{rightAction}</View>}
        </View>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
});
