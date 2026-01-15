import React, { useState } from "react";
import { View, Text, FlatList, TextInput } from "react-native";
import { useQuery } from "@apollo/client/react";
import { GET_DEBTS } from "@/lib/queries";
import { GetDebtsQuery, GetDebtsQueryVariables } from "@/types/graphql";
import { Search, User } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import useDebounce from "@/hooks/useDebounce";

export default function DebtsScreen() {
  const [search, setSearch] = useState("");
  const searchDebounce = useDebounce(search, 500);

  const { data, loading, refetch } = useQuery<
    GetDebtsQuery,
    GetDebtsQueryVariables
  >(GET_DEBTS, {
    variables: { search: searchDebounce, page: 1, limit: 20 },
  });

  const debts = data?.findAllDebts?.data || [];

  const renderItem = ({ item }: any) => (
    <View className="bg-white p-4 mb-3 rounded-xl shadow-sm flex-row justify-between items-center">
      <View className="flex-row items-center">
        <View className="bg-gray-100 p-3 rounded-full mr-3">
          <User size={20} color="gray" />
        </View>
        <View>
          <Text className="text-lg font-bold text-gray-800">
            {item.user
              ? `${item.user.firstname} ${item.user.lastname}`
              : "Cliente Desconocido"}
          </Text>
          <Text className="text-gray-500 text-xs">
            Actualizado: {new Date(item.updated_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-orange-600 font-bold text-xl">
          C$ {item.amount}
        </Text>
        <Text
          className={`text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-600`}
        >
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <View className="flex-row items-center bg-white p-3 rounded-xl mb-4 shadow-sm border border-gray-200">
        <Search color={Colors.textLight} size={20} />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-800"
          placeholder="Buscar deudor..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={debts}
        renderItem={renderItem}
        keyExtractor={(item) => item.uuid}
        refreshing={loading}
        onRefresh={refetch}
      />
    </View>
  );
}
