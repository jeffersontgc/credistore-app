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
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMutation, useApolloClient, useQuery } from "@apollo/client/react";
import useDebounce from "@/hooks/useDebounce";
import {
  GET_PRODUCT_BY_BARCODE,
  CREATE_SALE,
  GET_PRODUCTS,
  GET_USERS,
  CREATE_DEBT,
} from "@/lib/queries";
import {
  GetProductByBarcodeQuery,
  GetProductByBarcodeQueryVariables,
  CreateSaleMutation,
  CreateSaleMutationVariables,
  Product,
  User,
  GetProductsQuery,
  GetProductsQueryVariables,
  GetUsersQuery,
  CreateDebtMutation,
  CreateDebtMutationVariables,
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
  Calendar,
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
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const [createDebt, { loading: processingDebt }] = useMutation<
    CreateDebtMutation,
    CreateDebtMutationVariables
  >(CREATE_DEBT, {
    onCompleted: (data) => {
      Alert.alert(
        "Éxito",
        `Fiado registrado para ${data.createDebt.user.firstname}. Monto: C$ ${data.createDebt.amount}`
      );
      setCart([]);
      setIsDebtModalOpen(false);
      setIsCheckoutOpen(false);
    },
    onError: (err) => {
      Alert.alert("Error al registrar fiado", err.message);
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
      setIsDebtModalOpen(true);
      return;
    }

    const items = cart.map((item) => ({
      product_uuid: item.product.uuid,
      quantity: item.quantity,
    }));

    await createSale({ variables: { input: { items } } });
  };

  const handleDebtSubmit = async () => {
    if (!selectedUser) {
      Alert.alert("Error", "Debes seleccionar un cliente");
      return;
    }

    const products = cart.map((item) => ({
      product_uuid: item.product.uuid,
      quantity: item.quantity,
    }));

    await createDebt({
      variables: {
        input: {
          user_uuid: selectedUser.uuid,
          dueDate: dueDate.toISOString(),
          products,
        },
      },
    });
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

      {/* Debt (Fiado) Modal */}
      <Modal visible={isDebtModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-800">
                Registrar Fiado
              </Text>
              <TouchableOpacity onPress={() => setIsDebtModalOpen(false)}>
                <X color="gray" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
              <Text className="text-gray-600 font-bold mb-2">
                Seleccionar Cliente
              </Text>
              <UserSelector
                onSelect={setSelectedUser}
                selectedUser={selectedUser}
              />

              <View className="mt-8">
                <Text className="text-gray-600 font-bold mb-2">
                  Fecha a Pagar
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-gray-100 p-4 rounded-2xl flex-row justify-between items-center"
                >
                  <Text className="text-gray-800 font-medium">
                    {dueDate.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                  <Calendar size={20} color={Colors.primary} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (date) setDueDate(date);
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <View className="mt-8 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <Text className="text-orange-800 font-bold">
                  Resumen de Cuenta
                </Text>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-orange-600">Total a fiar:</Text>
                  <Text className="text-orange-800 font-black text-xl">
                    C$ {total}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleDebtSubmit}
                disabled={processingDebt || !selectedUser}
                className={`bg-indigo-600 mt-8 py-5 rounded-2xl items-center shadow-lg ${
                  processingDebt || !selectedUser ? "opacity-50" : ""
                }`}
              >
                {processingDebt ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black text-lg">
                    Confirmar Fiado
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function UserSelector({
  onSelect,
  selectedUser,
}: {
  onSelect: (u: User) => void;
  selectedUser: User | null;
}) {
  const [search, setSearch] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const { data, loading } = useQuery<GetUsersQuery>(GET_USERS);

  const users = data?.users || [];
  const filteredUsers = users.filter((u) =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="relative z-50">
      <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-1 border border-gray-200">
        <Search color="#6B7280" size={20} />
        <TextInput
          className="flex-1 h-12 ml-2 text-gray-800 font-medium"
          placeholder="Nombre del cliente..."
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setIsVisible(true);
          }}
          onFocus={() => setIsVisible(true)}
        />
      </View>

      {isVisible && search.length > 0 && (
        <View className="absolute top-14 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-48 overflow-hidden z-50">
          <ScrollView keyboardShouldPersistTaps="handled">
            {loading ? (
              <ActivityIndicator className="p-4" />
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <TouchableOpacity
                  key={u.uuid}
                  onPress={() => {
                    onSelect(u);
                    setSearch(`${u.firstname} ${u.lastname}`);
                    setIsVisible(false);
                  }}
                  className="p-4 border-b border-gray-50 active:bg-indigo-50"
                >
                  <Text className="text-gray-800 font-bold">
                    {u.firstname} {u.lastname}
                  </Text>
                  <Text className="text-gray-400 text-xs">{u.email}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="p-4 text-gray-400 italic">No encontrado</Text>
            )}
          </ScrollView>
        </View>
      )}

      {selectedUser && !isVisible && (
        <View className="mt-2 bg-green-50 p-3 rounded-xl border border-green-100 flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
          <Text className="text-green-800 font-medium">
            Seleccionado: {selectedUser.firstname}
          </Text>
        </View>
      )}
    </View>
  );
}

function ManualProductSelector({
  onSelect,
}: {
  onSelect: (p: Product, q: number) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isListVisible, setIsListVisible] = useState(false);

  const { data, loading } = useQuery<
    GetProductsQuery,
    GetProductsQueryVariables
  >(GET_PRODUCTS, {
    variables: { search: debouncedSearch, page: 1, limit: 10 },
    skip: !debouncedSearch && !isListVisible,
  });

  const products = data?.findAllProducts?.data || [];

  return (
    <View className="flex-1 bg-white p-5">
      <Text className="text-gray-800 font-bold text-xl mb-4">Venta Manual</Text>

      {/* Search Input */}
      <View className="relative z-10">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-1 border border-gray-200 shadow-sm">
          <Search color="#6B7280" size={20} />
          <TextInput
            className="flex-1 h-12 ml-2 text-gray-800 font-medium"
            placeholder="Buscar producto..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setIsListVisible(true);
            }}
            onFocus={() => setIsListVisible(true)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X color="#9CA3AF" size={18} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results Dropdown */}
        {isListVisible && (search.length > 0 || products.length > 0) && (
          <View className="absolute top-14 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-64 overflow-hidden z-50">
            <ScrollView keyboardShouldPersistTaps="handled">
              {loading ? (
                <View className="p-4 items-center">
                  <ActivityIndicator color={Colors.primary} size="small" />
                </View>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <TouchableOpacity
                    key={p.uuid}
                    onPress={() => {
                      setSelectedProduct(p);
                      setIsListVisible(false);
                      setSearch(p.name);
                    }}
                    className="p-4 border-b border-gray-50 flex-row justify-between items-center active:bg-indigo-50"
                  >
                    <View className="flex-1">
                      <Text className="text-gray-800 font-bold">{p.name}</Text>
                      <Text className="text-gray-400 text-xs">
                        Stock: {p.stock}
                      </Text>
                    </View>
                    <Text className="text-indigo-600 font-bold">
                      C$ {p.price}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="p-4 items-center">
                  <Text className="text-gray-400 italic text-sm">
                    No se encontraron productos
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Selected Product Card */}
      {selectedProduct ? (
        <View className="mt-6 bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm animate-in fade-in zoom-in duration-300">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text
                className="text-indigo-900 font-extrabold text-2xl"
                numberOfLines={2}
              >
                {selectedProduct.name}
              </Text>
              <Text className="text-indigo-600 font-bold text-xl mt-1">
                C$ {selectedProduct.price}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedProduct(null)}
              className="bg-white/50 p-1 rounded-full"
            >
              <X color={Colors.primary} size={20} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between bg-white/40 p-4 rounded-2xl">
            <Text className="text-indigo-800 font-bold text-lg">Cantidad</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-white w-10 h-10 rounded-xl items-center justify-center shadow-sm"
              >
                <Minus size={20} color={Colors.primary} />
              </TouchableOpacity>
              <Text className="mx-6 text-2xl font-black text-indigo-950">
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                className="bg-white w-10 h-10 rounded-xl items-center justify-center shadow-sm"
              >
                <Plus size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onSelect(selectedProduct, quantity)}
            className="bg-indigo-600 mt-8 py-5 rounded-2xl items-center shadow-lg shadow-indigo-200 active:scale-[0.98]"
          >
            <View className="flex-row items-center">
              <Plus color="white" size={20} style={{ marginRight: 8 }} />
              <Text className="text-white font-black text-lg">
                Agregar al Carrito
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="mt-10 items-center opacity-30">
          <ShoppingCart size={80} color="#6B7280" />
          <Text className="text-gray-500 font-bold mt-4 text-center">
            Busca un producto para{"\n"}comenzar la venta manual
          </Text>
        </View>
      )}
    </View>
  );
}
