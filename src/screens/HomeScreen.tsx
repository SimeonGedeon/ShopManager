// src/screens/HomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatCurrency } from "../utils/format";
import { colors, spacing, borderRadius } from "../theme";

const API_URL = "http://10.25.229.54:8000/api";
const SAFE_TOP_SPACE =
  Platform.OS === "ios" ? 44 : RNStatusBar.currentHeight || 0;

// Utilisation du prop de navigation natif à la place de la prop onLogin personnalisée
export default function HomeScreen({ navigation }: any) {
  const { data: tauxData } = useQuery({
    queryKey: ["public-taux"],
    queryFn: () => axios.get(`${API_URL}/taux/actif`).then((r) => r.data),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => axios.get(`${API_URL}/settings/public`).then((r) => r.data),
  });

  const taux = tauxData?.taux || {};
  const settings = settingsData?.settings || {};
  const prixVente = settings?.prix_vente_unitaire || 28;

  const flux = [
    {
      type: "retrait",
      operateur: "Orange Money",
      montant: 25000,
      statut: "Réussi",
      heure: "12:30",
    },
    { type: "alerte", message: "Stock Airtel Crédit bas (< 500 U)" },
    {
      type: "dette",
      client: "Jean M.",
      montant: 4500,
      message: "Crédit non payé",
    },
    {
      type: "depot",
      operateur: "M-Pesa",
      montant: 15000,
      statut: "Réussi",
      heure: "10:15",
    },
  ];

  // Intercepteur pour rediriger l'utilisateur vers la modale de connexion
  const handleRedirectToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={s.mainWrapper}>
      <StatusBar style="light" backgroundColor="#0F172A" translucent={false} />

      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        {/* En-tête Immersif */}
        <View style={s.header}>
          <Text style={s.logo}>📱</Text>
          <Text style={s.title}>Shop Manager</Text>
          <Text style={s.subtitle}>Gestion de shop à Kinshasa</Text>
        </View>

        {/* SECTION TÂCHES RAPIDES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>✨ Tâches Rapides</Text>
          <View style={s.grid}>
            <TouchableOpacity
              style={s.taskCard}
              onPress={handleRedirectToLogin}
              activeOpacity={0.7}
            >
              <Text style={s.taskIcon}>💳</Text>
              <Text style={s.taskLabel}>Vente Crédit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.taskCard}
              onPress={handleRedirectToLogin}
              activeOpacity={0.7}
            >
              <Text style={s.taskIcon}>📥</Text>
              <Text style={s.taskLabel}>Dépôt Retrait</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.taskCard}
              onPress={handleRedirectToLogin}
              activeOpacity={0.7}
            >
              <Text style={s.taskIcon}>📦</Text>
              <Text style={s.taskLabel}>Inventaire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.taskCard}
              onPress={handleRedirectToLogin}
              activeOpacity={0.7}
            >
              <Text style={s.taskIcon}>🔔</Text>
              <Text style={s.taskLabel}>Alertes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BLOC TAUX DU JOUR */}
        {taux.taux_achat_fc && (
          <View style={s.tauxCard}>
            <Text style={s.tauxTitle}>💱 Taux du jour</Text>
            <View style={s.tauxRow}>
              <View style={s.tauxItem}>
                <Text style={s.tauxLabel}>Taux d'Achat (FC → Unités)</Text>
                <Text style={s.tauxValue}>
                  {formatCurrency(taux.taux_achat_fc)} = {taux.unites_par_10usd}{" "}
                  U
                </Text>
              </View>
              <View style={s.tauxItem}>
                <Text style={s.tauxLabel}>Taux d'Échange (FC / 10$)</Text>
                <Text style={s.tauxValue}>
                  {formatCurrency(taux.taux_echange_fc)}
                </Text>
              </View>
            </View>
            <Text style={s.tauxHint}>
              Infos utiles • Vente crédit : {prixVente} FC/unité
            </Text>
          </View>
        )}

        {/* FLUX D'ACTIVITÉ FILTRÉ */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            📊 Flux d'Activité (MM, Dettes & Stocks)
          </Text>
          <View style={s.fluxCard}>
            {flux.map((item, i) => (
              <View key={i}>
                <View style={s.fluxRow}>
                  <Text style={s.fluxIcon}>
                    {item.type === "depot"
                      ? "🟢"
                      : item.type === "retrait"
                        ? "🟠"
                        : item.type === "alerte"
                          ? "🔴"
                          : "👤"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fluxText}>
                      {item.type === "alerte"
                        ? item.message
                        : item.type === "dette"
                          ? `Dette : ${item.client} | ${formatCurrency(item.montant || 0)} (${item.message})`
                          : `${item.type === "depot" ? "Dépôt" : "Retrait"} ${item.operateur} ${formatCurrency(item.montant || 0)} (${item.statut})`}
                    </Text>
                  </View>
                  {item.heure && <Text style={s.fluxTime}>{item.heure}</Text>}
                </View>
                {i < flux.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ACTION DE CONNEXION PRINCIPALE */}
        <TouchableOpacity
          style={s.loginBtn}
          onPress={handleRedirectToLogin}
          activeOpacity={0.8}
        >
          <Text style={s.loginBtnText}>🔐 Se connecter au Shop</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingTop: 30 + SAFE_TOP_SPACE,
    paddingBottom: 30,
    backgroundColor: "#0F172A",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: { fontSize: 44 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFF", marginTop: 6 },
  subtitle: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  taskCard: {
    width: "47.5%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    minHeight: 85,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskIcon: { fontSize: 26, marginBottom: 4 },
  taskLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  tauxCard: {
    backgroundColor: "#1E3A8A",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  tauxTitle: {
    color: "#BFDBFE",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  tauxRow: { flexDirection: "row", gap: spacing.md },
  tauxItem: { flex: 1 },
  tauxLabel: { color: "#93C5FD", fontSize: 11, fontWeight: "500" },
  tauxValue: { color: "#FFF", fontSize: 16, fontWeight: "800", marginTop: 2 },
  tauxHint: {
    color: "#93C5FD",
    fontSize: 11,
    marginTop: spacing.md,
    fontWeight: "600",
  },
  fluxCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fluxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  fluxIcon: { fontSize: 16, marginRight: spacing.sm },
  fluxText: { fontSize: 13, color: colors.text, flex: 1, fontWeight: "600" },
  fluxTime: { fontSize: 11, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border },
  loginBtn: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
