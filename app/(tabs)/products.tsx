import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@apollo/client/react";
import { GET_PRODUCTS } from "@/lib/queries";
import { GetProductsQuery, GetProductsQueryVariables } from "@/types/graphql";
import { Search, Plus, AlertCircle } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, fetchMore, refetch } = useQuery<
    GetProductsQuery,
    GetProductsQueryVariables
  >(GET_PRODUCTS, {
    variables: { search, page: 1, limit: 10 },
    notifyOnNetworkStatusChange: true,
  });

  const products = data?.findAllProducts?.data || [];
  const hasNextPage = data?.findAllProducts?.hasNextPage;

  const loadMore = () => {
    if (hasNextPage && !loading) {
      fetchMore({
        variables: { page: page + 1 },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            findAllProducts: {
              ...fetchMoreResult.findAllProducts,
              data: [
                ...prev.findAllProducts.data,
                ...fetchMoreResult.findAllProducts.data,
              ],
            },
          };
        },
      });
      setPage((p) => p + 1);
    }
  };

  const renderItem = ({ item }: any) => (
    <View className="bg-white p-4 mb-3 rounded-xl shadow-sm flex-row justify-between items-center">
      <View>
        <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
        <Text className="text-gray-500">
          {item.barcodes && item.barcodes.length > 0
            ? item.barcodes[0].barcode
            : "Sin código"}
        </Text>
        {item.stock <= item.min_stock && (
          <View className="flex-row items-center mt-1">
            <AlertCircle size={14} color={Colors.warning} />
            <Text className="text-amber-500 text-xs ml-1 font-bold">
              Stock Bajo
            </Text>
          </View>
        )}
      </View>
      <View className="items-end">
        <Text className="text-indigo-600 font-bold text-xl">
          C$ {item.price}
        </Text>
        <Text className="text-gray-400 text-sm">{item.stock} unid.</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4">
      {/* Search Bar */}
      <View className="flex-row items-center bg-white p-3 rounded-xl mb-4 shadow-sm border border-gray-200">
        <Search color={Colors.textLight} size={20} />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-800"
          placeholder="Buscar productos..."
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setPage(1);
          }}
          onEndEditing={() => refetch({ search, page: 1 })}
        />
      </View>

      {/* List */}
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.uuid}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator className="mt-4" /> : null
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full justify-center items-center shadow-lg active:bg-indigo-700"
        onPress={() => console.log("Create Product")}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>
    </View>
  );
}
