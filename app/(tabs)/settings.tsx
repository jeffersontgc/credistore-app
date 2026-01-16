import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import { Colors } from "@/constants/Colors";
// @ts-ignore: Legacy import to avoid deprecation error in SDK 52+
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  Save,
  Upload,
  Download,
  Database,
  Settings,
  Trash2,
} from "lucide-react-native";

export default function SettingsScreen() {
  const store = useStore();
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    try {
      setLoading(true);
      const data = {
        products: store.products,
        users: store.users,
        sales: store.sales,
        debts: store.debts,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      };

      const json = JSON.stringify(data, null, 2);
      const filename = `credistore_backup_${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")}.json`;
      const fileUri = (FileSystem as any).documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: "utf8",
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert(
          "Backup Creado",
          `El archivo se ha guardado en: ${fileUri}`
        );
      }
    } catch (error: any) {
      console.error("Backup error:", error);
      Alert.alert("Error", "No se pudo crear la copia de seguridad.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      Alert.alert(
        "¿Restaurar Datos?",
        "Esta acción REEMPLAZARÁ todos los datos actuales de la aplicación. Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Restaurar",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                const content = await FileSystem.readAsStringAsync(file.uri, {
                  encoding: "utf8",
                });

                const parsedData = JSON.parse(content);

                if (!parsedData.products || !parsedData.users) {
                  throw new Error("Formato de archivo inválido");
                }

                store.importData(parsedData);
                Alert.alert(
                  "Éxito",
                  "Los datos han sido restaurados correctamente."
                );
              } catch (e) {
                console.error("Restore error:", e);
                Alert.alert(
                  "Error",
                  "El archivo de respaldo está dañado o es inválido."
                );
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Pick error:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo.");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "⚠️ Restablecer Datos",
      "Esta acción ELIMINARÁ todos los productos, clientes, ventas y deudas. Esta acción NO se puede deshacer.\n\n¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar Todo",
          style: "destructive",
          onPress: () => {
            store.clearAllData();
            Alert.alert(
              "✓ Datos Eliminados",
              "Todos los datos han sido restablecidos."
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Configuración
        </Text>
        <Text className="text-gray-500 mb-8">Gestión de datos y sistema</Text>

        {/* Data Management Section */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <View className="flex-row items-center mb-6">
            <Database size={24} color={Colors.primary} />
            <Text className="text-xl font-bold text-gray-900 ml-3">
              Copia de Seguridad
            </Text>
          </View>

          <Text className="text-gray-600 mb-6 leading-5">
            Guarda una copia de tus productos, clientes y ventas para
            restaurarlos en otro dispositivo o si reinstalas la app.
          </Text>

          {/* Backup Button */}
          <TouchableOpacity
            onPress={handleBackup}
            disabled={loading}
            className="flex-row items-center justify-center bg-indigo-600 py-4 px-6 rounded-xl mb-4 active:bg-indigo-700"
          >
            {loading ? (
              <Text className="text-white font-bold ml-2">Procesando...</Text>
            ) : (
              <>
                <Download size={20} color="white" />
                <Text className="text-white font-bold ml-2 text-lg">
                  Exportar Datos (Backup)
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Restore Button */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={loading}
            className="flex-row items-center justify-center bg-white border-2 border-indigo-600 py-4 px-6 rounded-xl active:bg-indigo-50"
          >
            <Upload size={20} color={Colors.primary} />
            <Text className="text-indigo-600 font-bold ml-2 text-lg">
              Restaurar Datos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone Section */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <View className="flex-row items-center mb-6">
            <Trash2 size={24} color={Colors.danger} />
            <Text className="text-xl font-bold text-gray-900 ml-3">
              Zona Peligrosa
            </Text>
          </View>

          <Text className="text-gray-600 mb-6 leading-5">
            Elimina todos los datos de la aplicación. Esta acción es permanente
            y no se puede deshacer.
          </Text>

          {/* Clear Data Button */}
          <TouchableOpacity
            onPress={handleClearData}
            disabled={loading}
            className="flex-row items-center justify-center bg-red-600 py-4 px-6 rounded-xl active:bg-red-700"
          >
            <Trash2 size={20} color="white" />
            <Text className="text-white font-bold ml-2 text-lg">
              Restablecer Todos los Datos
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Settings size={24} color={Colors.textLight} />
            <Text className="text-xl font-bold text-gray-900 ml-3">
              Acerca de
            </Text>
          </View>
          <Text className="text-gray-500">CrediStore App v1.0.0</Text>
          <Text className="text-gray-400 text-xs mt-1">
            Desarrollado en Expo React Native
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
