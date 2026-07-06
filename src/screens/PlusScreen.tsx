// src/screens/PlusScreen.tsx
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors, spacing } from "../theme";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - spacing.md * 2 - spacing.sm) / 2;

export default function PlusScreen({ navigation }: any) {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // Thème dynamique adaptatif
  const dynamicStyles = {
    mainBg: isDark ? "#0F172A" : "#1E3A8A",
    contentBg: isDark ? "#1E293B" : "#F1F5F9",
    cardBg: isDark ? "#334155" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    cardBorder: isDark ? "#475569" : "#E2E8F0",
    logoutBg: isDark ? "#451A1A" : "#FEF2F2",
    logoutBorder: isDark ? "#7F1D1D" : "#FECACA",
    logoutText: isDark ? "#FCA5A5" : "#DC2626",
  };

  const menus = [
    {
      label: "🛍️ Articles",
      desc: "Gérer les ventes d'articles divers",
      screen: "Articles",
    },
    {
      label: "🎯 Objectifs",
      desc: "Suivi des objectifs hebdomadaires",
      screen: "Objectifs",
    },
    {
      label: "⚙️ Paramètres",
      desc: "Configuration du système",
      screen: "Settings",
    },
    {
      label: "📦 Archives",
      desc: "Historique des journées clôturées",
      screen: "Archives",
    },
  ];

  const handleLogout = async () => {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.removeItem("@shop_token");
      await AsyncStorage.removeItem("@shop_user");

      // Si tu utilises React Navigation avec un AuthContext ou un état global,
      // déclenche le re-rendu ici. Sinon, tu peux forcer une redirection.
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <View style={[s.main, { backgroundColor: dynamicStyles.mainBg }]}>
      <StatusBar
        style="light"
        backgroundColor={dynamicStyles.mainBg}
        translucent={false}
      />

      <View style={s.header}>
        <Text style={s.title}>⚙️ Plus</Text>
        <Text style={[s.subtitle, { color: isDark ? "#94A3B8" : "#BFDBFE" }]}>
          Outils et configurations de la boutique
        </Text>
      </View>

      <ScrollView
        style={[s.content, { backgroundColor: dynamicStyles.contentBg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.grid}>
          {menus.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[
                s.card,
                {
                  backgroundColor: dynamicStyles.cardBg,
                  borderColor: dynamicStyles.cardBorder,
                  width: CARD_WIDTH,
                },
              ]}
              onPress={() => navigation.navigate(m.screen)}
              activeOpacity={0.7}
            >
              <Text style={s.cardIcon}>{m.label.split(" ")[0]}</Text>
              <Text style={[s.cardTitle, { color: dynamicStyles.textMain }]}>
                {m.label.split(" ").slice(1).join(" ")}
              </Text>
              <Text
                style={[s.cardDesc, { color: dynamicStyles.textSub }]}
                numberOfLines={2}
              >
                {m.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton Déconnexion (Hauteur 48px tactile optimisée) */}
        <TouchableOpacity
          style={[
            s.logout,
            {
              backgroundColor: dynamicStyles.logoutBg,
              borderColor: dynamicStyles.logoutBorder,
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[s.logoutText, { color: dynamicStyles.logoutText }]}>
            🚪 Déconnexion du compte
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  main: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: 55, paddingBottom: 30 },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: "500" },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: "center",
  },
  cardIcon: { fontSize: 28, marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  cardDesc: { fontSize: 12, lineHeight: 16 },

  logout: {
    borderRadius: 12,
    height: 52,
    marginTop: spacing.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { fontWeight: "700", fontSize: 14 },
});
