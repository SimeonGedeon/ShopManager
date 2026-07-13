// App.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthContext } from "./src/context/AuthContext"; // Importation du contexte partagé

const queryClient = new QueryClient();

export default function App() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  // Vérification du token existant au chargement de l'application
  useEffect(() => {
    AsyncStorage.getItem("@shop_token")
      .then((token) => setIsAuth(!!token))
      .catch(() => setIsAuth(false));
  }, []);

  // Fonction globale de connexion appelée depuis LoginScreen
  const login = async (token: string) => {
    await AsyncStorage.setItem("@shop_token", token);
    setIsAuth(true);
  };

  // Fonction globale de déconnexion appelée depuis PlusScreen
  const logout = async () => {
    await AsyncStorage.removeItem("@shop_token");
    await AsyncStorage.removeItem("@shop_user");
    setIsAuth(false);
  };

  // Loader d'attente pendant la lecture d'AsyncStorage
  if (isAuth === null) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* On encapsule l'application dans le Provider pour distribuer isAuth, login, et logout */}
      <AuthContext.Provider value={{ isAuth, login, logout }}>
        <AppNavigator isAuth={isAuth} />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A", // Arrière-plan sombre harmonisé
  },
});
