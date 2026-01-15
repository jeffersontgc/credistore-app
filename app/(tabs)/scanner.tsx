import React, { useState } from "react";
import { useToastStore } from "@/store/useToastStore";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCameraPermissions } from "expo-camera";
import { useStore, Product, User } from "@/store/useStore";
import { ScannerView } from "@/components/ScannerView";
import { ManualProductSelector } from "@/components/ManualProductSelector";
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
  ChevronRight,
  User as UserIcon,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ScannerScreen() {
  const { showToast } = useToastStore();
  const { products, processSale, processDebt } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "manual">("scanner");
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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

    const product = products.find((p) =>
      p.barcodes?.some((b) => b.barcode === data)
    );

    if (product) {
      addToCart(product);
    } else {
      showToast("error", "No encontrado", "Producto no registrado");
    }

    setSearching(false);
    setTimeout(() => setScanned(false), 2000);
  };

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

    try {
      processSale(items);
      showToast("success", "Éxito", "Venta registrada correctamente");
      setCart([]);
      setIsCheckoutOpen(false);
    } catch (e) {
      showToast("error", "Error", "No se pudo registrar la venta");
    }
  };

  const handleDebtSubmit = async () => {
    if (!selectedUser) {
      showToast("error", "Error", "Debes seleccionar un cliente");
      return;
    }

    const items = cart.map((item) => ({
      product_uuid: item.product.uuid,
      quantity: item.quantity,
    }));

    try {
      processDebt(selectedUser.uuid, dueDate.toISOString(), items);
      showToast(
        "success",
        "Éxito",
        `Fiado registrado para ${selectedUser.firstname}`
      );
      setCart([]);
      setIsDebtModalOpen(false);
      setIsCheckoutOpen(false);
      setSelectedUser(null);
    } catch (e) {
      showToast("error", "Error", "No se pudo registrar el fiado");
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 p-8">
        <View className="bg-white p-8 rounded-3xl shadow-xl items-center border border-gray-100">
          <View className="bg-indigo-100 p-4 rounded-full mb-6">
            <Scan size={48} color={Colors.primary} />
          </View>
          <Text className="text-2xl font-black text-gray-800 text-center mb-2">
            Acceso a Cámara
          </Text>
          <Text className="text-gray-500 text-center mb-8">
            Necesitamos permiso para escanear los códigos de barras de tus
            productos.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-indigo-600 px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200"
          >
            <Text className="text-white font-black text-lg">
              Permitir Acceso
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#4338ca", "#1e1b4b"]}
        className="pb-10 px-6 rounded-b-[40px] shadow-2xl relative"
      >
        <SafeAreaView edges={["top"]}>
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-1">
                Terminal de Venta
              </Text>
              <Text className="text-white text-3xl font-black">Scanner V2</Text>
            </View>
            <TouchableOpacity className="bg-white/20 p-3 rounded-2xl">
              <ShoppingCart size={24} color="white" />
              {cart.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full items-center justify-center border-2 border-indigo-900">
                  <Text className="text-white text-[10px] font-black">
                    {cart.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row bg-black/30 rounded-2xl p-1">
            <TouchableOpacity
              onPress={() => setActiveTab("scanner")}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{
                backgroundColor:
                  activeTab === "scanner" ? "white" : "transparent",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === "scanner" ? 0.1 : 0,
                shadowRadius: 2,
                elevation: activeTab === "scanner" ? 2 : 0,
              }}
            >
              <Scan
                size={18}
                color={activeTab === "scanner" ? Colors.primary : "white"}
              />
              <Text
                className="font-black ml-2"
                style={{
                  color: activeTab === "scanner" ? "#312e81" : "white",
                }}
              >
                Escáner
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("manual")}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{
                backgroundColor:
                  activeTab === "manual" ? "white" : "transparent",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === "manual" ? 0.1 : 0,
                shadowRadius: 2,
                elevation: activeTab === "manual" ? 2 : 0,
              }}
            >
              <Keyboard
                size={18}
                color={activeTab === "manual" ? Colors.primary : "white"}
              />
              <Text
                className="font-black ml-2"
                style={{
                  color: activeTab === "manual" ? "#312e81" : "white",
                }}
              >
                Manual
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content Area */}
      <View className="flex-1 mt-5 z-10">
        {activeTab === "scanner" ? (
          <ScannerView scanned={scanned} onScanned={handleBarCodeScanned} />
        ) : (
          <ManualProductSelector
            products={products}
            addToCart={(p, q) => addToCart(p, q)}
          />
        )}

        <View className="flex-1 mt-6 bg-white rounded-t-[45px] shadow-2xl overflow-hidden border-t border-gray-100">
          <View className="px-8 pt-8 pb-4 flex-row justify-between items-center">
            <Text className="text-2xl font-black text-indigo-950">Carrito</Text>
            {cart.length > 0 && (
              <TouchableOpacity
                onPress={() => setCart([])}
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
                    onPress={() => updateQuantity(item.product.uuid, -1)}
                    className="p-1 px-2"
                  >
                    <Minus size={14} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text className="font-black mx-2 text-indigo-950">
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.uuid, 1)}
                    className="p-1 px-2"
                  >
                    <Plus size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => removeFromCart(item.product.uuid)}
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
      </View>

      {/* GLOBAL Fixed Checkout Bar */}
      {cart.length > 0 && (
        <SafeAreaView
          edges={["bottom"]}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 pt-4 shadow-2xl"
          style={{
            elevation: 25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          }}
        >
          <View className="flex-row justify-between items-center pb-6">
            <View>
              <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                Total a cobrar
              </Text>
              <Text className="text-3xl font-black text-indigo-950">
                C$ {total.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsCheckoutOpen(true)}
              className="bg-indigo-600 px-8 py-4 rounded-2xl shadow-xl shadow-indigo-200 flex-row items-center active:scale-95 transition-all"
            >
              <Text className="text-white font-black text-lg mr-2 uppercase tracking-tighter">
                Cobrar
              </Text>
              <ChevronRight size={20} color="white" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Checkout Modal */}
      <Modal visible={isCheckoutOpen} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-white rounded-t-[50px] p-8 pb-14 border-t-2 border-indigo-100">
            <View className="w-12 h-1.5 bg-gray-200 self-center rounded-full mb-8" />
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-3xl font-black text-indigo-950">
                  Cobro
                </Text>
                <Text className="text-gray-400 font-bold mt-1">
                  Selecciona el método de pago
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCheckoutOpen(false)}
                className="bg-gray-100 p-3 rounded-full"
              >
                <X color="#1e1b4b" size={24} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <View className="flex-row space-x-6">
              <TouchableOpacity
                onPress={() => handleCheckout("CASH")}
                className="flex-1 bg-emerald-50 p-8 rounded-[40px] border-2 border-emerald-500/30 items-center justify-center h-52 shadow-sm"
              >
                <View className="bg-emerald-500 p-5 rounded-3xl mb-4 shadow-lg shadow-emerald-200">
                  <DollarSign size={36} color="white" strokeWidth={2.5} />
                </View>
                <Text className="text-emerald-950 font-black text-xl">
                  Contado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleCheckout("CREDIT")}
                className="flex-1 bg-amber-50 p-8 rounded-[40px] border-2 border-amber-500/30 items-center justify-center h-52 shadow-sm"
              >
                <View className="bg-amber-500 p-5 rounded-3xl mb-4 shadow-lg shadow-amber-200">
                  <CreditCard size={36} color="white" strokeWidth={2.5} />
                </View>
                <Text className="text-amber-950 font-black text-xl">Fiado</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Debt Modal */}
      <Modal visible={isDebtModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-white rounded-t-[50px] p-8 h-[92%] border-t-2 border-indigo-100">
            <View className="w-12 h-1.5 bg-gray-200 self-center rounded-full mb-8" />
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-3xl font-black text-indigo-950">
                Registrar Fiado
              </Text>
              <TouchableOpacity
                onPress={() => setIsDebtModalOpen(false)}
                className="bg-gray-100 p-3 rounded-full"
              >
                <X color="#1e1b4b" size={24} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <Text className="text-indigo-950 font-black text-lg mb-4">
                Seleccionar Cliente
              </Text>
              <UserSelectorV2
                onSelect={setSelectedUser}
                selectedUser={selectedUser}
              />

              <View className="mt-10">
                <Text className="text-indigo-950 font-black text-lg mb-4">
                  Plazo de Pago
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-indigo-50/50 p-6 rounded-[32px] flex-row justify-between items-center border border-indigo-100"
                >
                  <View className="flex-row items-center">
                    <Calendar
                      size={22}
                      color={Colors.primary}
                      className="mr-3"
                    />
                    <Text className="text-indigo-950 font-black text-lg">
                      {dueDate.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={Colors.primary} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, date) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (date) setDueDate(date);
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <LinearGradient
                colors={["#fff7ed", "#ffedd5"]}
                className="mt-10 p-8 rounded-[40px] border border-amber-100"
              >
                <Text className="text-amber-900 font-black text-lg mb-2">
                  Resumen
                </Text>
                <View className="flex-row justify-between items-end">
                  <Text className="text-amber-700 font-bold mb-1">
                    Monto total:
                  </Text>
                  <Text className="text-amber-900 font-black text-3xl">
                    C$ {total.toLocaleString()}
                  </Text>
                </View>
              </LinearGradient>

              <TouchableOpacity
                onPress={handleDebtSubmit}
                disabled={!selectedUser}
                className={`mt-10 py-6 rounded-[32px] items-center shadow-xl ${
                  !selectedUser
                    ? "bg-gray-200"
                    : "bg-indigo-600 shadow-indigo-200 active:bg-indigo-700"
                }`}
              >
                <Text className="text-white font-black text-xl uppercase tracking-widest">
                  Confirmar Fiado
                </Text>
              </TouchableOpacity>
              <View className="h-20" />
            </ScrollView>
          </View>
        </View>
      </Modal>
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

function UserSelectorV2({
  onSelect,
  selectedUser,
}: {
  onSelect: (u: User | null) => void;
  selectedUser: User | null;
}) {
  const [search, setSearch] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const { users } = useStore();

  const filteredUsers = users.filter((u) =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="relative" style={{ zIndex: 50 }}>
      <View className="flex-row items-center bg-gray-50 rounded-[28px] px-6 py-1 border border-gray-100 h-16">
        <UserIcon color="#94a3b8" size={22} strokeWidth={2.5} />
        <TextInput
          className="flex-1 ml-4 text-indigo-950 font-black text-lg"
          placeholder="Nombre del cliente..."
          placeholderTextColor="#cbd5e1"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setIsVisible(true);
          }}
          onFocus={() => setIsVisible(true)}
        />
      </View>

      {isVisible && search.length > 0 && (
        <View className="absolute top-[72px] left-0 right-0 bg-white rounded-[32px] shadow-2xl border border-gray-100 max-h-56 overflow-hidden z-50 p-2">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <TouchableOpacity
                  key={u.uuid}
                  onPress={() => {
                    onSelect(u);
                    setSearch(`${u.firstname} ${u.lastname}`);
                    setIsVisible(false);
                  }}
                  className="p-5 flex-row items-center active:bg-indigo-50 rounded-2xl mb-1"
                >
                  <View className="bg-indigo-600/10 p-3 rounded-2xl mr-4">
                    <UserIcon
                      size={20}
                      color={Colors.primary}
                      strokeWidth={2.5}
                    />
                  </View>
                  <View>
                    <Text className="text-indigo-950 font-black text-lg">
                      {u.firstname} {u.lastname}
                    </Text>
                    <Text className="text-gray-400 font-bold text-xs uppercase">
                      Tel: {u.phone}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="p-10 items-center">
                <Text className="text-gray-400 font-black italic">
                  No se encontraron clientes
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {selectedUser && !isVisible && (
        <LinearGradient
          colors={["#eef2ff", "#e0e7ff"]}
          className="mt-4 p-6 rounded-[32px] border border-indigo-100 flex-row items-center shadow-sm"
        >
          <View className="bg-indigo-600 p-4 rounded-2xl mr-5 shadow-lg shadow-indigo-200">
            <UserIcon size={24} color="white" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-indigo-950 font-black text-xl">
              {selectedUser.firstname} {selectedUser.lastname}
            </Text>
            <Text className="text-indigo-600 font-bold text-xs uppercase tracking-widest mt-0.5">
              Cliente Seleccionado
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onSelect(null)}
            className="bg-white/50 p-2 rounded-full"
          >
            <X size={16} color={Colors.primary} strokeWidth={3} />
          </TouchableOpacity>
        </LinearGradient>
      )}
    </View>
  );
}
