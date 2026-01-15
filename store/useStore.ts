import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { produce } from "immer";

// --- Types ---

export enum ProductType {
  GRANOS_BASICOS = "granos_basicos",
  SNACKS = "snacks",
  BEBIDAS = "bebidas",
  LACTEOS = "lacteos",
}

export interface Barcode {
  barcode: string;
}

export interface Product {
  uuid: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  type: ProductType;
  barcodes: Barcode[];
  createdAt: string;
}

export interface User {
  uuid: string;
  firstname: string;
  lastname: string;
  phone: string;
}

export enum DebtStatus {
  ACTIVE = "active",
  PENDING = "pending",
  PAID = "paid",
  SETTLED = "settled",
}

export interface SaleItem {
  product_uuid: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  uuid: string;
  totalAmount: number;
  items: SaleItem[];
  createdAt: string;
}

export interface Debt {
  uuid: string;
  user: User;
  amount: number;
  status: DebtStatus;
  date_pay: string;
  products: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  products: Product[];
  users: User[]; // Customers
  sales: Sale[];
  debts: Debt[];

  // Actions - Products
  addProduct: (
    product: Omit<Product, "uuid" | "createdAt" | "barcodes"> & {
      barcode?: string;
    }
  ) => void;
  updateProduct: (uuid: string, updates: Partial<Product>) => void;
  deleteProduct: (uuid: string) => void;

  // Actions - Users (Customers)
  addUser: (user: Omit<User, "uuid">) => void;
  deleteUser: (uuid: string) => void;

  // Actions - Sales & Checkout
  processSale: (items: { product_uuid: string; quantity: number }[]) => void;
  processDebt: (
    user_uuid: string,
    dueDate: string,
    items: { product_uuid: string; quantity: number }[]
  ) => void;

  // Actions - Debts
  updateDebtStatus: (uuid: string, status: DebtStatus) => void;

  // Helpers
  clearAllData: () => void;
}

// --- Helpers ---

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// --- Store ---

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
      users: [],
      sales: [],
      debts: [],

      addProduct: (input) => {
        const newProduct: Product = {
          ...input,
          uuid: generateUUID(),
          barcodes: input.barcode ? [{ barcode: input.barcode }] : [],
          createdAt: new Date().toISOString(),
        };
        set(
          produce((state: AppState) => {
            state.products.push(newProduct);
          })
        );
      },

      updateProduct: (uuid, updates) => {
        set(
          produce((state: AppState) => {
            const index = state.products.findIndex((p) => p.uuid === uuid);
            if (index !== -1) {
              state.products[index] = { ...state.products[index], ...updates };
            }
          })
        );
      },

      deleteProduct: (uuid) => {
        set(
          produce((state: AppState) => {
            state.products = state.products.filter((p) => p.uuid !== uuid);
          })
        );
      },

      addUser: (input) => {
        const newUser: User = {
          ...input,
          uuid: generateUUID(),
        };
        set(
          produce((state: AppState) => {
            state.users.push(newUser);
          })
        );
      },

      deleteUser: (uuid) => {
        set(
          produce((state: AppState) => {
            state.users = state.users.filter((u) => u.uuid !== uuid);
          })
        );
      },

      processSale: (items) => {
        const state = get();
        let totalAmount = 0;
        const saleItems: SaleItem[] = [];

        set(
          produce((draft: AppState) => {
            items.forEach((item) => {
              const product = draft.products.find(
                (p) => p.uuid === item.product_uuid
              );
              if (product) {
                const subtotal = product.price * item.quantity;
                totalAmount += subtotal;
                saleItems.push({
                  product_uuid: product.uuid,
                  name: product.name,
                  quantity: item.quantity,
                  price: product.price,
                });
                product.stock -= item.quantity; // Update local stock
              }
            });

            draft.sales.push({
              uuid: generateUUID(),
              totalAmount,
              items: saleItems,
              createdAt: new Date().toISOString(),
            });
          })
        );
      },

      processDebt: (user_uuid, dueDate, items) => {
        const state = get();
        const customer = state.users.find((u) => u.uuid === user_uuid);
        if (!customer) return;

        let totalAmount = 0;
        const saleItems: SaleItem[] = [];

        set(
          produce((draft: AppState) => {
            items.forEach((item) => {
              const product = draft.products.find(
                (p) => p.uuid === item.product_uuid
              );
              if (product) {
                const subtotal = product.price * item.quantity;
                totalAmount += subtotal;
                saleItems.push({
                  product_uuid: product.uuid,
                  name: product.name,
                  quantity: item.quantity,
                  price: product.price,
                });
                product.stock -= item.quantity;
              }
            });

            draft.debts.push({
              uuid: generateUUID(),
              user: customer,
              amount: totalAmount,
              status: DebtStatus.ACTIVE,
              date_pay: dueDate,
              products: saleItems,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          })
        );
      },

      updateDebtStatus: (uuid, status) => {
        set(
          produce((state: AppState) => {
            const index = state.debts.findIndex((d) => d.uuid === uuid);
            if (index !== -1) {
              state.debts[index].status = status;
              state.debts[index].updatedAt = new Date().toISOString();
            }
          })
        );
      },

      clearAllData: () =>
        set({ products: [], users: [], sales: [], debts: [] }),
    }),
    {
      name: "credistore-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
