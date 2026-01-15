import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMutation, useApolloClient, useQuery } from "@apollo/client/react";
import {
  GET_PRODUCT_BY_BARCODE,
  CREATE_SALE,
  GET_PRODUCTS,
} from "@/lib/queries";
import {
  GetProductByBarcodeQuery,
  GetProductByBarcodeQueryVariables,
  CreateSaleMutation,
  CreateSaleMutationVariables,
  Product,
  GetProductsQuery,
  GetProductsQueryVariables,
} from "@/types/graphql";
import {
  Trash2,
  ShoppingCart,
  X,
  CreditCard,
  DollarSign,
  Search,
  Plus,
  Minus,
  Scan,
  Keyboard,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ScannerScreen() {
  const client = useApolloClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "manual">("scanner");
  const [manualSearch, setManualSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [manualQuantity, setManualQuantity] = useState(1);

  // Removed useLazyQuery in favor of client.query for imperative fetching

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || searching) return;
    setScanned(true);
    setSearching(true);

    try {
      const result = await client.query<
        GetProductByBarcodeQuery,
        GetProductByBarcodeQueryVariables
      >({
        query: GET_PRODUCT_BY_BARCODE,
        variables: { barcode: data },
        fetchPolicy: "network-only",
      });

      if (result.data?.productByBarcode) {
        addToCart(result.data.productByBarcode);
        // Play beep sound here if possible
      } else {
        Alert.alert("No encontrado", "Producto no registrado");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Producto no encontrado o error de red");
    } finally {
      setSearching(false);
      setTimeout(() => setScanned(false), 1500);
    }
  };

  const [createSale, { loading: processing }] = useMutation<
    CreateSaleMutation,
    CreateSaleMutationVariables
  >(CREATE_SALE, {
    onCompleted: (data) => {
      Alert.alert(
        "Éxito",
        `Venta registrada. Total: C$ ${data.createSale.totalAmount}`
      );
      setCart([]);
      setIsCheckoutOpen(false);
    },
    onError: (err) => {
      Alert.alert("Error", err.message);
    },
  });

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center mb-4 text-lg">
          Necesitamos permiso para usar la cámara
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-indigo-600 p-3 rounded-lg"
        >
          <Text className="text-white font-bold">Permitir Cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.uuid === product.uuid);
      if (existing) {
        return prev.map((item) =>
          item.product.uuid === product.uuid
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuantity = (uuid: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.uuid === uuid
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeFromCart = (uuid: string) => {
    setCart((prev) => prev.filter((item) => item.product.uuid !== uuid));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = async (type: "CASH" | "CREDIT") => {
    if (type === "CREDIT") {
      Alert.alert(
        "Pendiente",
        "Módulo de Fiado en desarrollo. Usar módulo de Fiados por ahora."
      );
      return;
    }

    const items = cart.map((item) => ({
      product_uuid: item.product.uuid,
      quantity: item.quantity,
    }));

    await createSale({ variables: { input: { items } } });
  };

  return (
    <View className="flex-1 bg-black">
      {/* Tab Switcher */}
      <View className="flex-row bg-gray-900 m-4 rounded-xl p-1 border border-gray-800">
        <TouchableOpacity
          onPress={() => setActiveTab("scanner")}
          className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
            activeTab === "scanner" ? "bg-indigo-600" : ""
          }`}
        >
          <Scan size={18} color="white" />
          <Text className="text-white font-bold ml-2">Escáner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("manual")}
          className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
            activeTab === "manual" ? "bg-indigo-600" : ""
          }`}
        >
          <Keyboard size={18} color="white" />
          <Text className="text-white font-bold ml-2">Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Top View (Scanner or Manual Selection) */}
      <View className="h-[45%] overflow-hidden rounded-b-3xl relative">
        {activeTab === "scanner" ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "code128"],
              }}
            />
            <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center">
              <View className="w-64 h-64 border-2 border-white/50 rounded-lg opacity-50" />
              {searching && (
                <ActivityIndicator
                  size="large"
                  color="white"
                  className="absolute"
                />
              )}
            </View>
            <View className="absolute bottom-4 self-center bg-black/60 px-4 py-2 rounded-full">
              <Text className="text-white font-bold">
                {scanned ? "Procesando..." : "Escanea un código"}
              </Text>
            </View>
          </>
        ) : (
          <ManualProductSelector
            onSelect={(p, q) => {
              addToCart(p, q);
              setSelectedProduct(null);
              setManualQuantity(1);
            }}
          />
        )}
      </View>

      {/* Cart View (Bottom Half) */}
      <View className="flex-1 bg-gray-100 -mt-6 rounded-t-3xl p-4 pt-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">
            Carrito de Venta
          </Text>
          <TouchableOpacity onPress={() => setCart([])}>
            <Text className="text-red-500 font-medium">Limpiar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={cart}
          keyExtractor={(item) => item.product.uuid}
          renderItem={({ item }) => (
            <View className="flex-row justify-between items-center bg-white p-3 mb-2 rounded-xl shadow-sm">
              <View className="flex-1">
                <Text className="font-bold text-gray-800" numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text className="text-indigo-600 font-bold">
                  C$ {item.product.price} x {item.quantity}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="flex-row items-center bg-gray-100 rounded-lg mr-4 p-1">
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.uuid, -1)}
                  >
                    <Minus size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text className="mx-3 font-bold">{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.uuid, 1)}
                  >
                    <Plus size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => removeFromCart(item.product.uuid)}
                  className="bg-red-100 p-2 rounded-lg"
                >
                  <Trash2 size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center mt-10">
              <ShoppingCart size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2">Carrito vacío</Text>
            </View>
          }
        />

        {/* Total & Checkout */}
        <View className="mt-4 border-t border-gray-200 pt-4">
          <View className="flex-row justify-between mb-4">
            <Text className="text-xl font-bold text-gray-600">Total</Text>
            <Text className="text-3xl font-bold text-indigo-600">
              C$ {total}
            </Text>
          </View>
          <TouchableOpacity
            className={`w-full bg-indigo-600 p-4 rounded-xl items-center shadow-lg ${
              cart.length === 0 ? "opacity-50" : ""
            }`}
            disabled={cart.length === 0}
            onPress={() => setIsCheckoutOpen(true)}
          >
            <Text className="text-white font-bold text-xl">Cobrar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Checkout Modal */}
      <Modal visible={isCheckoutOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-800">
                Método de Pago
              </Text>
              <TouchableOpacity onPress={() => setIsCheckoutOpen(false)}>
                <X color="gray" size={24} />
              </TouchableOpacity>
            </View>

            <View className="flex-row space-x-4 mb-8">
              <TouchableOpacity
                className="flex-1 bg-green-100 p-6 rounded-2xl items-center border-2 border-green-500"
                onPress={() => handleCheckout("CASH")}
                disabled={processing}
              >
                <DollarSign size={40} color="#15803d" />
                <Text className="font-bold text-green-700 mt-2 text-lg">
                  Contado
                </Text>
                {processing && (
                  <ActivityIndicator color="green" className="mt-2" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-orange-100 p-6 rounded-2xl items-center border-2 border-orange-500"
                onPress={() => handleCheckout("CREDIT")}
              >
                <CreditCard size={40} color="#c2410c" />
                <Text className="font-bold text-orange-700 mt-2 text-lg">
                  Fiado
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ManualProductSelector({
  onSelect,
}: {
  onSelect: (p: Product, q: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data, loading } = useQuery<
    GetProductsQuery,
    GetProductsQueryVariables
  >(GET_PRODUCTS, {
    variables: { search, page: 1, limit: 10 },
  });

  const products = data?.findAllProducts?.data || [];

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-gray-800 font-bold text-lg mb-4">
        Selección Manual
      </Text>

      <Dropdown
        style={{
          height: 60,
          backgroundColor: "#F3F4F6",
          borderRadius: 16,
          paddingHorizontal: 16,
        }}
        placeholderStyle={{ color: "#9CA3AF" }}
        selectedTextStyle={{ color: "#1F2937", fontWeight: "bold" }}
        inputSearchStyle={{ height: 40, borderRadius: 8 }}
        data={products.map((p) => ({ label: p.name, value: p.uuid, raw: p }))}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder="Buscar producto..."
        searchPlaceholder="Escribe el nombre..."
        onChangeText={(text) => setSearch(text)}
        onChange={(item) => setSelectedProduct(item.raw)}
        renderLeftIcon={() => (
          <Search color="#9CA3AF" size={20} style={{ marginRight: 8 }} />
        )}
      />

      {selectedProduct && (
        <View className="mt-6 bg-indigo-50 p-6 rounded-3xl animate-in">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-1">
              <Text className="text-indigo-800 font-bold text-xl">
                {selectedProduct.name}
              </Text>
              <Text className="text-indigo-600 font-bold text-lg">
                C$ {selectedProduct.price}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 font-bold">Cantidad</Text>
            <View className="flex-row items-center bg-white rounded-2xl p-2 shadow-sm">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-indigo-100 p-2 rounded-xl"
              >
                <Minus size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text className="mx-6 text-2xl font-bold text-gray-800">
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                className="bg-indigo-100 p-2 rounded-xl"
              >
                <Plus size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onSelect(selectedProduct, quantity)}
            className="bg-indigo-600 mt-8 py-4 rounded-2xl items-center shadow-lg"
          >
            <Text className="text-white font-bold text-lg">
              Agregar al Carrito
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
