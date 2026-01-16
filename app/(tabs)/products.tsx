import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { useStore, ProductType, Product } from "@/store/useStore";
import {
  Search,
  Plus,
  AlertCircle,
  X,
  Check,
  Camera,
  Pencil,
  Package,
  Trash2,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import useDebounce from "@/hooks/useDebounce";
import { useForm, Controller } from "react-hook-form";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LinearGradient } from "expo-linear-gradient";
import useKeyboard from "@/hooks/useKeyboard";

import { useToastStore } from "@/store/useToastStore";

interface CreateProductForm {
  name: string;
  barcode?: string;
  price: string;
  cost_price: string;
  stock: string;
  min_stock: string;
  type: ProductType;
  weight_lb?: string; // Peso en libras/litros
}

export default function ProductsScreen() {
  const { showToast } = useToastStore();
  const insets = useSafeAreaInsets(); // ✅ SAFE AREA FIX ANDROID

  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGranoBasico, setIsGranoBasico] = useState(false);

  const searchDebounce = useDebounce(search, 300);
  const {
    products: allProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useStore();

  const products = allProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchDebounce.toLowerCase()) ||
        (p.barcodes &&
          p.barcodes.some((b) => b.barcode.includes(searchDebounce)))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductForm>({
    defaultValues: {
      name: "",
      barcode: "",
      price: "0",
      cost_price: "0",
      stock: "0",
      min_stock: "5",
      type: ProductType.GRANOS_BASICOS,
      weight_lb: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      setValue("name", editingProduct.name);
      setValue("barcode", editingProduct.barcodes?.[0]?.barcode || "");
      setValue("price", String(editingProduct.price));
      setValue("cost_price", String(editingProduct.cost_price));
      setValue("stock", String(editingProduct.stock));
      setValue("min_stock", String(editingProduct.min_stock));
      setValue("type", editingProduct.type);
      setValue(
        "weight_lb",
        editingProduct.weight_lb ? String(editingProduct.weight_lb) : ""
      );
      setIsGranoBasico(editingProduct.type === ProductType.GRANOS_BASICOS);
    } else {
      reset();
      setIsGranoBasico(false);
    }
  }, [editingProduct, setValue, reset]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingProduct(null);
    reset();
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      "Eliminar Producto",
      `¿Estás seguro de que deseas eliminar "${product.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            deleteProduct(product.uuid);
            showToast("success", "Éxito", "Producto eliminado correctamente");
          },
        },
      ]
    );
  };

  const onSubmit = (data: CreateProductForm) => {
    try {
      if (editingProduct) {
        // Edit Mode
        if (updateProduct) {
          updateProduct(editingProduct.uuid, {
            name: data.name,
            barcodes: data.barcode ? [{ barcode: data.barcode }] : [],
            price: Number(data.price),
            cost_price: Number(data.cost_price),
            stock: Number(data.stock),
            min_stock: Number(data.min_stock),
            type: data.type,
            weight_lb: data.weight_lb ? Number(data.weight_lb) : undefined,
          });
          showToast("success", "Éxito", "Producto actualizado correctamente");
        } else {
          showToast(
            "info",
            "Información",
            "Función de editar pendiente de conectar al Store"
          );
        }
      } else {
        // Create Mode
        addProduct({
          name: data.name,
          barcode: data.barcode,
          price: Number(data.price),
          cost_price: Number(data.cost_price),
          stock: Number(data.stock),
          min_stock: Number(data.min_stock),
          type: data.type,
          weight_lb: data.weight_lb ? Number(data.weight_lb) : undefined,
        });
        showToast("success", "Éxito", "Producto creado correctamente");
      }
      handleCloseModal();
    } catch {
      showToast("error", "Error", "No se pudo guardar el producto");
    }
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    setValue("barcode", data);
    setScannerVisible(false);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        showToast(
          "error",
          "Permiso requerido",
          "Se necesita acceso a la cámara"
        );
        return;
      }
    }
    setScannerVisible(true);
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
      className="bg-white p-5 mb-4 rounded-[20px] shadow-sm border border-gray-100 mx-1"
      style={{
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center mb-2">
            <View className="bg-indigo-50 p-2 rounded-xl mr-3">
              <Package size={20} color={Colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-black text-indigo-950 leading-tight">
                {item.name}
              </Text>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                {item.barcodes?.[0]?.barcode || "SIN CÓDIGO"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center flex-wrap gap-2 mt-2">
            <View className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Text className="text-gray-600 text-xs font-bold">
                Stock: <Text className="text-indigo-600">{item.stock}</Text>
              </Text>
            </View>

            {item.stock <= item.min_stock && (
              <View className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 flex-row items-center">
                <AlertCircle size={10} color="#d97706" className="mr-1.5" />
                <Text className="text-amber-700 text-xs font-bold">
                  Bajo Stock
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="items-end">
          <LinearGradient
            colors={["#4f46e5", "#4338ca"]}
            className="px-4 py-2 rounded-xl shadow-sm mb-3"
          >
            <Text className="text-white font-black text-lg">
              C$ {item.price}
            </Text>
          </LinearGradient>
          <View className="flex-row items-center gap-2">
            <View className="bg-gray-50 p-2 rounded-full border border-gray-100">
              <Pencil size={16} color="#9ca3af" />
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              className="bg-red-50 p-2 rounded-full border border-red-100"
            >
              <Trash2 size={16} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const isKeyboardVisible = useKeyboard();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScreenHeader title="Inventario" subtitle="GESTIÓN DE PRODUCTOS" />
      <View
        style={{
          flex: 1,
          paddingTop: 16,
          paddingHorizontal: 16,
        }}
      >
        {/* SEARCH */}
        <View className="flex-row items-center bg-white mx-1 px-4 py-3 rounded-[20px] mb-6 shadow-sm border border-gray-100">
          <Search color={Colors.primary} size={22} />
          <TextInput
            className="flex-1 ml-3 text-lg text-indigo-950 font-bold"
            placeholder="Buscar productos..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              className="bg-gray-100 p-1 rounded-full"
            >
              <X size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* LIST */}
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.uuid}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
        />

        {/* FAB */}
        <TouchableOpacity
          className="absolute bottom-8 right-6 bg-indigo-600 w-16 h-16 rounded-[24px] justify-center items-center shadow-lg shadow-indigo-300"
          onPress={() => {
            setEditingProduct(null);
            setModalVisible(true);
          }}
          style={{
            shadowColor: "#4f46e5",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Plus color="white" size={32} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* MODAL */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View className="flex-1 justify-end bg-black/60">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              className="bg-white rounded-t-[40px]"
              style={{
                height:
                  Platform.OS === "android" && isKeyboardVisible
                    ? "100%"
                    : Dimensions.get("window").height * 0.8,
              }}
            >
              <View className="p-8 pb-6 border-b border-gray-100 flex-row justify-between items-center bg-white rounded-t-[40px]">
                <View>
                  <Text className="text-3xl font-black text-indigo-950">
                    {editingProduct ? "Editar" : "Nuevo"}
                  </Text>
                  <Text className="text-gray-400 font-bold text-sm">
                    {editingProduct
                      ? "Actualizar inventario"
                      : "Registrar producto"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  className="bg-gray-100 p-3 rounded-full hover:bg-gray-200"
                >
                  <X size={24} color="#1e1b4b" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-8" showsVerticalScrollIndicator={false}>
                {/* NAME */}
                <Text className="text-indigo-950 mb-2 font-bold text-base">
                  Nombre del Producto
                </Text>
                <Controller
                  control={control}
                  rules={{ required: "El nombre es obligatorio" }}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`bg-gray-50 p-3.5 rounded-2xl mb-4 text-indigo-950 font-bold text-base border ${
                        errors.name ? "border-red-500" : "border-gray-100"
                      }`}
                      placeholder="Ej: Coca Cola 3L"
                      placeholderTextColor="#cbd5e1"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />

                {/* BARCODE */}
                <Text className="text-indigo-950 mb-2 font-bold text-base">
                  Código de Barras
                </Text>
                <View className="flex-row mb-6">
                  <Controller
                    control={control}
                    name="barcode"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="flex-1 bg-gray-50 p-3.5 rounded-l-2xl text-indigo-950 font-bold text-base border border-gray-100"
                        placeholder="Escanear..."
                        placeholderTextColor="#cbd5e1"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  <TouchableOpacity
                    onPress={openScanner}
                    className="bg-indigo-600 p-4 rounded-r-2xl justify-center items-center px-5"
                  >
                    <Camera color="white" size={24} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* CHECKBOX: ¿Es Grano Básico? */}
                <TouchableOpacity
                  onPress={() => {
                    const newValue = !isGranoBasico;
                    setIsGranoBasico(newValue);
                    setValue(
                      "type",
                      newValue ? ProductType.GRANOS_BASICOS : ProductType.SNACKS
                    );
                    if (!newValue) setValue("weight_lb", "");
                  }}
                  className="flex-row items-center mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100"
                >
                  <View
                    className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                      isGranoBasico
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isGranoBasico && (
                      <Check size={16} color="white" strokeWidth={3} />
                    )}
                  </View>
                  <Text className="text-indigo-950 font-bold text-base">
                    ¿Es Grano Básico?
                  </Text>
                </TouchableOpacity>

                {/* CONDITIONAL: Peso en Libras/Litros */}
                {isGranoBasico && (
                  <View className="mb-6">
                    <Text className="text-indigo-950 mb-2 font-bold text-base">
                      Peso (Libras/Litros)
                    </Text>
                    <Controller
                      control={control}
                      name="weight_lb"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          className="bg-gray-50 p-3.5 rounded-2xl text-indigo-950 font-bold text-base border border-gray-100"
                          placeholder="Ej: 5 (libras o litros)"
                          placeholderTextColor="#cbd5e1"
                          keyboardType="numeric"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                )}

                <View className="flex-row space-x-4 gap-x-4 mb-6">
                  <View className="flex-1">
                    <Text className="text-indigo-950 mb-2 font-bold text-base">
                      Precio Venta
                    </Text>
                    <Controller
                      control={control}
                      rules={{ required: true }}
                      name="price"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          className="bg-gray-50 p-3.5 rounded-2xl text-indigo-950 font-bold text-base border border-gray-100"
                          placeholder="0"
                          placeholderTextColor="#cbd5e1"
                          keyboardType="numeric"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-indigo-950 mb-2 font-bold text-base">
                      Costo
                    </Text>
                    <Controller
                      control={control}
                      rules={{ required: true }}
                      name="cost_price"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          className="bg-gray-50 p-3.5 rounded-2xl text-indigo-950 font-bold text-base border border-gray-100"
                          placeholder="0"
                          placeholderTextColor="#cbd5e1"
                          keyboardType="numeric"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                </View>

                <View className="flex-row space-x-4 gap-x-4 mb-10">
                  <View className="flex-1">
                    <Text className="text-indigo-950 mb-2 font-bold text-base">
                      Stock Actual
                    </Text>
                    <Controller
                      control={control}
                      rules={{ required: true }}
                      name="stock"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          className="bg-gray-50 p-3.5 rounded-2xl text-indigo-950 font-bold text-base border border-gray-100"
                          placeholder="0"
                          placeholderTextColor="#cbd5e1"
                          keyboardType="numeric"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-indigo-950 mb-2 font-bold text-base">
                      Stock Mínimo
                    </Text>
                    <Controller
                      control={control}
                      rules={{ required: true }}
                      name="min_stock"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          className="bg-gray-50 p-3.5 rounded-2xl text-indigo-950 font-bold text-base border border-gray-100"
                          placeholder="5"
                          placeholderTextColor="#cbd5e1"
                          keyboardType="numeric"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="bg-indigo-600 p-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-indigo-200 active:bg-indigo-700"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Check color="white" size={22} strokeWidth={3} />
                      <Text className="text-white font-black text-lg ml-3 uppercase tracking-wider">
                        {editingProduct ? "Actualizar" : "Guardar"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* SCANNER MODAL */}
        <ScannerModal
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onScanned={handleBarCodeScanned}
        />
      </View>
    </View>
  );
}

function ScannerModal({
  visible,
  onClose,
  onScanned,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (result: BarcodeScanningResult) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-black">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={visible ? onScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "code128"],
          }}
        />

        <TouchableOpacity
          onPress={onClose}
          className="absolute top-12 right-6 bg-black/50 p-2 rounded-full"
        >
          <X color="white" size={30} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
