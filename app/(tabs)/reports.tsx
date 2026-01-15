import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useQuery } from "@apollo/client/react";
import { GET_REPORTS_DAILY } from "@/lib/queries";
import {
  GetDailyReportQuery,
  GetDailyReportQueryVariables,
} from "@/types/graphql";
import {
  DollarSign,
  CreditCard,
  ShoppingBag,
  BarChart2,
} from "lucide-react-native";

export default function ReportsScreen() {
  const { data, loading, refetch } = useQuery<
    GetDailyReportQuery,
    GetDailyReportQueryVariables
  >(GET_REPORTS_DAILY, {
    variables: { date: new Date().toISOString() },
    fetchPolicy: "network-only",
  });

  const report = data?.dailyReports;

  const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <View
      className={`bg-white p-4 rounded-xl shadow-sm mb-3 flex-row items-center border border-gray-100`}
    >
      <View className={`${bg} p-3 rounded-full mr-4`}>
        <Icon size={24} color={color} />
      </View>
      <View>
        <Text className="text-gray-500 text-sm">{title}</Text>
        <Text className="text-2xl font-bold text-gray-800">{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-gray-800">Reporte Diario</Text>
        <Text className="text-gray-500">{new Date().toLocaleDateString()}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" />
      ) : (
        <View>
          <StatCard
            title="Ventas Totales"
            value={`C$ ${report?.totalSales || 0}`}
            icon={DollarSign}
            color="white"
            bg="bg-indigo-600"
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <StatCard
                title="Contado"
                value={`C$ ${report?.totalCashSales || 0}`}
                icon={ShoppingBag}
                color="#15803d"
                bg="bg-green-100"
              />
            </View>
            <View className="flex-1">
              <StatCard
                title="Fiado"
                value={`C$ ${report?.totalCreditSales || 0}`}
                icon={CreditCard}
                color="#c2410c"
                bg="bg-orange-100"
              />
            </View>
          </View>

          <View className="mt-4 bg-white p-6 rounded-xl shadow-sm">
            <View className="flex-row items-center mb-4">
              <BarChart2 size={24} color="#4F46E5" />
              <Text className="ml-2 text-lg font-bold text-gray-800">
                Resumen de Transacciones
              </Text>
            </View>
            <View className="flex-row justify-between border-b border-gray-100 py-3">
              <Text className="text-gray-500">Total Transacciones</Text>
              <Text className="font-bold text-gray-800">
                {report?.totalTransactions || 0}
              </Text>
            </View>
            <View className="flex-row justify-between py-3">
              <Text className="text-gray-500">Ticket Promedio</Text>
              <Text className="font-bold text-gray-800">
                C${" "}
                {report?.totalTransactions
                  ? (report.totalSales / report.totalTransactions).toFixed(2)
                  : 0}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
