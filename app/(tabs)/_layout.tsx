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

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: false,
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
          title: "Clientes",
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
