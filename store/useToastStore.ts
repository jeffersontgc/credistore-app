import { create } from "zustand";

type ToastType = "success" | "error" | "info";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  title?: string;
  showToast: (type: ToastType, title: string, message: string) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: "",
  type: "success",
  title: "",
  showToast: (type, title, message) =>
    set({ visible: true, type, title, message }),
  hideToast: () => set({ visible: false }),
}));
