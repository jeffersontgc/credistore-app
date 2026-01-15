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
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PRODUCTS, CREATE_PRODUCT } from "@/lib/queries";
import {
  GetProductsQuery,
  GetProductsQueryVariables,
  Product,
  ProductType,
  CreateProductMutation,
  CreateProductMutationVariables,
  CreateProductInput,
} from "@/types/graphql";
import { Search, Plus, AlertCircle, X, Check } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import useDebounce from "@/hooks/useDebounce";
import { useForm, Controller } from "react-hook-form";

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const searchDebounce = useDebounce(search, 500);

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput>({
    defaultValues: {
      name: "",
      barcode: "",
      price: 0,
      cost_price: 0,
      stock: 0,
      min_stock: 5,
      type: ProductType.GRANOS_BASICOS,
    },
  });

  const { data, loading, fetchMore, refetch } = useQuery<
    GetProductsQuery,
    GetProductsQueryVariables
  >(GET_PRODUCTS, {
    variables: { search: searchDebounce, page: 1, limit: 10 },
    notifyOnNetworkStatusChange: true,
  });

  const [createProduct] = useMutation<
    CreateProductMutation,
    CreateProductMutationVariables
  >(CREATE_PRODUCT, {
    onCompleted: () => {
      Alert.alert("Éxito", "Producto creado correctamente");
      setModalVisible(false);
      reset();
      refetch();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "No se pudo crear el producto");
    },
  });

  const onSubmit = (formData: CreateProductInput) => {
    createProduct({
      variables: {
        input: {
          ...formData,
          price: Number(formData.price),
          cost_price: Number(formData.cost_price),
          stock: Number(formData.stock),
          min_stock: Number(formData.min_stock),
        },
      },
    });
  };

  const products = data?.findAllProducts?.data || [];
  const hasNextPage = data?.findAllProducts?.hasNextPage;

  const loadMore = () => {
    if (hasNextPage && !loading) {
      fetchMore({
        variables: { page: page + 1 },
        updateQuery: (
          prev: GetProductsQuery,
          { fetchMoreResult }: { fetchMoreResult?: GetProductsQuery }
        ) => {
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
          placeholder="Buscar productos... (V2)"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setPage(1);
          }}
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
              <Controller
                control={control}
                name="barcode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-gray-100 p-4 rounded-xl mb-4 text-gray-800"
                    placeholder="Escanea o escribe el código"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />

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
    </View>
  );
}
