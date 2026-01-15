import React from "react";
import { Tabs } from "expo-router";
import {
  Home,
  Package,
  Scan,
  CreditCard,
  BarChart3,
  Users,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { TouchableOpacity } from "react-native";

export default function TabLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity onPress={signOut} style={{ marginRight: 15 }}>
            <Users color={Colors.text} size={24} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Productos",
          tabBarIcon: ({ color }) => <Package color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Vender",
          tabBarIcon: ({ color }) => <Scan color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: "Fiados",
          tabBarIcon: ({ color }) => <CreditCard color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reportes",
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          href: null, // Hidden from tab bar, accessed via navigation if needed
          title: "Usuarios",
        }}
      />
    </Tabs>
  );
}
