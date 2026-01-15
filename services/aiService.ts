import { router } from "expo-router";
import {
  GoogleGenerativeAI,
  SchemaType,
  FunctionDeclaration,
} from "@google/generative-ai";
import { useStore, Product, Sale, Debt, DebtStatus } from "@/store/useStore";

// ... (existing helpers)

const navigateApp = (args: { screen: string }) => {
  const { screen } = args;
  let targetRoute = "";
  let screenName = "";

  switch (screen.toLowerCase()) {
    case "scanner":
    case "escaner":
    case "escáner":
      targetRoute = "/(tabs)/scanner";
      screenName = "Escáner";
      break;
    case "products":
    case "productos":
      targetRoute = "/(tabs)/products";
      screenName = "Productos";
      break;
    case "users":
    case "usuarios":
    case "clientes":
      targetRoute = "/(tabs)/users";
      screenName = "Usuarios";
      break;
    case "home":
    case "inicio":
      targetRoute = "/(tabs)";
      screenName = "Inicio";
      break;
    case "debts":
    case "deudas":
    case "fiados":
      // Assuming debts is under users or has its own tab, based on user's layout usually users handles debts or there is a specific route.
      // Looking at previous context: route="/(tabs)/debts" was used in ActionCard in index.tsx
      targetRoute = "/(tabs)/debts";
      screenName = "Fiados";
      break;
    default:
      return { message: "Pantalla no encontrada." };
  }

  // Use setImmediate or setTimeout to ensure navigation happens outside current render cycle if needed,
  // but imperative calls usually work fine.
  try {
    // We use router.push with as any because sometimes typed routes can be tricky in imperative calls if not fully typed
    router.push(targetRoute as any);
  } catch (e) {
    console.error("Navigation error", e);
    return { message: "Error al navegar." };
  }

  return { message: `Navegando a ${screenName}...` };
};

// ... (existing Main Service code)

// --- Types ---
export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  isError?: boolean;
}

// Intefaces for Tool Arguments
interface SalesSummaryArgs {
  startDate?: string;
  endDate?: string;
  period?: "today" | "yesterday" | "week" | "month";
}

interface TopSellingArgs {
  limit?: number;
}

interface LowStockArgs {
  limit?: number;
}

interface CustomerDebtArgs {
  name: string;
}

// --- Tools Definitions ---

const tools: FunctionDeclaration[] = [
  {
    name: "getSalesSummary",
    description:
      "Calcula el total de ventas, cantidad de transacciones y ganancia estimada en un rango de fechas. Si no se especifica fecha, asume 'hoy'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startDate: {
          type: SchemaType.STRING,
          description: "Fecha inicial en formato YYYY-MM-DD",
        },
        endDate: {
          type: SchemaType.STRING,
          description: "Fecha final en formato YYYY-MM-DD",
        },
        period: {
          type: SchemaType.STRING,
          description:
            "Periodo predefinido: 'today' (hoy), 'yesterday' (ayer), 'week' (esta semana), 'month' (este mes).",
        },
      },
    },
  },
  {
    name: "getTopSellingProducts",
    description: "Obtiene los productos más vendidos por cantidad o monto.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: {
          type: SchemaType.NUMBER,
          description: "Cantidad de productos a mostrar (default: 5)",
        },
      },
    },
  },
  {
    name: "getLowStockProducts",
    description:
      "Lista los productos que tienen poco stock (menor o igual al mínimo definido).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: {
          type: SchemaType.NUMBER,
          description: "Límite de productos a mostrar (default: 10)",
        },
      },
    },
  },
  {
    name: "getInventoryValue",
    description:
      "Calcula el valor total del inventario (costo vs precio de venta).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "getDebtsSummary",
    description: "Resumen de cuentas por cobrar (fiados) activos y vencidos.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "getCustomerDebt",
    description: "Busca la deuda de un cliente específico por nombre.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: {
          type: SchemaType.STRING,
          description: "Nombre o parte del nombre del cliente",
        },
      },
    },
  },
  {
    name: "getOverdueDebts",
    description:
      "Lista los clientes con deudas vencidas (fecha de pago anterior a hoy).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "getUpcomingDebts",
    description: "Lista los clientes que deben pagar en los próximos 7 días.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        days: {
          type: SchemaType.NUMBER,
          description: "Número de días a consultar (default: 7)",
        },
      },
    },
  },
  {
    name: "getAllActiveDebts",
    description:
      "Lista TODOS los clientes que tienen deuda activa actualmente.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: {
          type: SchemaType.NUMBER,
          description: "Límite de resultados (default: 20)",
        },
      },
    },
  },
  {
    name: "getProductDetails",
    description: "Busca precio, stock y costo de un producto específico.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Nombre del producto a buscar",
        },
      },
    },
  },
  {
    name: "navigateApp",
    description: "Navega a una pantalla específica de la aplicación.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        screen: {
          type: SchemaType.STRING,
          description:
            "Pantalla destino: 'scanner', 'products', 'users', 'home', 'debts'.",
        },
      },
    },
  },
];

