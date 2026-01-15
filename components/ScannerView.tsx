import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { CameraView, BarcodeScanningResult } from "expo-camera";

interface ScannerViewProps {
  scanned: boolean;
  onScanned: (result: BarcodeScanningResult) => void;
}

export function ScannerView({ scanned, onScanned }: ScannerViewProps) {
  return (
    <View className="mx-6 h-64 bg-black rounded-3xl overflow-hidden shadow-2xl border-white relative z-10">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : onScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "code128"],
        }}
      />
      <View className="absolute inset-0 items-center justify-center">
        <View className="w-52 h-40 border-2 border-indigo-400/30 rounded-3xl overflow-hidden">
          <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
          <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
          <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
          <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
          <View className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/50" />
        </View>
      </View>
      {scanned && (
        <View className="absolute inset-0 bg-indigo-900/60 items-center justify-center">
          <ActivityIndicator color="white" size="large" />
          <Text className="text-white font-black mt-4">¡PROCESANDO!</Text>
        </View>
      )}
    </View>
  );
}
