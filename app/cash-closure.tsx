import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import { Colors } from "@/constants/Colors";
import { Lock, DollarSign, CreditCard, TrendingUp } from "lucide-react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function CashClosureScreen() {
  const { currentDaySales, currentDayDebts, closeCashRegister } = useStore();

  const totalCash = currentDaySales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const totalCredit = currentDayDebts.reduce(
    (sum, debt) => sum + debt.amount,
    0
  );
  const totalDay = totalCash + totalCredit;

  const handleCloseCash = () => {
    if (currentDaySales.length === 0 && currentDayDebts.length === 0) {
      Alert.alert("Sin Ventas", "No hay ventas registradas para cerrar.");
      return;
    }

    Alert.alert(
      "🔒 Cerrar Caja",
      `¿Estás seguro de cerrar la caja del día?\\n\\nTotal: C$ ${totalDay.toFixed(
        2
      )}\\n\\nEsta acción guardará un registro del día y limpiará las ventas actuales.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar Caja",
          style: "default",
          onPress: () => {
            closeCashRegister();
            Alert.alert(
              "✓ Caja Cerrada",
              "El cierre se ha guardado correctamente."
            );
            router.back();
          },
        },
      ]
    );
  };

  const today = new Date().toLocaleDateString("es-NI", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View className="flex-1 bg-gray-100">
      <ScreenHeader title="Cierre de Caja" subtitle={today.toUpperCase()} />
      <SafeAreaView className="flex-1" edges={["bottom"]}>
        <ScrollView className="flex-1 p-6">
          {/* Summary Cards */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm">
              <View className="flex-row items-center mb-2">
                <DollarSign size={20} color={Colors.success} />
                <Text className="text-gray-500 font-bold ml-2">Contado</Text>
              </View>
              <Text className="text-2xl font-black text-gray-900">
                C$ {totalCash.toFixed(2)}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                {currentDaySales.length} ventas
              </Text>
            </View>

            <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm">
              <View className="flex-row items-center mb-2">
                <CreditCard size={20} color={Colors.warning} />
                <Text className="text-gray-500 font-bold ml-2">Fiado</Text>
              </View>
              <Text className="text-2xl font-black text-gray-900">
                C$ {totalCredit.toFixed(2)}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                {currentDayDebts.length} ventas
              </Text>
            </View>
          </View>

          {/* Total Card */}
          <View className="bg-indigo-600 p-6 rounded-2xl shadow-lg mb-6">
            <View className="flex-row items-center mb-2">
              <TrendingUp size={24} color="white" />
              <Text className="text-white font-bold ml-2 text-lg">
                Total del Día
              </Text>
            </View>
            <Text className="text-4xl font-black text-white">
              C$ {totalDay.toFixed(2)}
            </Text>
          </View>

          {/* Cash Sales */}
          {currentDaySales.length > 0 && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                Ventas de Contado
              </Text>
              {currentDaySales.map((sale) => (
                <View
                  key={sale.uuid}
                  className="mb-4 pb-4 border-b border-gray-100"
                >
                  <Text className="text-gray-500 text-xs mb-2">
                    {new Date(sale.createdAt).toLocaleTimeString("es-NI")}
                  </Text>
                  {sale.items.map((item, idx) => (
                    <Text key={idx} className="text-gray-700 font-bold">
                      • {item.name} x{item.quantity} - C${" "}
                      {(item.price * item.quantity).toFixed(2)}
                    </Text>
                  ))}
                  <Text className="text-indigo-600 font-black mt-2">
                    Total: C$ {sale.totalAmount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Credit Sales */}
          {currentDayDebts.length > 0 && (
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                Ventas Fiadas
              </Text>
              {currentDayDebts.map((debt) => (
                <View
                  key={debt.uuid}
                  className="mb-4 pb-4 border-b border-gray-100"
                >
                  <Text className="text-gray-500 text-xs mb-1">
                    {new Date(debt.createdAt).toLocaleTimeString("es-NI")}
                  </Text>
                  <Text className="text-gray-900 font-black mb-2">
                    Cliente: {debt.user.firstname} {debt.user.lastname}
                  </Text>
                  {debt.products.map((item, idx) => (
                    <Text key={idx} className="text-gray-700 font-bold">
                      • {item.name} x{item.quantity} - C${" "}
                      {(item.price * item.quantity).toFixed(2)}
                    </Text>
                  ))}
                  <Text className="text-orange-600 font-black mt-2">
                    Total: C$ {debt.amount.toFixed(2)}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    Vence: {new Date(debt.date_pay).toLocaleDateString("es-NI")}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity
            onPress={handleCloseCash}
            className="bg-indigo-600 py-5 px-6 rounded-2xl flex-row items-center justify-center shadow-lg active:bg-indigo-700 mb-8"
          >
            <Lock size={24} color="white" />
            <Text className="text-white font-black text-lg ml-3">
              Cerrar Caja del Día
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