// --- Helper Functions (The "Backend" of our AI) ---

const getSalesSummary = (args: SalesSummaryArgs) => {
  const state = useStore.getState();
  const sales = state.sales;
  let start = new Date();
  let end = new Date();

  // Simple date logic
  if (args.period === "today" || !args.period) {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (args.period === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  }
  // TODO: Add more periods if needed, keep it simple for now

  const filteredSales = sales.filter((s) => {
    const d = new Date(s.createdAt);
    return d >= start && d <= end;
  });

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const count = filteredSales.length;

  // Calculate generic profit estimate (Revenue - Cost)
  let totalCost = 0;
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const product = state.products.find((p) => p.uuid === item.product_uuid);
      if (product) {
        totalCost += product.cost_price * item.quantity;
      }
    });
  });

  return {
    period: args.period || "today",
    totalSales: totalRevenue,
    transactionCount: count,
    estimatedProfit: totalRevenue - totalCost,
    details: `Ventas desde ${start.toLocaleDateString()} hasta ${end.toLocaleDateString()}`,
  };
};

const getTopSellingProducts = (args: TopSellingArgs) => {
  const state = useStore.getState();
  const sales = state.sales;
  const productCounts: Record<string, number> = {};

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      productCounts[item.name] =
        (productCounts[item.name] || 0) + item.quantity;
    });
  });

  const sorted = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, args.limit || 5)
    .map(([name, count]) => ({ name, unitsSold: count }));

  return { topProducts: sorted };
};

const getLowStockProducts = (args: LowStockArgs) => {
  const state = useStore.getState();
  const lowStock = state.products
    .filter((p) => p.stock <= p.min_stock)
    .map((p) => ({
      name: p.name,
      currentStock: p.stock,
      minStock: p.min_stock,
    }))
    .slice(0, args.limit || 10);

  return { lowStockItems: lowStock };
};

const getInventoryValue = () => {
  const state = useStore.getState();
  let totalCostValue = 0;
  let totalRetailValue = 0;

  state.products.forEach((p) => {
    totalCostValue += p.cost_price * p.stock;
    totalRetailValue += p.price * p.stock;
  });

  return {
    totalItems: state.products.length,
    totalCostValue,
    totalRetailValue,
    potentialProfit: totalRetailValue - totalCostValue,
  };
};

const getDebtsSummary = () => {
  const state = useStore.getState();
  const activeDebts = state.debts.filter((d) => d.status === DebtStatus.ACTIVE);

  const totalReceivable = activeDebts.reduce((acc, d) => acc + d.amount, 0);
  const count = activeDebts.length;

  return {
    activeDebtsCount: count,
    totalReceivable,
  };
};

const getCustomerDebt = (args: CustomerDebtArgs) => {
  const state = useStore.getState();
  const nameQuery = args.name.toLowerCase();

  const userDebts = state.debts.filter(
    (d) =>
      d.status === DebtStatus.ACTIVE &&
      (d.user.firstname.toLowerCase().includes(nameQuery) ||
        d.user.lastname.toLowerCase().includes(nameQuery))
  );

  if (userDebts.length === 0) {
    return { message: `No se encontraron deudas activas para "${args.name}".` };
  }

  // Aggregate by user
  const result = userDebts.map((d) => ({
    user: `${d.user.firstname} ${d.user.lastname}`,
    amount: d.amount,
    dueDate: d.date_pay,
    daysOverdue: Math.floor(
      (new Date().getTime() - new Date(d.date_pay).getTime()) /
        (1000 * 3600 * 24)
    ),
  }));

  return { debtsFound: result };
};

const getOverdueDebts = () => {
  const state = useStore.getState();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = state.debts.filter((d) => {
    if (d.status !== DebtStatus.ACTIVE) return false;
    const dueDate = new Date(d.date_pay);
    return dueDate < today;
  });

  return {
    count: overdue.length,
    debts: overdue.map((d) => ({
      user: `${d.user.firstname} ${d.user.lastname}`,
      amount: d.amount,
      dueDate: d.date_pay,
      daysLate: Math.floor(
        (today.getTime() - new Date(d.date_pay).getTime()) / (1000 * 3600 * 24)
      ),
    })),
  };
};

