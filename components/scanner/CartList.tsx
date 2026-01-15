import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { Product } from "@/store/useStore";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartListProps {
  cart: CartItem[];
  onClear: () => void;
  onUpdateQuantity: (uuid: string, delta: number) => void;
  onRemove: (uuid: string) => void;
}

export function CartList({
  cart,
  onClear,
  onUpdateQuantity,
  onRemove,
}: CartListProps) {
  return (
    <View className="flex-1 mt-6 bg-white rounded-t-[45px] shadow-2xl overflow-hidden border-t border-gray-100">
      <View className="px-8 pt-8 pb-4 flex-row justify-between items-center">
        <Text className="text-2xl font-black text-indigo-950">Carrito</Text>
        {cart.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            className="bg-red-50 px-4 py-2 rounded-xl"
          >
            <Text className="text-red-500 font-bold text-xs">LIMPIAR</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.uuid}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: cart.length > 0 ? 150 : 40,
        }}
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-gray-50 p-4 mb-3 rounded-2xl border border-gray-100">
            <View className="bg-indigo-100 p-3 rounded-xl mr-4 shadow-sm">
              <ShoppingCart size={20} color={Colors.primary} />
            </View>
            <View className="flex-1">
              <Text
                className="font-black text-indigo-950 text-base"
                numberOfLines={1}
              >
                {item.product.name}
              </Text>
              <Text className="text-indigo-600 font-bold">
                C$ {item.product.price.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row items-center bg-white rounded-xl border border-gray-100 p-1">
              <TouchableOpacity
                onPress={() => onUpdateQuantity(item.product.uuid, -1)}
                className="p-1 px-2"
              >
                <Minus size={14} color={Colors.primary} />
              </TouchableOpacity>
              <Text className="font-black mx-2 text-indigo-950">
                {item.quantity}
              </Text>
              <TouchableOpacity
                onPress={() => onUpdateQuantity(item.product.uuid, 1)}
                className="p-1 px-2"
              >
                <Plus size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => onRemove(item.product.uuid)}
              className="ml-3 p-2 bg-white rounded-xl shadow-sm border border-red-50"
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <View className="bg-gray-50 p-8 rounded-full mb-4 border border-gray-100">
              <ShoppingCart size={40} color="#cbd5e1" />
            </View>
            <Text className="text-gray-400 font-bold">
              Tu carrito está vacío
            </Text>
          </View>
        }
      />
    </View>
  );
}
