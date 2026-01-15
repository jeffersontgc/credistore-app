import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { X, Calendar, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "@/constants/Colors";
import { User } from "@/store/useStore";
import { UserSelector } from "@/components/UserSelector";

interface DebtPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  dueDate: Date;
  setDueDate: (date: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  total: number;
  onConfirm: () => void;
}

export function DebtPaymentModal({
  visible,
  onClose,
  selectedUser,
  onSelectUser,
  dueDate,
  setDueDate,
  showDatePicker,
  setShowDatePicker,
  total,
  onConfirm,
}: DebtPaymentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/70">
        <View className="bg-white rounded-t-[50px] p-8 h-[92%] border-t-2 border-indigo-100">
          <View className="w-12 h-1.5 bg-gray-200 self-center rounded-full mb-8" />
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-3xl font-black text-indigo-950">
              Registrar Fiado
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 p-3 rounded-full"
            >
              <X color="#1e1b4b" size={24} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <Text className="text-indigo-950 font-black text-lg mb-4">
              Seleccionar Cliente
            </Text>
            <UserSelector onSelect={onSelectUser} selectedUser={selectedUser} />

            <View className="mt-10">
              <Text className="text-indigo-950 font-black text-lg mb-4">
                Plazo de Pago
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="bg-indigo-50/50 p-6 rounded-[10px] flex-row justify-between items-center border border-indigo-100"
              >
                <View className="flex-row items-center">
                  <Calendar size={22} color={Colors.primary} className="mr-3" />
                  <Text className="text-indigo-950 font-black text-lg">
                    {dueDate.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.primary} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) setDueDate(date);
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <LinearGradient
              colors={["#fff7ed", "#ffedd5"]}
              className="mt-10 p-8"
            >
              <Text className="text-amber-900 font-black text-lg mb-2">
                Resumen
              </Text>
              <View className="flex-row justify-between items-end">
                <Text className="text-amber-700 font-bold mb-1">
                  Monto total:
                </Text>
                <Text className="text-amber-900 font-black text-3xl">
                  C$ {total.toLocaleString()}
                </Text>
              </View>
            </LinearGradient>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={!selectedUser}
              className={`mt-10 py-6 rounded-[32px] items-center shadow-xl ${
                !selectedUser
                  ? "bg-gray-200"
                  : "bg-indigo-600 shadow-indigo-200 active:bg-indigo-700"
              }`}
            >
              <Text className="text-white font-black text-xl uppercase tracking-widest">
                Confirmar Fiado
              </Text>
            </TouchableOpacity>
            <View className="h-20" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
