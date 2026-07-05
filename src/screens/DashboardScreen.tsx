// src/screens/DashboardScreen.tsx
import React from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme, // 👈 Hook magique pour écouter le mode du système
} from "react-native";
import { StatusBar } from "expo-status-bar"; // 👈 Prise en charge propre de la barre supérieure
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../api/client";
import { formatCurrency, formatDate } from "../utils/format";
import { spacing } from "../theme";

export default function DashboardScreen({ navigation }: any) {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.get().then((r) => r.data),
    refetchInterval: 60000,
  });

  // Palette sémantique et dynamique s'adaptant instantanément
  const dynamicStyles = {
    mainBg: isDark ? "#0F172A" : "#1E3A8A", // Fond en-tête
    contentBg: isDark ? "#1E293B" : "#F1F5F9", // Fond conteneur principal
    cardBg: isDark ? "#334155" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    cardBorder: isDark ? "#475569" : "#E2E8F0",
    progressEmpty: isDark ? "#1E293B" : "#E2E8F0",
    dividerBg: isDark ? "#475569" : "#EDF2F7",
  };

  const d = data?.data || {};
  const p = Math.min(d.objectif?.progression || 65, 100);

  return (
    <View style={[s.mainContainer, { backgroundColor: dynamicStyles.mainBg }]}>
      {/* 🚀 Empêche la superposition sauvage sous l'encoche de l'appareil */}
      <StatusBar
        style="light"
        backgroundColor={dynamicStyles.mainBg}
        translucent={false}
      />

      {/* En-tête Immersif */}
      <View style={s.headerContainer}>
        <Text style={s.appTitle}>📱 Shop Manager</Text>
        <Text style={[s.agentInfo, { color: dynamicStyles.textSub }]}>
          Utilisateur: <Text style={s.boldText}>Agent</Text> |{" "}
          {d.date ? formatDate(d.date) : "Mardi 15 Juillet 2026"}
        </Text>
      </View>

      {/* Conteneur de Contenu Principal */}
      <ScrollView
        style={[
          s.contentContainer,
          { backgroundColor: dynamicStyles.contentBg },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
      >
        {/* SITUATION DE LA CAISSE */}
        <Text style={[s.sectionTitle, { color: dynamicStyles.textMain }]}>
          SITUATION DE LA CAISSE
        </Text>

        <View style={s.grid}>
          {/* Caisse Liquide */}
          <View
            style={[
              s.statCard,
              {
                backgroundColor: dynamicStyles.cardBg,
                borderColor: dynamicStyles.cardBorder,
              },
            ]}
          >
            <Text style={[s.cardLabel, { color: dynamicStyles.textSub }]}>
              En Caisse (Liquide)
            </Text>
            <Text style={[s.cardValue, { color: "#2563EB" }]}>
              {d.en_caisse ? formatCurrency(d.en_caisse) : "145 000 FC"}
            </Text>
          </View>

          {/* Unités Crédit */}
          <View
            style={[
              s.statCard,
              {
                backgroundColor: dynamicStyles.cardBg,
                borderColor: dynamicStyles.cardBorder,
              },
            ]}
          >
            <Text style={[s.cardLabel, { color: dynamicStyles.textSub }]}>
              Unités Crédit Restantes
            </Text>
            <Text style={[s.cardValue, { color: "#16A34A" }]}>
              {d.unites_vendues ? `${d.unites_vendues} U` : "4 250 U"}
            </Text>
          </View>

          {/* Solde Mobile Money */}
          <View
            style={[
              s.statCard,
              {
                backgroundColor: dynamicStyles.cardBg,
                borderColor: dynamicStyles.cardBorder,
              },
            ]}
          >
            <Text style={[s.cardLabel, { color: dynamicStyles.textSub }]}>
              Solde Mobile Money
            </Text>
            <Text style={[s.cardValue, { color: "#D97706" }]}>
              {d.solde_mm ? formatCurrency(d.solde_mm) : "850 000 FC"}
            </Text>
            <View style={s.badgeRow}>
              <View style={[s.miniBadge, { backgroundColor: "#22C55E" }]}>
                <Text style={s.badgeText}>M</Text>
              </View>
              <View style={[s.miniBadge, { backgroundColor: "#F97316" }]}>
                <Text style={s.badgeText}>O</Text>
              </View>
              <View style={[s.miniBadge, { backgroundColor: "#EF4444" }]}>
                <Text style={s.badgeText}>A</Text>
              </View>
            </View>
          </View>

          {/* Dettes Clients */}
          <View
            style={[
              s.statCard,
              {
                backgroundColor: dynamicStyles.cardBg,
                borderColor: dynamicStyles.cardBorder,
              },
            ]}
          >
            <Text style={[s.cardLabel, { color: dynamicStyles.textSub }]}>
              Dettes Clients Actives
            </Text>
            <Text style={[s.cardValue, { color: "#DC2626" }]}>
              {d.dettes_actives
                ? formatCurrency(d.dettes_actives)
                : "35 000 FC"}
            </Text>
          </View>
        </View>

        {/* OBJECTIF HEBDOMADAIRE */}
        <View
          style={[
            s.objectifWrapper,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.cardBorder,
            },
          ]}
        >
          <Text style={[s.objectifLabel, { color: dynamicStyles.textMain }]}>
            OBJECTIF HEBDOMADAIRE (Bénéfice Crédit)
          </Text>

          <View
            style={[
              s.progressContainer,
              { backgroundColor: dynamicStyles.progressEmpty },
            ]}
          >
            <View style={[s.progressFill, { width: `${p}%` }]}>
              <Text style={s.progressPercentText}>{p}%</Text>
            </View>
          </View>

          <View style={s.objectifFooter}>
            <Text
              style={[s.objectifFooterText, { color: dynamicStyles.textMain }]}
            >
              {d.objectif?.realise
                ? formatCurrency(d.objectif.realise)
                : "130 000 FC"}{" "}
              /{" "}
              {d.objectif?.objectif_hebdomadaire
                ? formatCurrency(d.objectif.objectif_hebdomadaire)
                : "200 000 FC"}
            </Text>
            <View style={s.miniIndicator} />
          </View>
        </View>

        {/* ACTIONS RAPIDES */}
        <Text style={[s.sectionTitle, { color: dynamicStyles.textMain }]}>
          ACTIONS RAPIDES
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.actionsRow}
        >
          <TouchableOpacity
            style={s.actionButton}
            onPress={() => navigation.navigate("Stocks")}
            activeOpacity={0.8}
          >
            <Text style={s.actionButtonText}>💳 Vente Crédit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionButton}
            onPress={() => navigation.navigate("MM")}
            activeOpacity={0.8}
          >
            <Text style={s.actionButtonText}>📥 Dépôt/Retrait MM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionButton}
            onPress={() => navigation.navigate("Plus")}
            activeOpacity={0.8}
          >
            <Text style={s.actionButtonText}>🛍️ Autre Article</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ALERTES */}
        <Text style={[s.sectionTitle, { color: dynamicStyles.textMain }]}>
          ALERTES
        </Text>
        <View
          style={[
            s.alertBox,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.cardBorder,
            },
          ]}
        >
          <View style={s.alertItem}>
            <Text style={[s.alertText, { color: dynamicStyles.textMain }]}>
              ⚠️ <Text style={s.boldText}>Stock bas:</Text> Airtel Crédit (500U)
            </Text>
          </View>
          <View
            style={[s.divider, { backgroundColor: dynamicStyles.dividerBg }]}
          />
          <View style={s.alertItem}>
            <Text style={[s.alertText, { color: dynamicStyles.textMain }]}>
              📉 <Text style={s.boldText}>Écart hier:</Text> -2 500 FC (À
              justifier)
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 20,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  agentInfo: {
    fontSize: 13,
    marginTop: 4,
  },
  boldText: {
    fontWeight: "700",
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48.5%",
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    minHeight: 85,
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
  },
  miniBadge: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  objectifWrapper: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  objectifLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  progressContainer: {
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 10,
  },
  progressPercentText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  objectifFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  objectifFooterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  miniIndicator: {
    width: 20,
    height: 6,
    backgroundColor: "#2563EB",
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: "row",
    marginVertical: spacing.xs,
  },
  actionButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  alertBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: spacing.sm,
  },
  alertItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  alertText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
