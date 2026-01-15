import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore, User } from "@/store/useStore";
import {
  Search,
  Plus,
  User as UserIcon,
  X,
  Check,
  Mail,
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
    Alert.alert("Éxito", "Cliente agregado correctamente");
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
          onPress: () => deleteUser(uuid),
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
          <View className="flex-row items-center">
            {/* Using a generic info icon or similar if phone icon isn't imported, but assuming standard icons are fine */}
            <Text className="text-gray-500 text-xs ml-1">{item.phone}</Text>
          </View>
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

  return (
    <SafeAreaView style={styles.container} className="p-4">
      {/* Search Bar */}
      <View className="flex-row items-center bg-white p-3 rounded-2xl mb-4 shadow-sm border border-gray-100 h-14">
        <Search color={Colors.primary} size={20} />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800 font-medium"
          placeholder="Buscar clientes..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.uuid}
        ListEmptyComponent={
          <View className="mt-10 items-center">
            <UserIcon size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-2">
              No hay clientes registrados
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        onPress={() => setModalVisible(true)}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

      {/* Create User Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="bg-white rounded-t-3xl h-[70%]"
          >
            <View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-2xl font-bold text-gray-800">
                Nuevo Cliente
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="gray" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-6">
              <Text className="text-gray-600 mb-2 font-semibold">Nombre</Text>
              <Controller
                control={control}
                rules={{ required: "El nombre es obligatorio" }}
                name="firstname"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`bg-gray-50 p-4 rounded-xl mb-1 text-gray-800 border ${
                      errors.firstname ? "border-red-500" : "border-gray-100"
                    }`}
                    placeholder="Ej: Juan"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />

              <Text className="text-gray-600 mt-4 mb-2 font-semibold">
                Apellido
              </Text>
              <Controller
                control={control}
                rules={{ required: "El apellido es obligatorio" }}
                name="lastname"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`bg-gray-50 p-4 rounded-xl mb-1 text-gray-800 border ${
                      errors.lastname ? "border-red-500" : "border-gray-100"
                    }`}
                    placeholder="Ej: Pérez"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />

              <Text className="text-gray-600 mt-4 mb-2 font-semibold">
                Teléfono
              </Text>
              <Controller
                control={control}
                rules={{
                  required: "El teléfono es obligatorio",
                }}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`bg-gray-50 p-4 rounded-xl mb-1 text-gray-800 border ${
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
                className="bg-indigo-600 p-4 rounded-xl flex-row justify-center items-center mt-10 mb-10 shadow-lg shadow-indigo-200"
              >
                <Check color="white" size={20} className="mr-2" />
                <Text className="text-white font-bold text-lg">
                  Guardar Cliente
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
  },
});
