import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { X, DollarSign } from "lucide-react-native";

interface CashPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  total: number;
  amountReceived: string;
  setAmountReceived: (amount: string) => void;
  onConfirm: () => void;
}

export function CashPaymentModal({
  visible,
  onClose,
  total,
  amountReceived,
  setAmountReceived,
  onConfirm,
}: CashPaymentModalProps) {
  const change = amountReceived ? parseFloat(amountReceived) - total : -total;

  const isValid = amountReceived && change >= 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/70">
        <View className="bg-white rounded-t-[50px] p-8 pb-14 h-[85%] border-t-2 border-indigo-100">
          <View className="w-12 h-1.5 bg-gray-200 self-center rounded-full mb-8" />
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-3xl font-black text-indigo-950">
              Pago de Contado
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 p-3 rounded-full"
            >
              <X color="#1e1b4b" size={24} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="items-center mb-8">
              <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">
                Total a Pagar
              </Text>
              <Text className="text-5xl font-black text-indigo-950">
                C$ {total.toLocaleString()}
              </Text>
            </View>

            <View className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 mb-6">
              <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-3">
                Monto Recibido
              </Text>
              <View className="bg-white px-6 py-4 rounded-3xl border border-gray-200 flex-row items-center h-24 shadow-sm">
                <Text className="text-gray-300 font-black text-4xl mr-3">
                  C$
                </Text>
                <TextInput
                  className="flex-1 text-4xl font-black text-indigo-950"
                  style={{
                    paddingVertical: 0,
                    includeFontPadding: false, // Android fix
                    textAlignVertical: "center", // Android fix
                  }}
                  placeholder="0"
                  placeholderTextColor="#e2e8f0"
                  keyboardType="numeric"
                  value={amountReceived}
                  onChangeText={setAmountReceived}
                  autoFocus
                />
              </View>
            </View>

            <View
              className={`p-6 rounded-[32px] mb-8 flex-row justify-between items-center ${
                change < 0 ? "bg-red-50" : "bg-emerald-50"
              }`}
              style={{
                borderWidth: 1,
                borderColor: change < 0 ? "#fecaca" : "#a7f3d0",
              }}
            >
              <View>
                <Text
                  className={`font-bold text-xs uppercase tracking-widest mb-1 ${
                    change < 0 ? "text-red-400" : "text-emerald-500"
                  }`}
                >
                  {change < 0 ? "Faltante" : "Su Vuelto"}
                </Text>
                <Text
                  className={`font-black text-3xl ${
                    change < 0 ? "text-red-900" : "text-emerald-900"
                  }`}
                >
                  {change < 0 ? "-" : ""}C$ {Math.abs(change).toLocaleString()}
                </Text>
              </View>
              <View
                className={`p-3 rounded-full ${
                  change < 0 ? "bg-red-100" : "bg-emerald-100"
                }`}
              >
                <DollarSign
                  size={24}
                  color={change < 0 ? "#ef4444" : "#10b981"}
                  strokeWidth={3}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={onConfirm}
              className={`w-full py-6 rounded-[32px] items-center shadow-xl ${
                !isValid
                  ? "bg-gray-200"
                  : "bg-indigo-600 shadow-indigo-300 active:bg-indigo-700"
              }`}
              disabled={!isValid}
            >
              <Text className="text-white font-black text-xl uppercase tracking-widest">
                Confirmar Venta
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
