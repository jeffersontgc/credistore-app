import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import type { INetworkStatus } from "@/interfaces/auth/IOfflineAuth";

/**
 * Custom hook for monitoring network connectivity status
 * Uses @react-native-community/netinfo to detect online/offline state
 */
export function useNetworkStatus(): INetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<INetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
}
