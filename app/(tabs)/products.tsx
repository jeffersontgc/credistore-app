import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useStore, ProductType, Product } from "@/store/useStore";
import {
  Search,
  Plus,
  AlertCircle,
  X,
  Check,
  Camera,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import useDebounce from "@/hooks/useDebounce";
import { useForm, Controller } from "react-hook-form";

interface CreateProductForm {
  name: string;
  barcode?: string;
  price: string;
  cost_price: string;
  stock: string;
  min_stock: string;
  type: ProductType;
}

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const searchDebounce = useDebounce(search, 300);

  const { products: allProducts, addProduct } = useStore();

  const products = allProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchDebounce.toLowerCase()) ||
        (p.barcodes &&
          p.barcodes.some((b) => b.barcode.includes(searchDebounce)))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Form setup
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
    },
  });

  const onSubmit = (formData: CreateProductForm) => {
    try {
      addProduct({
        name: formData.name,
        barcode: formData.barcode,
        price: Number(formData.price),
        cost_price: Number(formData.cost_price),
        stock: Number(formData.stock),
        min_stock: Number(formData.min_stock),
        type: formData.type,
      });
      Alert.alert("Éxito", "Producto creado correctamente");
      setModalVisible(false);
      reset();
    } catch (error) {
      Alert.alert("Error", "No se pudo crear el producto");
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setValue("barcode", data);
    setScannerVisible(false);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos permiso para usar la cámara"
        );
        return;
      }
    }
    setScannerVisible(true);
  };

  const renderItem = ({ item }: { item: Product }) => (
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
          }}
        />
      </View>

      {/* List */}
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.uuid}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full justify-center items-center shadow-lg active:bg-indigo-700"
        onPress={() => setModalVisible(true)}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

      {/* Create Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              height: "85%",
            }}
          >
            <View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-2xl font-bold text-gray-800">
                Nuevo Producto
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="gray" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-6">
              {/* Name */}
              <Text className="text-gray-600 mb-2 font-semibold">
                Nombre del Producto
              </Text>
              <Controller
                control={control}
                rules={{ required: "El nombre es obligatorio" }}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`bg-gray-100 p-4 rounded-xl mb-1 text-gray-800 ${
                      errors.name ? "border border-red-500" : ""
                    }`}
                    placeholder="Ej: Jabón de baño"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.name && (
                <Text className="text-red-500 text-xs mb-3">
                  {errors.name.message}
                </Text>
              )}

              {/* Barcode */}
              <Text className="text-gray-600 mb-2 font-semibold">
                Código de Barras (Opcional)
              </Text>
              <View className="flex-row items-center gap-2 mb-4">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="barcode"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="bg-gray-100 p-4 rounded-xl text-gray-800"
                        placeholder="Escanea o escribe el código"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
                <TouchableOpacity
                  onPress={openScanner}
                  className="bg-indigo-100 p-4 rounded-xl items-center justify-center"
                >
                  <Camera color={Colors.primary} size={24} />
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-600 mb-2 font-semibold">
                    P. Venta
                  </Text>
                  <Controller
                    control={control}
                    rules={{ required: true, min: 0 }}
                    name="price"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="bg-gray-100 p-4 rounded-xl text-gray-800"
                        placeholder="0.00"
                        keyboardType="numeric"
                        onChangeText={(text) =>
                          onChange(text.replace(/[^0-9.]/g, ""))
                        }
                        value={String(value)}
                      />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 mb-2 font-semibold">
                    P. Costo
                  </Text>
                  <Controller
                    control={control}
                    rules={{ required: true, min: 0 }}
                    name="cost_price"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="bg-gray-100 p-4 rounded-xl text-gray-800"
                        placeholder="0.00"
                        keyboardType="numeric"
                        onChangeText={(text) =>
                          onChange(text.replace(/[^0-9.]/g, ""))
                        }
                        value={String(value)}
                      />
                    )}
                  />
                </View>
              </View>

              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-600 mb-2 font-semibold">
                    Stock
                  </Text>
                  <Controller
                    control={control}
                    rules={{ required: true, min: 0 }}
                    name="stock"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="bg-gray-100 p-4 rounded-xl text-gray-800"
                        placeholder="0"
                        keyboardType="numeric"
                        onChangeText={(text) =>
                          onChange(text.replace(/[^0-9]/g, ""))
                        }
                        value={String(value)}
                      />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 mb-2 font-semibold">
                    S. Mínimo
                  </Text>
                  <Controller
                    control={control}
                    rules={{ required: true, min: 0 }}
                    name="min_stock"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="bg-gray-100 p-4 rounded-xl text-gray-800"
                        placeholder="5"
                        keyboardType="numeric"
                        onChangeText={(text) =>
                          onChange(text.replace(/[^0-9]/g, ""))
                        }
                        value={String(value)}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Type Selection */}
              <Text className="text-gray-600 mb-2 font-semibold">
                Categoría
              </Text>
              <Controller
                control={control}
                name="type"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row flex-wrap gap-2 mb-6">
                    {Object.values(ProductType).map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => onChange(type)}
                        className={`px-4 py-2 rounded-full border ${
                          value === type
                            ? "bg-indigo-600 border-indigo-600"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            value === type
                              ? "text-white font-bold"
                              : "text-gray-600"
                          }`}
                        >
                          {type.replace("_", " ").toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />

              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className={`bg-indigo-600 p-4 rounded-xl flex-row justify-center items-center mb-10 ${
                  isSubmitting ? "opacity-50" : ""
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Check color="white" size={20} className="mr-2" />
                    <Text className="text-white font-bold text-lg text-center">
                      Guardar Producto
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleBarCodeScanned}
      />
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
  onScanned: (data: { data: string }) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-black">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={onScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "code128"],
          }}
        />
        <View className="flex-1 justify-between p-6">
          <TouchableOpacity
            onPress={onClose}
            className="self-end bg-black/50 p-2 rounded-full mt-4"
          >
            <X color="white" size={30} />
          </TouchableOpacity>

          <View className="items-center mb-10">
            <View className="w-64 h-64 border-2 border-white/50 rounded-lg justify-center items-center">
              <View className="w-48 h-0.5 bg-red-500 opacity-50" />
            </View>
            <Text className="text-white font-bold mt-4 bg-black/50 px-4 py-2 rounded-full">
              Escanea un código de barras
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const StyleSheet = {
  absoluteFillObject: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  } as const,
};