const getUpcomingDebts = (args: { days?: number }) => {
  const state = useStore.getState();
  const days = args.days || 7;
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + days);

  const upcoming = state.debts.filter((d) => {
    if (d.status !== DebtStatus.ACTIVE) return false;
    const dueDate = new Date(d.date_pay);
    return dueDate >= today && dueDate <= future;
  });

  return {
    daysChecked: days,
    count: upcoming.length,
    debts: upcoming.map((d) => ({
      user: `${d.user.firstname} ${d.user.lastname}`,
      amount: d.amount,
      dueDate: d.date_pay,
    })),
  };
};

const getAllActiveDebts = (args: { limit?: number }) => {
  const state = useStore.getState();
  const debts = state.debts
    .filter((d) => d.status === DebtStatus.ACTIVE)
    .slice(0, args.limit || 20)
    .map((d) => ({
      user: `${d.user.firstname} ${d.user.lastname}`,
      amount: d.amount,
      dueDate: d.date_pay,
    }));

  return {
    totalFound: debts.length,
    debts,
  };
};

const getProductDetails = (args: { query: string }) => {
  const state = useStore.getState();
  const q = args.query.toLowerCase();
  const product = state.products.find((p) => p.name.toLowerCase().includes(q));

  if (!product) {
    return { message: "Producto no encontrado." };
  }

  return {
    name: product.name,
    price: product.price,
    cost: product.cost_price,
    stock: product.stock,
    barcodes: product.barcodes?.join(", ") || "Sin código",
  };
};

// --- Main Service ---

// --- REST API Helper for Tools ---
// The SDK uses camelCase, but the REST API expects snake_case for proper field names
const toolsREST = [
  {
    function_declarations: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: tool.parameters?.type, // Should map SchemaType enum to string if needed, but SDK enum values are likely compatible ("OBJECT", etc)
        properties: tool.parameters?.properties,
        required: tool.parameters?.required,
      },
    })),
  },
];

// --- Main Service ---

export class AIService {
  private apiKey: string;
  // Switching to gemini-2.5-flash which appears in your available model list
  private baseUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    history: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    const contents = [
      ...history
        .filter((h) => h.role !== "system" && !h.isError)
        .map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        })),
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    const payload = {
      contents,
      tools: toolsREST,
    };

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Gemini API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const candidates = data.candidates;

      if (!candidates || candidates.length === 0) {
        return "Lo siento, no pude generar una respuesta.";
      }

      const firstPart = candidates[0].content.parts[0];

      // Check for function call
      if (firstPart.functionCall) {
        const { name, args } = firstPart.functionCall;
        console.log(`🤖 AI calling function (REST): ${name}`, args);

        let functionResult;

        switch (name) {
          case "getSalesSummary":
            functionResult = getSalesSummary(args as SalesSummaryArgs);
            break;
          case "getTopSellingProducts":
            functionResult = getTopSellingProducts(args as TopSellingArgs);
            break;
          case "getLowStockProducts":
            functionResult = getLowStockProducts(args as LowStockArgs);
            break;
          case "getInventoryValue":
            functionResult = getInventoryValue();
            break;
          case "getDebtsSummary":
            functionResult = getDebtsSummary();
            break;
          case "getCustomerDebt":
            functionResult = getCustomerDebt(args as CustomerDebtArgs);
            break;
          case "getOverdueDebts":
            functionResult = getOverdueDebts();
            break;
          case "getUpcomingDebts":
            functionResult = getUpcomingDebts(args as { days?: number });
            break;
          case "getAllActiveDebts":
            functionResult = getAllActiveDebts(args as { limit?: number });
            break;
          case "getProductDetails":
            functionResult = getProductDetails(args as { query: string });
            break;
          case "navigateApp":
            functionResult = navigateApp(args as { screen: string });
            break;
          default:
            functionResult = { error: "Function not found" };
        }

        // Send function response back
        const functionResponsePayload = {
          contents: [
            ...contents,
            {
              role: "model",
              parts: [{ functionCall: { name, args } }], // We must echo the call
            },
            {
              role: "function",
              parts: [
                {
                  functionResponse: {
                    name: name,
                    response: { result: functionResult },
                  },
                },
              ],
            },
          ],
          tools: toolsREST,
        };

        const secondResponse = await fetch(
          `${this.baseUrl}?key=${this.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(functionResponsePayload),
          }
        );

        if (!secondResponse.ok) {
          // Fallback if the second call fails
          console.error("Second turn error:", await secondResponse.text());
          return "Tuve un problema al procesar los datos de la herramienta.";
        }

        const secondData = await secondResponse.json();
        const secondText =
          secondData.candidates?.[0]?.content?.parts?.[0]?.text;
        return secondText || "No se generó respuesta final.";
      } else {
        // Text response
        return firstPart.text || "Sin respuesta de texto.";
      }
    } catch (error: any) {
      console.error("AI Service Error:", error);
      throw new Error(error.message || "Error de conexión con la IA.");
    }
  }
}
