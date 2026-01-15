import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";

interface CheckoutBarProps {
  total: number;
  onCheckout: () => void;
}

export function CheckoutBar({ total, onCheckout }: CheckoutBarProps) {
  return (
    <SafeAreaView
      edges={["bottom"]}
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 pt-4 shadow-2xl"
      style={{
        zIndex: 50,
        elevation: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      }}
    >
      <View className="flex-row justify-between items-center pb-6">
        <View>
          <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">
            Total a cobrar
          </Text>
          <Text className="text-3xl font-black text-indigo-950">
            C$ {total.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onCheckout}
          className="bg-indigo-600 px-8 py-4 rounded-2xl shadow-xl shadow-indigo-200 flex-row items-center active:scale-95 transition-all"
        >
          <Text className="text-white font-black text-lg mr-2 uppercase tracking-tighter">
            Cobrar
          </Text>
          <ChevronRight size={20} color="white" strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
