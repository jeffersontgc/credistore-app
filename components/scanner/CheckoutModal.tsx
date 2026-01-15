import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { X, DollarSign, CreditCard } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPaymentMethod: (type: "CASH" | "CREDIT") => void;
}

export function CheckoutModal({
  visible,
  onClose,
  onSelectPaymentMethod,
}: CheckoutModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/70">
        <View className="bg-white rounded-t-[50px] p-8 pb-14 border-t-2 border-indigo-100">
          <View className="mb-8">
            <Text className="text-3xl font-black text-indigo-950 text-center">
              Método de Pago
            </Text>
            <Text className="text-gray-400 font-bold text-center mt-2">
              ¿Cómo desea pagar el cliente?
            </Text>
          </View>

          <View className="flex-row gap-5">
            <TouchableOpacity
              onPress={() => onSelectPaymentMethod("CASH")}
              activeOpacity={0.8}
              className="flex-1"
            >
              <LinearGradient
                colors={["#ecfdf5", "#d1fae5"]}
                className="p-6 items-center justify-center h-48"
              >
                <View className="bg-emerald-500 w-16 h-16 rounded-full items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                  <DollarSign size={32} color="white" strokeWidth={3} />
                </View>
                <Text className="text-emerald-950 font-black text-xl tracking-wide">
                  CONTADO
                </Text>
                <Text className="text-emerald-600/80 font-bold text-[10px] uppercase tracking-widest mt-1">
                  Pago inmediato
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSelectPaymentMethod("CREDIT")}
              activeOpacity={0.8}
              className="flex-1"
            >
              <LinearGradient
                colors={["#fffbeb", "#fef3c7"]}
                className="p-6 items-center justify-center h-48"
              >
                <View className="bg-amber-500 w-16 h-16 rounded-full items-center justify-center mb-4 shadow-lg shadow-amber-200">
                  <CreditCard size={32} color="white" strokeWidth={3} />
                </View>
                <Text className="text-amber-950 font-black text-xl tracking-wide">
                  FIADO
                </Text>
                <Text className="text-amber-600/80 font-bold text-[10px] uppercase tracking-widest mt-1">
                  Crédito
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="absolute top-6 right-6 bg-gray-100 p-2 rounded-full"
          >
            <X color="#1e1b4b" size={20} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
