import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter, useSegments } from "expo-router";

type AuthContextType = {
  userToken: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  userToken: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        if (token) {
          setUserToken(token);
        }
      } catch (e) {
        console.error("Failed to load token", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!userToken && !inAuthGroup) {
      // Redirect to the sign-in page.
      // router.replace("/(auth)/login");
    } else if (userToken && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace("/(tabs)");
    }
  }, [userToken, segments, isLoading]);

  const signIn = async (token: string) => {
    await SecureStore.setItemAsync("userToken", token);
    setUserToken(token);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("userToken");
    setUserToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        userToken,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
