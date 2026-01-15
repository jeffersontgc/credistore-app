import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { User, X } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { User as UserType } from "@/store/useStore";
import { useStore } from "@/store/useStore";
import { LinearGradient } from "expo-linear-gradient";

interface UserSelectorProps {
  onSelect: (u: UserType | null) => void;
  selectedUser: UserType | null;
}

export function UserSelector({ onSelect, selectedUser }: UserSelectorProps) {
  const [search, setSearch] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const { users } = useStore();

  const filteredUsers = users.filter((u) =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="relative" style={{ zIndex: 50 }}>
      <View className="flex-row items-center bg-gray-50 rounded-[28px] px-6 py-1 border border-gray-100 h-16">
        <User color="#94a3b8" size={22} strokeWidth={2.5} />
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
                    <User size={20} color={Colors.primary} strokeWidth={2.5} />
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
            <User size={24} color="white" strokeWidth={2.5} />
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
