import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Search, X, ChevronRight, Minus, Plus } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import useDebounce from "@/hooks/useDebounce";
import { Product } from "@/store/useStore";

interface ManualProductSelectorProps {
  products: Product[];
  addToCart: (product: Product, quantity: number) => void;
}

export function ManualProductSelector({
  products: allProducts,
  addToCart,
}: ManualProductSelectorProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isListVisible, setIsListVisible] = useState(false);

  const products = allProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.barcodes?.some((b) =>
          b.barcode.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
    )
    .slice(0, 10);

  return (
    <View className="px-6 relative" style={{ zIndex: 10 }}>
      {/* Search Input Container */}
      <View
        className="flex-row items-center bg-white rounded-3xl px-6 py-1 border border-gray-200"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Search color={Colors.primary} size={20} />
        <TextInput
          className="flex-1 h-14 ml-4 text-indigo-950 font-black text-lg"
          placeholder="¿Qué producto buscas?"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setIsListVisible(true);
          }}
          onFocus={() => setIsListVisible(true)}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearch("");
              setIsListVisible(false);
            }}
          >
            <View className="bg-gray-100 p-2 rounded-full">
              <X color="#64748b" size={14} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {isListVisible && search.length > 0 && (
        <View
          className="absolute top-[70px] left-6 right-6 bg-white rounded-[32px] shadow-lg border border-gray-100 max-h-72 overflow-hidden"
          style={{ zIndex: 50 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {products.length > 0 ? (
              products.map((p) => (
                <TouchableOpacity
                  key={p.uuid}
                  onPress={() => {
                    setSelectedProduct(p);
                    setIsListVisible(false);
                    setSearch(p.name);
                    setQuantity(1);
                  }}
                  className="p-5 border-b border-gray-50 flex-row justify-between items-center active:bg-indigo-50"
                >
                  <View className="flex-1 mr-4">
                    <Text
                      className="text-indigo-950 font-black text-base"
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <Text className="text-gray-400 font-bold text-xs uppercase mt-0.5">
                      S: {p.stock} | C$ {p.price}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.primary} />
                </TouchableOpacity>
              ))
            ) : (
              <View className="p-8 items-center">
                <Text className="text-gray-400 font-bold italic">
                  No encontrado
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {selectedProduct && !isListVisible && (
        <LinearGradient colors={["#f8fafc", "#f1f5f9"]} className="mt-4 p-6">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1 mr-4">
              <Text className="text-indigo-950 font-black text-xl leading-tight">
                {selectedProduct.name}
              </Text>
              <Text className="text-indigo-600 font-black text-xl mt-1">
                C$ {selectedProduct.price}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedProduct(null)}
              className="bg-white p-2 rounded-full shadow-sm"
            >
              <X color={Colors.primary} size={18} strokeWidth={3} />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center bg-white rounded-2xl p-1.5 border border-indigo-100 shadow-sm">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 bg-indigo-50 rounded-xl"
              >
                <Minus size={18} color={Colors.primary} strokeWidth={3} />
              </TouchableOpacity>
              <Text className="font-black mx-6 text-2xl text-indigo-950">
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                className="p-2.5 bg-indigo-50 rounded-xl"
              >
                <Plus size={18} color={Colors.primary} strokeWidth={3} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                addToCart(selectedProduct, quantity);
                setSelectedProduct(null);
                setSearch("");
              }}
              className="bg-indigo-600 p-5 rounded-3xl shadow-lg shadow-indigo-200 px-8 active:bg-indigo-700"
            >
              <Text className="text-white font-black text-lg uppercase">
                Añadir
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}
    </View>
  );
}
