import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStore, DebtStatus } from "@/store/useStore";
import {
  CreditCard,
  ShoppingBag,
  BarChart2,
  Calendar,
  Layers,
  TrendingUp,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useMemo } from "react";

type TabType = "daily" | "monthly";

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const { sales, debts, products } = useStore();

  const report = useMemo(() => {
    const isSameDay = (date1: Date, date2: Date) =>
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();

    const isSameMonth = (date1: Date, date2: Date) =>
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth();

    const filteredSales = sales.filter((s) => {
      const d = new Date(s.createdAt);
      return activeTab === "daily"
        ? isSameDay(d, selectedDate)
        : isSameMonth(d, selectedDate);
    });

    const filteredDebts = debts.filter((d) => {
      const dt = new Date(d.createdAt);
      return activeTab === "daily"
        ? isSameDay(dt, selectedDate)
        : isSameMonth(dt, selectedDate);
    });

    if (filteredSales.length === 0 && filteredDebts.length === 0) return null;

    const totalCashSales = filteredSales.reduce(
      (acc, s) => acc + s.totalAmount,
      0
    );
    const totalCreditSales = filteredDebts.reduce(
      (acc, d) => acc + d.amount,
      0
    );
    const totalSales = totalCashSales + totalCreditSales;
    const totalTransactions = filteredSales.length + filteredDebts.length;

    const totalProductsSold =
      filteredSales.reduce(
        (acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0),
        0
      ) +
      filteredDebts.reduce(
        (acc, d) => acc + d.products.reduce((sum, p) => sum + p.quantity, 0),
        0
      );

    const calcProfit = (items: any[]) =>
      items.reduce((acc, item) => {
        const product = products.find((p) => p.uuid === item.product_uuid);
        const costPrice = product?.cost_price || 0;
        return acc + (item.price - costPrice) * item.quantity;
      }, 0);

    const totalProfit =
      filteredSales.reduce((acc, s) => acc + calcProfit(s.items), 0) +
      filteredDebts.reduce((acc, d) => acc + calcProfit(d.products), 0);

    const activeDebts = filteredDebts.filter(
      (d) => d.status === DebtStatus.ACTIVE
    );
    const pendingDebts = filteredDebts.filter(
      (d) => d.status === DebtStatus.PENDING
    );
    const paidDebts = filteredDebts.filter((d) => d.status === DebtStatus.PAID);
    const settledDebts = filteredDebts.filter(
      (d) => d.status === DebtStatus.SETTLED
    );

    return {
      total_sales: totalSales,
      total_profit: totalProfit,
      total_transactions: totalTransactions,
      average_sale_amount:
        totalTransactions > 0 ? totalSales / totalTransactions : 0,
      total_cash_sales: totalCashSales,
      total_credit_sales: totalCreditSales,
      total_products_sold: totalProductsSold,
      total_active_amount: activeDebts.reduce((acc, d) => acc + d.amount, 0),
      active_debts_count: activeDebts.length,
      pending_debts_count: pendingDebts.length,
      paid_debts_count: paidDebts.length,
      settled_debts_count: settledDebts.length,
      average_daily_sales: activeTab === "monthly" ? totalSales / 30 : 0, // Simplified
    };
  }, [sales, debts, selectedDate, activeTab]);

  const loading = false;

  const onRefresh = () => {
    // No-op for local store
  };

  const changeDate = (amount: number) => {
    const newDate = new Date(selectedDate);
    if (activeTab === "daily") {
      newDate.setDate(newDate.getDate() + amount);
    } else {
      newDate.setMonth(newDate.getMonth() + amount);
    }
    setSelectedDate(newDate);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    bg,
    subtitle,
  }: {
    title: string;
    value: string;
    icon: any;
    color: string;
    bg: string;
    subtitle?: string;
  }) => (
    <View className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100">
      <View className="flex-row items-center mb-1">
        <View className={`${bg} p-2 rounded-lg mr-3`}>
          <Icon size={18} color={color} />
        </View>
        <Text className="text-gray-500 text-sm font-medium">{title}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-800">{value}</Text>
      {subtitle && (
        <Text className="text-gray-400 text-xs mt-1">{subtitle}</Text>
      )}
    </View>
  );

  const TabButton = ({ type, label }: { type: TabType; label: string }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(type)}
      className={`flex-1 py-3 items-center rounded-xl ${
        activeTab === type ? "bg-white shadow-sm" : ""
      }`}
    >
      <Text
        className={`font-semibold ${
          activeTab === type ? "text-indigo-600" : "text-gray-500"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-4 pb-2 shadow-sm">
        <View className="flex-row justify-between items-end mb-4 px-1">
          <View>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => changeDate(-1)} className="pr-2">
                <ChevronLeft size={16} color={Colors.textLight} />
              </TouchableOpacity>
              <Text className="text-gray-500 min-w-[120px] text-center">
                {activeTab === "daily"
                  ? selectedDate.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                    })
                  : selectedDate.toLocaleDateString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })}
              </Text>
              <TouchableOpacity onPress={() => changeDate(1)} className="pl-2">
                <ChevronRight size={16} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            className="bg-gray-100 p-2 rounded-full"
            onPress={() => setShowPicker(true)}
          >
            <Calendar size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        <View className="bg-gray-100 p-1 rounded-2xl flex-row">
          <TabButton type="daily" label="Diario" />
          <TabButton type="monthly" label="Mensual" />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-gray-400 mt-2">Cargando métricas...</Text>
          </View>
        ) : !report ? (
          <View className="mt-10 items-center bg-white p-10 rounded-3xl border border-dashed border-gray-300">
            <BarChart2 size={48} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              No hay datos registrados para este{" "}
              {activeTab === "daily" ? "día" : "mes"}.
            </Text>
          </View>
        ) : (
          <View className="pb-10">
            {/* Main Sales Metric */}
            <View className="bg-indigo-600 p-6 rounded-3xl mb-4 shadow-lg shadow-indigo-200">
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-indigo-100 text-sm font-medium">
                    Ventas Totales
                  </Text>
                  <Text className="text-white text-4xl font-bold mt-1">
                    C$ {report.total_sales.toLocaleString()}
                  </Text>
                </View>
                <View className="bg-white/20 p-3 rounded-2xl">
                  <TrendingUp size={24} color="white" />
                </View>
              </View>
              <View className="flex-row mt-4 pt-4 border-t border-white/10">
                <View className="flex-1">
                  <Text className="text-indigo-200 text-xs">Transacciones</Text>
                  <Text className="text-white font-bold">
                    {report.total_transactions}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-indigo-200 text-xs">Promedio</Text>
                  <Text className="text-white font-bold">
                    C$ {report.average_sale_amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Split Breakdown */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <StatCard
                  title="Contado"
                  value={`C$ ${report.total_cash_sales.toLocaleString()}`}
                  icon={ShoppingBag}
                  color="#15803d"
                  bg="bg-green-100"
                />
              </View>
              <View className="flex-1">
                <StatCard
                  title="Crédito"
                  value={`C$ ${report.total_credit_sales.toLocaleString()}`}
                  icon={CreditCard}
                  color="#c2410c"
                  bg="bg-orange-100"
                />
              </View>
            </View>

            {/* Product Metric */}
            <StatCard
              title="Productos Vendidos"
              value={`${report.total_products_sold} unidades`}
              icon={Package}
              color="#4F46E5"
              bg="bg-indigo-100"
            />

            {/* Debts Section */}
            <Text className="text-lg font-bold text-gray-800 mt-4 mb-3 px-1">
              Estado de Créditos
            </Text>
            <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-50">
                <View className="flex-row items-center">
                  <View className="bg-gray-100 p-2 rounded-lg mr-3">
                    <Layers size={20} color="#6B7280" />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-bold">Total Fiado</Text>
                    <Text className="text-gray-400 text-xs">
                      Monto acumulado
                    </Text>
                  </View>
                </View>
                <Text className="text-xl font-bold text-gray-800">
                  C$ {report.total_active_amount.toLocaleString()}
                </Text>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1 items-center">
                  <View className="w-2 h-2 rounded-full bg-blue-500 mb-1" />
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">
                    Activos
                  </Text>
                  <Text className="text-gray-800 font-bold">
                    {report.active_debts_count}
                  </Text>
                </View>
                <View className="flex-1 items-center border-x border-gray-50">
                  <View className="w-2 h-2 rounded-full bg-amber-500 mb-1" />
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">
                    Pendientes
                  </Text>
                  <Text className="text-gray-800 font-bold">
                    {report.pending_debts_count}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <View className="w-2 h-2 rounded-full bg-green-500 mb-1" />
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">
                    Pagados
                  </Text>
                  <Text className="text-gray-800 font-bold">
                    {report.paid_debts_count + report.settled_debts_count}
                  </Text>
                </View>
              </View>
            </View>

            {activeTab === "monthly" && (
              <View className="mt-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <Text className="text-indigo-800 font-bold text-sm">
                  Promedio Mensual
                </Text>
                <Text className="text-indigo-600 text-xs mt-1">
                  En promedio se vende C${" "}
                  {(report as any).average_daily_sales?.toFixed(2)} por día.
                </Text>
              </View>
            )}

            {/* Inventory Valuation Section */}
            <Text className="text-lg font-bold text-gray-800 mt-8 mb-3 px-1">
              Valor del Inventario
            </Text>
            <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-10">
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-50">
                <View className="flex-row items-center">
                  <View className="bg-blue-50 p-2 rounded-lg mr-3">
                    <Package size={20} color={Colors.primary} />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-bold">
                      Inversión Total
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      A precio de costo
                    </Text>
                  </View>
                </View>
                <Text className="text-xl font-bold text-gray-800">
                  C${" "}
                  {products
                    .reduce((acc, p) => acc + p.cost_price * p.stock, 0)
                    .toLocaleString()}
                </Text>
              </View>

              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-50">
                <View className="flex-row items-center">
                  <View className="bg-green-50 p-2 rounded-lg mr-3">
                    <TrendingUp size={20} color="#15803d" />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-bold">
                      Venta Potencial
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Si se vende todo
                    </Text>
                  </View>
                </View>
                <Text className="text-xl font-bold text-green-700">
                  C${" "}
                  {products
                    .reduce((acc, p) => acc + p.price * p.stock, 0)
                    .toLocaleString()}
                </Text>
              </View>

              <View className="flex-row bg-indigo-50 p-3 rounded-2xl items-center justify-between">
                <Text className="text-indigo-800 font-bold">
                  Ganancia Proyectada
                </Text>
                <Text className="text-indigo-950 font-black text-lg">
                  C${" "}
                  {products
                    .reduce(
                      (acc, p) => acc + (p.price - p.cost_price) * p.stock,
                      0
                    )
                    .toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
