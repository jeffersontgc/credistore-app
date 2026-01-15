import React, { useState } from "react";
import { useToastStore } from "@/store/useToastStore";
import useKeyboard from "@/hooks/useKeyboard";
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
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useStore, User } from "@/store/useStore";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  Search,
  Plus,
  User as UserIcon,
  X,
  Check,
  Trash2,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useForm, Controller } from "react-hook-form";

interface UserForm {
  firstname: string;
  lastname: string;
  phone: string;
}

export default function UsersScreen() {
  const { showToast } = useToastStore();
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const { users: allUsers, addUser, deleteUser } = useStore();

  const users = allUsers.filter((u) =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(search.toLowerCase())
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    defaultValues: {
      firstname: "",
      lastname: "",
      phone: "",
    },
  });

  const onSubmit = (data: UserForm) => {
    addUser(data);
    showToast("success", "Éxito", "Cliente agregado correctamente");
    setModalVisible(false);
    reset();
  };

  const handleDelete = (uuid: string, name: string) => {
    Alert.alert(
      "Eliminar Cliente",
      `¿Estás seguro de que deseas eliminar a ${name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            deleteUser(uuid);
            showToast("success", "Éxito", "Cliente eliminado correctamente");
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: User }) => (
    <View className="bg-white p-4 mb-3 rounded-2xl shadow-sm flex-row justify-between items-center border border-gray-100">
      <View className="flex-row items-center flex-1">
        <View className="bg-indigo-100 p-3 rounded-full mr-3">
          <UserIcon size={20} color={Colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">
            {item.firstname} {item.lastname}
          </Text>
          <Text className="text-gray-500 text-xs">{item.phone}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleDelete(item.uuid, item.firstname)}
        className="p-2 bg-red-50 rounded-full"
      >
        <Trash2 size={18} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  const isKeyboardVisible = useKeyboard();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScreenHeader title="Clientes" subtitle="DIRECTORIO" />
      <View
        style={{
          flex: 1,
          paddingTop: 16,
          paddingHorizontal: 16,
        }}
      >
        {/* SEARCH BAR */}
        <View className="flex-row items-center bg-white mx-3 px-3 py-2 rounded-2xl mb-4 shadow-sm border border-gray-100">
          <Search color={Colors.primary} size={20} />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800 font-medium"
            placeholder="Buscar clientes..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* LIST */}
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.uuid}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <UserIcon size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2">
                No hay clientes registrados
              </Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
          onPress={() => setModalVisible(true)}
        >
          <Plus color="white" size={28} />
        </TouchableOpacity>
        {/* CREATE USER MODAL */}
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              className="bg-white rounded-t-[40px]"
              style={{
                height:
                  Platform.OS === "android" && isKeyboardVisible
                    ? "100%"
                    : Dimensions.get("window").height * 0.7,
              }}
            >
              <View className="p-8 pb-6 border-b border-gray-100 flex-row justify-between items-center bg-white rounded-t-[40px]">
                <View>
                  <Text className="text-3xl font-black text-indigo-950">
                    Nuevo Cliente
                  </Text>
                  <Text className="text-gray-400 font-bold text-sm">
                    Registrar un nuevo cliente
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="bg-gray-100 p-3 rounded-full hover:bg-gray-200"
                >
                  <X size={24} color="#1e1b4b" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-8" showsVerticalScrollIndicator={false}>
                <Text className="text-indigo-950 mb-2 font-bold text-base">
                  Nombre
                </Text>
                <Controller
                  control={control}
                  rules={{ required: "El nombre es obligatorio" }}
                  name="firstname"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`bg-gray-50 p-3.5 rounded-2xl mb-4 text-indigo-950 font-bold text-base border ${
                        errors.firstname ? "border-red-500" : "border-gray-100"
                      }`}
                      placeholder="Ej: Juan"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />

                <Text className="text-indigo-950 mb-2 font-bold text-base">
                  Apellido
                </Text>
                <Controller
                  control={control}
                  rules={{ required: "El apellido es obligatorio" }}
                  name="lastname"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`bg-gray-50 p-3.5 rounded-2xl mb-4 text-indigo-950 font-bold text-base border ${
                        errors.lastname ? "border-red-500" : "border-gray-100"
                      }`}
                      placeholder="Ej: Pérez"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />

                <Text className="text-indigo-950 mb-2 font-bold text-base">
                  Teléfono
                </Text>
                <Controller
                  control={control}
                  rules={{ required: "El teléfono es obligatorio" }}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`bg-gray-50 p-3.5 rounded-2xl mb-4 text-indigo-950 font-bold text-base border ${
                        errors.phone ? "border-red-500" : "border-gray-100"
                      }`}
                      placeholder="Ej: 8888-8888"
                      keyboardType="phone-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />

                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  className="bg-indigo-600 p-4 rounded-2xl flex-row justify-center items-center mt-6 mb-4 shadow-lg shadow-indigo-200 active:bg-indigo-700"
                >
                  <Check color="white" size={22} strokeWidth={3} />
                  <Text className="text-white font-black text-lg ml-3 uppercase tracking-wider">
                    Guardar
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    </View>
  );
}
