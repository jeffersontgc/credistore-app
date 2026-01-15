import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SlideInUp,
  SlideInDown,
  SlideOutUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle, XCircle, Info, X } from "lucide-react-native";
import { useToastStore } from "@/store/useToastStore";

const { width } = Dimensions.get("window");

export function Toast() {
  const { visible, type, title, message, hideToast } = useToastStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, hideToast]);

  if (!visible) return null;

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-500",
          border: "border-emerald-600",
          icon: CheckCircle,
        };
      case "error":
        return { bg: "bg-red-500", border: "border-red-600", icon: XCircle };
      case "info":
        return { bg: "bg-blue-500", border: "border-blue-600", icon: Info };
      default:
        return { bg: "bg-gray-800", border: "border-gray-900", icon: Info };
    }
  };

  const { bg, border, icon: Icon } = getColors();

  return (
    <Animated.View
      entering={SlideInUp.duration(300)} // Changed to SlideInUp with duration (Wait, user said "aparece de abajo arriba" (bottom to top) and he disliked it. SlideInUp comes from bottom. So I want SlideInDown (from top). No, if it's at the top, SlideInUp comes from "below the final position"? No. SlideInUp comes from "below the screen" usually. SlideInDown comes from "above". Let's use SlideInUp but maybe I need negative offset? Actually standard is FadeInDown. Let's try FadeInDown or SlideInUp with custom config? Reanimated: SlideInUp = slides in from bottom edge. SlideInDown = slides in from top edge. User complained "appears from bottom up". So I was using SlideInUp. I should use SlideInDown (from top).
      style={{
        position: "absolute",
        top: insets.top + 10,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
    >
      <View
        className={`flex-row items-center p-4 rounded-2xl shadow-lg border-b-4 ${bg} ${border}`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <View className="bg-white/20 p-2 rounded-full mr-3">
          <Icon size={24} color="white" strokeWidth={2.5} />
        </View>
        <View className="flex-1">
          {title && (
            <Text className="text-white font-black text-base mb-0.5">
              {title}
            </Text>
          )}
          <Text className="text-white/90 font-medium text-sm leading-tight">
            {message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={hideToast}
          className="bg-black/10 p-1.5 rounded-full ml-2"
        >
          <X size={14} color="white" strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
