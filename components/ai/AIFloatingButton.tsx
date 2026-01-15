import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AIChatModal } from "./AIChatModal";

import { usePathname } from "expo-router";

export function AIFloatingButton() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const isScanner = pathname.includes("scanner");

  // Default: Top-Right. Scanner: Bottom-Left (or whatever preferred)
  // User asked for "another place" for scanner.
  // Let's put it Bottom-Left for scanner to avoid camera header conflicts.
  const positionClass = isScanner
    ? "absolute bottom-28 right-5"
    : "absolute top-14 right-5";

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className={`${positionClass} z-50 rounded-full`}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#6366f1", "#4338ca"]}
          className="w-16 h-16 rounded-full items-center justify-center"
        >
          <Sparkles
            size={26}
            color="white"
            className="animate-duration-1000 animate-ease-in-out animate-infinite animate-bounce      "
            fill="white"
          />
        </LinearGradient>
      </TouchableOpacity>

      <AIChatModal visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}
