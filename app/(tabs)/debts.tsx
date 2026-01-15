import React, { useState } from "react";
import { useToastStore } from "@/store/useToastStore";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useStore, DebtStatus, Debt } from "@/store/useStore";
import { Search, User as UserIcon, CheckCircle } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import useDebounce from "@/hooks/useDebounce";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function DebtsScreen() {
  const { showToast } = useToastStore();
  const [search, setSearch] = useState("");
  const searchDebounce = useDebounce(search, 300);

  const { debts: allDebts, updateDebtStatus } = useStore();

  const debts = allDebts
    .filter((d) => {
      const name = `${d.user.firstname} ${d.user.lastname}`.toLowerCase();
      return name.includes(searchDebounce.toLowerCase());
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handlePay = (uuid: string) => {
    Alert.alert("Confirmar Pago", "¿Deseas marcar este fiado como PAGADO?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, Pagado",
        onPress: () => {
          updateDebtStatus(uuid, DebtStatus.PAID);
          showToast("success", "Éxito", "Deuda marcada como pagada");
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Debt }) => (
    <View className="bg-white p-4 mb-3 rounded-xl shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <View className="bg-gray-100 p-3 rounded-full mr-3">
            <UserIcon size={20} color="gray" />
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-800">
              {item.user.firstname} {item.user.lastname}
            </Text>
            <Text className="text-gray-500 text-xs">
              Vence: {new Date(item.date_pay).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-orange-600 font-bold text-xl">
            C$ {item.amount}
          </Text>
          <View
            className={`px-2 py-0.5 rounded ${
              item.status === DebtStatus.PAID ? "bg-green-100" : "bg-orange-100"
            }`}
          >
            <Text
              className={`text-[10px] font-bold uppercase ${
                item.status === DebtStatus.PAID
                  ? "text-green-700"
                  : "text-orange-700"
              }`}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      {item.status !== DebtStatus.PAID && (
        <TouchableOpacity
          onPress={() => handlePay(item.uuid)}
          className="bg-indigo-600 p-3 rounded-xl flex-row justify-center items-center"
        >
          <CheckCircle color="white" size={18} />
          <Text className="text-white font-bold ml-2">Marcar como Pagado</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScreenHeader title="Fiados" subtitle="CUENTAS POR COBRAR" />
      <View
        style={{
          flex: 1,
          paddingTop: 16,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center bg-white mx-3 px-3 py-2 rounded-2xl mb-4 shadow-sm border border-gray-100">
          <Search color={Colors.primary} size={20} />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800 font-medium"
            placeholder="Buscar deudor..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={debts}
          renderItem={renderItem}
          keyExtractor={(item) => item.uuid}
        />
      </View>
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
