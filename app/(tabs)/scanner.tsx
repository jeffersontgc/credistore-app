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
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMutation, useApolloClient } from "@apollo/client/react";
import { GET_PRODUCT_BY_BARCODE, CREATE_SALE } from "@/lib/queries";
import {
  GetProductByBarcodeQuery,
  GetProductByBarcodeQueryVariables,
  CreateSaleMutation,
  CreateSaleMutationVariables,
  Product,
} from "@/types/graphql";
import {
  Trash2,
  ShoppingCart,
  X,
  CreditCard,
  DollarSign,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";

export default function ScannerScreen() {
  const client = useApolloClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.uuid === product.uuid);
      if (existing) {
        return prev.map((item) =>
          item.product.uuid === product.uuid
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
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
      {/* Camera View (Top Half) */}
      <View className="h-1/2 overflow-hidden rounded-b-3xl relative">
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
                <Text className="font-bold text-lg mr-4">
                  C$ {item.product.price * item.quantity}
                </Text>
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
