import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Scan, Plus, CreditCard, DollarSign, Lock } from "lucide-react-native";
import { useStore } from "@/store/useStore";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function DashboardScreen() {
  const router = useRouter();
  const { currentDaySales, currentDayDebts } = useStore();

  const metrics = useMemo(() => {
    const todaySales = currentDaySales.reduce(
      (acc, s) => acc + s.totalAmount,
      0
    );
    const todayCredits = currentDayDebts.reduce((acc, d) => acc + d.amount, 0);

    return { todaySales, todayCredits };
  }, [currentDaySales, currentDayDebts]);

  const ActionCard = ({ title, icon: Icon, color, route }: any) => (
    <TouchableOpacity
      className={`flex-1 ${color} p-4 rounded-xl gap-2 h-32 justify-center items-center shadow-sm`}
      onPress={() => router.push(route)}
    >
      <Icon color="white" size={32} />
      <Text className="text-white font-bold mt-2">{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScreenHeader title="Resumen" subtitle="HOLA, VENDEDOR" />
      <ScrollView
        className="flex-1 p-4 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-between mb-4 bg-white p-4 rounded-2xl shadow-sm">
          <View className="items-center flex-1 border-r border-gray-100">
            <Text className="text-gray-400 text-sm">Ventas Hoy</Text>
            <Text className="text-2xl font-bold text-green-600">
              C$ {metrics.todaySales.toLocaleString()}
            </Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-gray-400 text-sm">Créditos Hoy</Text>
            <Text className="text-2xl font-bold text-orange-500">
              C$ {metrics.todayCredits.toLocaleString()}
            </Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-gray-800 mb-3">
          Acciones Rápidas
        </Text>
        <View className="flex-row gap-2 mb-2">
          <ActionCard
            title="Nueva Venta"
            icon={Scan}
            color="bg-indigo-600"
            route="/(tabs)/scanner"
          />
          <ActionCard
            title="Fiadores"
            icon={CreditCard}
            color="bg-orange-500"
            route="/debts"
          />
        </View>
        <View className="flex-row gap-2">
          <ActionCard
            title="Productos"
            icon={Plus}
            color="bg-blue-500"
            route="/(tabs)/products"
          />
          <ActionCard
            title="Cierre de Caja"
            icon={Lock}
            color="bg-purple-600"
            route="/cash-closure"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
  },
});
