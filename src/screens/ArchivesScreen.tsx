// src/screens/ArchivesScreen.tsx

import React from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { formatCurrency, formatShortDate } from "../utils/format";
import { colors, spacing } from "../theme";

interface Archive {
  id: number;
  date: string;
  benefice_total: number;
  total_ventes_credits_fc: number;
  total_unites_vendues: number;
  total_depots_mm: number;
  total_retraits_mm: number;
}

const SAFE_TOP_SPACE =
  Platform.OS === "ios" ? 44 : RNStatusBar.currentHeight || 0;

export default function ArchivesScreen() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // Palette sémantique adaptative (Charte graphique)
  const dynamicStyles = {
    mainBg: isDark ? "#0F172A" : "#1E3A8A",
    contentBg: isDark ? "#1E293B" : "#F1F5F9",
    cardBg: isDark ? "#334155" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    cardBorder: isDark ? "#475569" : "#E2E8F0",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["archives"],
    queryFn: () => api.get("/archives").then((r) => r.data),
  });

  const archives: Archive[] = data?.data || [];

  return (
    <View style={[s.main, { backgroundColor: dynamicStyles.mainBg }]}>
      <StatusBar
        style="light"
        translucent={false}
        backgroundColor={dynamicStyles.mainBg}
      />

      <View style={s.header}>
        <Text style={s.title}>📦 Archives</Text>
      </View>

      <ScrollView
        style={[s.content, { backgroundColor: dynamicStyles.contentBg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
      >
        {archives.length === 0 ? (
          <Text style={s.empty}>
            Aucune archive enregistrée pour le moment.
          </Text>
        ) : (
          archives.map((a) => (
            <View
              key={a.id}
              style={[
                s.card,
                {
                  backgroundColor: dynamicStyles.cardBg,
                  borderColor: dynamicStyles.cardBorder,
                },
              ]}
            >
              {/* Entête de carte : Date & Bénéfice */}
              <View style={s.row}>
                <Text style={[s.date, { color: dynamicStyles.textMain }]}>
                  {formatShortDate(a.date)}
                </Text>
                <Text
                  style={[
                    s.benefice,
                    {
                      color:
                        (a.benefice_total || 0) >= 0
                          ? colors.success
                          : colors.danger,
                    },
                  ]}
                >
                  {(a.benefice_total || 0) >= 0 ? "+" : ""}
                  {formatCurrency(a.benefice_total || 0)}
                </Text>
              </View>

              {/* Ligne 1 : Flux Telecoms / Unités */}
              <View style={s.row}>
                <Text style={[s.info, { color: dynamicStyles.textSub }]}>
                  Ventes: {formatCurrency(a.total_ventes_credits_fc || 0)}
                </Text>
                <Text style={[s.info, { color: dynamicStyles.textSub }]}>
                  Unités: {a.total_unites_vendues || 0} u
                </Text>
              </View>

              {/* Ligne 2 : Mobile Money Transactions */}
              <View style={s.row}>
                <Text style={[s.info, { color: dynamicStyles.textSub }]}>
                  Dépôts: +{formatCurrency(a.total_depots_mm || 0)}
                </Text>
                <Text style={[s.info, { color: dynamicStyles.textSub }]}>
                  Retraits: -{formatCurrency(a.total_retraits_mm || 0)}
                </Text>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  main: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 15 + SAFE_TOP_SPACE,
    paddingBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  empty: {
    textAlign: "center",
    color: "#94A3B8",
    paddingVertical: 40,
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  date: { fontSize: 14, fontWeight: "700" },
  benefice: { fontSize: 15, fontWeight: "800" },
  info: { fontSize: 12, fontWeight: "500" },
});
