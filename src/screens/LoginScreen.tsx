// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext"; // Consommation du contexte global
import Input from "../components/Input";
import Button from "../components/Button";
import { colors, spacing } from "../theme";

export default function LoginScreen({ navigation }: any) {
  const isDark = useColorScheme() === "dark";
  const { login: globalLoginContext } = useAuth(); // Récupère la fonction d'App.tsx

  const [loginField, setLoginField] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => authService.login({ login: loginField, password }),
    onSuccess: async (res) => {
      // Stockage de l'utilisateur complet en local si besoin dans les vues privées
      await AsyncStorage.setItem("@shop_user", JSON.stringify(res.data.user));

      // Cette fonction stocke le token et bascule dynamiquement l'application vers le flux privé
      await globalLoginContext(res.data.token);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Erreur de connexion");
    },
  });

  // Palette immersive alignée avec le Dashboard et l'Home public
  const dynamicStyles = {
    mainBg: isDark ? "#0F172A" : "#1E3A8A", // Fond bleu profond signature
    cardBg: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    backBtnText: isDark ? "#3B82F6" : "#93C5FD",
  };

  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: dynamicStyles.mainBg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Bouton retour en arrière si ouvert en modal */}
      <TouchableOpacity
        style={s.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={[s.backButtonText, { color: dynamicStyles.backBtnText }]}>
          ✕ Annuler et revenir
        </Text>
      </TouchableOpacity>

      <View style={[s.card, { backgroundColor: dynamicStyles.cardBg }]}>
        <Text style={s.title}>📱 Shop Manager</Text>
        <Text style={[s.sub, { color: dynamicStyles.textSub }]}>
          Espace Agent & Gérant
        </Text>

        {error ? <Text style={s.err}>{error}</Text> : null}

        <Input
          label="Email ou Téléphone"
          value={loginField}
          onChangeText={setLoginField}
          placeholder="Ex: +243..."
        />

        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry // Assure le masquage des caractères
        />

        <Button
          label="Se connecter"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 25,
    left: spacing.lg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  sub: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
    letterSpacing: 0.3,
  },
  err: {
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.md,
    fontSize: 13,
    fontWeight: "700",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    padding: 10,
    borderRadius: 8,
  },
});
