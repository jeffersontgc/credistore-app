import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useStore, DebtStatus } from "@/store/useStore";
import { ScreenHeader } from "@/components/ScreenHeader";
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
  FileDown,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";

type TabType = "daily" | "monthly";

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const {
    sales,
    debts,
    products,
    cashClosures,
    currentDaySales,
    currentDayDebts,
  } = useStore();

  const report = useMemo(() => {
    const isSameDay = (date1: Date, date2: Date) =>
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();

    const isSameMonth = (date1: Date, date2: Date) =>
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth();

    let filteredSales: typeof currentDaySales = [];
    let filteredDebts: typeof currentDayDebts = [];

    if (activeTab === "daily") {
      // For daily view: show current day sales if selected date is today
      const isToday = isSameDay(selectedDate, new Date());
      if (isToday) {
        filteredSales = [...currentDaySales];
        filteredDebts = [...currentDayDebts];
      } else {
        // Show sales from closures for past days
        const dayClosures = cashClosures.filter((c) =>
          isSameDay(new Date(c.date), selectedDate)
        );
        dayClosures.forEach((closure) => {
          filteredSales.push(...closure.cashSales);
          filteredDebts.push(...closure.creditSales);
        });
      }
    } else {
      // For monthly view: combine current day + all closures of the month
      const isCurrentMonth = isSameMonth(selectedDate, new Date());

      if (isCurrentMonth) {
        filteredSales = [...currentDaySales];
        filteredDebts = [...currentDayDebts];
      }

      const monthClosures = cashClosures.filter((c) =>
        isSameMonth(new Date(c.date), selectedDate)
      );
      monthClosures.forEach((closure) => {
        filteredSales.push(...closure.cashSales);
        filteredDebts.push(...closure.creditSales);
      });
    }

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
      average_daily_sales: activeTab === "monthly" ? totalSales / 30 : 0,
    };
  }, [sales, debts, selectedDate, activeTab, products]);

  const loading = false;

  const onRefresh = () => {};

  const changeDate = (amount: number) => {
    const newDate = new Date(selectedDate);
    activeTab === "daily"
      ? newDate.setDate(newDate.getDate() + amount)
      : newDate.setMonth(newDate.getMonth() + amount);
    setSelectedDate(newDate);
  };

  const handleDateChange = (_: any, date?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (date) setSelectedDate(date);
  };

  const generatePDF = async () => {
    const isSameDay = (date1: Date, date2: Date) =>
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();

    const isSameMonth = (date1: Date, date2: Date) =>
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth();

    let salesData: typeof currentDaySales = [];
    let debtsData: typeof currentDayDebts = [];

    if (activeTab === "daily") {
      const isToday = isSameDay(selectedDate, new Date());
      if (isToday) {
        salesData = [...currentDaySales];
        debtsData = [...currentDayDebts];
      } else {
        const dayClosures = cashClosures.filter((c) =>
          isSameDay(new Date(c.date), selectedDate)
        );
        dayClosures.forEach((closure) => {
          salesData.push(...closure.cashSales);
          debtsData.push(...closure.creditSales);
        });
      }
    } else {
      const isCurrentMonth = isSameMonth(selectedDate, new Date());
      if (isCurrentMonth) {
        salesData = [...currentDaySales];
        debtsData = [...currentDayDebts];
      }

      const monthClosures = cashClosures.filter((c) =>
        isSameMonth(new Date(c.date), selectedDate)
      );
      monthClosures.forEach((closure) => {
        salesData.push(...closure.cashSales);
        debtsData.push(...closure.creditSales);
      });
    }

    if (salesData.length === 0 && debtsData.length === 0) {
      Alert.alert(
        "Sin Datos",
        `No hay ventas registradas para este ${
          activeTab === "daily" ? "día" : "mes"
        }.`
      );
      return;
    }

    const periodName =
      activeTab === "daily"
        ? selectedDate.toLocaleDateString("es-NI", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : selectedDate.toLocaleDateString("es-NI", {
            month: "long",
            year: "numeric",
          });

    let salesRows = "";
    let totalCash = 0;
    let totalCredit = 0;

    // Cash Sales
    salesData.forEach((sale) => {
      const saleDate = new Date(sale.createdAt).toLocaleDateString("es-NI");
      sale.items.forEach((item) => {
        salesRows += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${saleDate}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
              item.name
            }</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
              item.quantity
            }</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">Contado</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">-</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">C$ ${(
              item.price * item.quantity
            ).toFixed(2)}</td>
          </tr>
        `;
      });
      totalCash += sale.totalAmount;
    });

    // Credit Sales
    debtsData.forEach((debt) => {
      const debtDate = new Date(debt.createdAt).toLocaleDateString("es-NI");
      debt.products.forEach((item) => {
        salesRows += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${debtDate}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
              item.name
            }</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
              item.quantity
            }</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">Fiado</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
              debt.user.firstname
            } ${debt.user.lastname}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">C$ ${(
              item.price * item.quantity
            ).toFixed(2)}</td>
          </tr>
        `;
      });
      totalCredit += debt.amount;
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Ventas - ${periodName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #4F46E5; text-align: center; }
            h2 { color: #6B7280; font-size: 16px; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4F46E5; color: white; padding: 12px; text-align: left; }
            .summary { background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .summary-item { display: flex; justify-content: space-between; margin: 8px 0; }
            .total { font-size: 18px; font-weight: bold; color: #4F46E5; }
          </style>
        </head>
        <body>
          <h1>CrediStore - Reporte de Ventas</h1>
          <h2>${periodName}</h2>
          
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: center;">Tipo</th>
                <th style="text-align: center;">Cliente</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${salesRows}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-item">
              <span>Total Contado:</span>
              <span>C$ ${totalCash.toFixed(2)}</span>
            </div>
            <div class="summary-item">
              <span>Total Fiado:</span>
              <span>C$ ${totalCredit.toFixed(2)}</span>
            </div>
            <div class="summary-item total">
              <span>TOTAL:</span>
              <span>C$ ${(totalCash + totalCredit).toFixed(2)}</span>
            </div>
          </div>

          <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 30px;">
            Generado el ${new Date().toLocaleDateString(
              "es-NI"
            )} a las ${new Date().toLocaleTimeString("es-NI")}
          </p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Reporte ${periodName}`,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el PDF.");
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
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScreenHeader title="Reportes" subtitle="MÉTRICAS & FINANZAS" />
      <View className="flex-1 bg-gray-50">
        <View className="bg-white shadow-sm">
          <View className="flex-row justify-between items-end mb-4 px-1">
            <View>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => changeDate(-1)}
                  className="pr-2"
                >
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
                <TouchableOpacity
                  onPress={() => changeDate(1)}
                  className="pl-2"
                >
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

          <TouchableOpacity
            onPress={generatePDF}
            className="bg-indigo-600 py-3 px-4 rounded-xl flex-row items-center justify-center mt-4 active:bg-indigo-700"
          >
            <FileDown size={20} color="white" />
            <Text className="text-white font-bold ml-2">
              Descargar PDF {activeTab === "daily" ? "del Día" : "del Mes"}
            </Text>
          </TouchableOpacity>
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
                    <Text className="text-indigo-200 text-xs">
                      Transacciones
                    </Text>
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
                      <Text className="text-gray-800 font-bold">
                        Total Fiado
                      </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
  },
});
