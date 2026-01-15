import React, { useState } from "react";
import { useToastStore } from "@/store/useToastStore";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCameraPermissions } from "expo-camera";
import { useStore, Product, User } from "@/store/useStore";
import { ScannerView } from "@/components/ScannerView";
import { ManualProductSelector } from "@/components/ManualProductSelector";
import { ShoppingCart, Scan, Keyboard } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { CartList } from "@/components/scanner/CartList";
import { CheckoutBar } from "@/components/scanner/CheckoutBar";
import { CheckoutModal } from "@/components/scanner/CheckoutModal";
import { CashPaymentModal } from "@/components/scanner/CashPaymentModal";
import { DebtPaymentModal } from "@/components/scanner/DebtPaymentModal";

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
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "manual">("scanner");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [amountReceived, setAmountReceived] = useState("");

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

    if (type === "CASH") {
      setIsCashModalOpen(true);
      setAmountReceived("");
      return;
    }
  };

  const confirmSale = () => {
    const items = cart.map((item) => ({
      product_uuid: item.product.uuid,
      quantity: item.quantity,
    }));

    try {
      processSale(items);
      showToast("success", "Éxito", "Venta registrada correctamente");
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCashModalOpen(false);
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

  if (!permission) {
    // Camera permissions are still loading
    return <View className="flex-1 bg-white" />;
  }

  if (!permission.granted) {
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

        <CartList
          cart={cart}
          onClear={() => setCart([])}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
        />
      </View>

      {/* GLOBAL Fixed Checkout Bar */}
      {cart.length > 0 && (
        <CheckoutBar total={total} onCheckout={() => setIsCheckoutOpen(true)} />
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        visible={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSelectPaymentMethod={handleCheckout}
      />

      {/* Cash Payment Modal */}
      <CashPaymentModal
        visible={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        total={total}
        amountReceived={amountReceived}
        setAmountReceived={setAmountReceived}
        onConfirm={confirmSale}
      />

      {/* Debt Modal */}
      <DebtPaymentModal
        visible={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        dueDate={dueDate}
        setDueDate={setDueDate}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        total={total}
        onConfirm={handleDebtSubmit}
      />
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
