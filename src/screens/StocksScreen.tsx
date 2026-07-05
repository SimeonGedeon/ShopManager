// src/screens/StocksScreen.tsx
import React, { useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme, // 👈 Hook magique pour écouter le système (dark ou light)
} from "react-native";
import { StatusBar } from "expo-status-bar"; // 👈 Gère la barre d'état sup intelligemment
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockService } from "../api/client";
import { colors, spacing } from "../theme";

export default function StocksScreen() {
  const queryClient = useQueryClient();
  const systemTheme = useColorScheme(); // 'dark' ou 'light'

  const [tab, setTab] = useState<"matin" | "vente" | "soir">("matin");
  const [reseauId, setReseauId] = useState<number | null>(null);
  const [montant, setMontant] = useState("");
  const [stocks, setStocks] = useState<Record<number, string>>({});

  // Définition dynamique des thèmes selon le système
  const isDark = systemTheme === "dark";
  const dynamicStyles = {
    mainBg: isDark ? "#0F172A" : "#1E3A8A", // Plus foncé en dark, bleu corporate en light
    contentBg: isDark ? "#1E293B" : "#F1F5F9", // Fond intérieur
    cardBg: isDark ? "#334155" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#1E293B" : "#F8FAFC",
    inputBorder: isDark ? "#475569" : "#E2E8F0",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stockService.getAll().then((r) => r.data),
  });

  const matinMutation = useMutation({
    mutationFn: () =>
      stockService.setMatin(
        Object.entries(stocks).map(([id, v]) => ({
          reseau_id: parseInt(id),
          stock_matin: parseInt(v) || 0,
        })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      setStocks({});
    },
  });

  const venteMutation = useMutation({
    mutationFn: () =>
      stockService.vendre({
        reseau_id: reseauId,
        montant_encaisse: parseInt(montant),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      setMontant("");
    },
  });

  const reseaux = data?.reseaux || [];
  const stocksData = data?.stocks || [];

  if (reseaux.length > 0 && reseauId === null) {
    setReseauId(reseaux[0].id);
  }

  return (
    <View style={[s.main, { backgroundColor: dynamicStyles.mainBg }]}>
      {/* 🚀 Fixe la StatusBar pour qu'elle soit visible et s'adapte (style="light" car le header reste sombre) */}
      <StatusBar
        style="light"
        backgroundColor={dynamicStyles.mainBg}
        translucent={false}
      />

      {/* En-tête */}
      <View style={s.header}>
        <Text style={s.title}>📦 Gestion des Stocks</Text>
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
        {/* Navigation par Onglets */}
        <View style={s.tabs}>
          {(["matin", "vente", "soir"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                s.tab,
                tab === t
                  ? s.tabActive
                  : { backgroundColor: isDark ? "#334155" : "#E2E8F0" },
              ]}
              onPress={() => setTab(t)}
            >
              <Text
                style={[
                  s.tabText,
                  tab === t
                    ? s.tabTextActive
                    : { color: dynamicStyles.textSub },
                ]}
              >
                {t === "matin"
                  ? "🌅 Matin"
                  : t === "vente"
                    ? "💳 Vente"
                    : "🌆 Soir"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CONTENU MATIN */}
        {tab === "matin" && (
          <View
            style={[
              s.card,
              {
                backgroundColor: dynamicStyles.cardBg,
                borderColor: dynamicStyles.inputBorder,
              },
            ]}
          >
            <Text style={[s.cardTitle, { color: dynamicStyles.textMain }]}>
              Déclarer le stock du matin
            </Text>
            {reseaux.map((r: any) => (
              <View key={r.id} style={s.inputWrapper}>
                <Text style={[s.inputLabel, { color: dynamicStyles.textMain }]}>
                  {r.nom}
                </Text>
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: dynamicStyles.inputBg,
                      borderColor: dynamicStyles.inputBorder,
                      color: dynamicStyles.textMain,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="0 unités"
                  placeholderTextColor="#64748B"
                  value={stocks[r.id] || ""}
                  onChangeText={(v) => setStocks({ ...stocks, [r.id]: v })}
                />
              </View>
            ))}
            <TouchableOpacity
              style={s.btn}
              onPress={() => matinMutation.mutate()}
              disabled={matinMutation.isPending}
            >
              {matinMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={s.btnText}>💾 Enregistrer le matin</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* CONTENU VENTE */}
        {tab === "vente" && (
          <View
            style={[
              s.card,
              {
                backgroundColor: dynamicStyles.cardBg,
                borderColor: dynamicStyles.inputBorder,
              },
            ]}
          >
            <Text style={[s.cardTitle, { color: dynamicStyles.textMain }]}>
              Vente rapide de crédit
            </Text>
            <Text style={[s.subLabel, { color: dynamicStyles.textSub }]}>
              Sélectionnez le réseau :
            </Text>
            <View style={s.chips}>
              {reseaux.map((r: any) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    s.chip,
                    reseauId === r.id
                      ? s.chipActive
                      : { backgroundColor: isDark ? "#1E293B" : "#E2E8F0" },
                  ]}
                  onPress={() => setReseauId(r.id)}
                >
                  <Text
                    style={[
                      s.chipText,
                      reseauId === r.id
                        ? s.chipTextActive
                        : { color: dynamicStyles.textSub },
                    ]}
                  >
                    {r.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.inputWrapper}>
              <Text style={[s.inputLabel, { color: dynamicStyles.textMain }]}>
                Montant de la vente
              </Text>
              <TextInput
                style={[
                  s.input,
                  {
                    backgroundColor: dynamicStyles.inputBg,
                    borderColor: dynamicStyles.inputBorder,
                    color: dynamicStyles.textMain,
                  },
                ]}
                keyboardType="numeric"
                placeholder="Ex: 5000 FC"
                placeholderTextColor="#64748B"
                value={montant}
                onChangeText={setMontant}
              />
            </View>

            <TouchableOpacity
              style={[s.btn, s.btnGreen]}
              onPress={() => venteMutation.mutate()}
              disabled={venteMutation.isPending || !montant}
            >
              {venteMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={s.btnText}>💰 Valider la vente</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* CONTENU SOIR */}
        {tab === "soir" && (
          <View
            style={[
              s.card,
              {
                backgroundColor: dynamicStyles.cardBg,
                borderColor: dynamicStyles.inputBorder,
              },
            ]}
          >
            <Text style={[s.cardTitle, { color: dynamicStyles.textMain }]}>
              Suivi du stock soir
            </Text>
            {stocksData.length === 0 ? (
              <Text style={[s.emptyText, { color: dynamicStyles.textSub }]}>
                Aucun stock déclaré ce matin.
              </Text>
            ) : (
              stocksData.map((sData: any) => (
                <View
                  key={sData.id}
                  style={[
                    s.stockRow,
                    { borderBottomColor: dynamicStyles.inputBorder },
                  ]}
                >
                  <Text
                    style={[s.stockRowName, { color: dynamicStyles.textMain }]}
                  >
                    📍 {sData.reseau?.nom || "Réseau"}
                  </Text>
                  <Text
                    style={[s.stockRowVal, { color: dynamicStyles.textSub }]}
                  >
                    {sData.stock_matin} →{" "}
                    <Text
                      style={{
                        fontWeight: "700",
                        color: dynamicStyles.textMain,
                      }}
                    >
                      {sData.stock_soir ?? "En cours"}
                    </Text>{" "}
                    U
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* SITUATION ACTUELLE */}
        <Text style={[s.sectionTitle, { color: dynamicStyles.textMain }]}>
          SITUATION ACTUELLE DES STOCKS
        </Text>
        {stocksData.map((sData: any) => {
          const pct =
            sData.stock_matin > 0
              ? Math.round(
                  ((sData.stock_soir ?? sData.stock_matin) /
                    sData.stock_matin) *
                    100,
                )
              : 0;
          return (
            <View
              key={sData.id}
              style={[
                s.stockCard,
                {
                  backgroundColor: dynamicStyles.cardBg,
                  borderColor: dynamicStyles.inputBorder,
                },
              ]}
            >
              <View style={s.stockHeader}>
                <Text style={[s.stockName, { color: dynamicStyles.textMain }]}>
                  {sData.reseau?.nom || "Réseau"}
                </Text>
                <Text style={[s.stockVal, { color: dynamicStyles.textSub }]}>
                  <Text
                    style={{ fontWeight: "700", color: dynamicStyles.textMain }}
                  >
                    {sData.stock_soir ?? sData.stock_matin}
                  </Text>{" "}
                  / {sData.stock_matin} U
                </Text>
              </View>
              <View
                style={[
                  s.bar,
                  { backgroundColor: isDark ? "#1E293B" : "#E2E8F0" },
                ]}
              >
                <View
                  style={[
                    s.barFill,
                    {
                      width: `${pct}%`,
                      backgroundColor:
                        pct <= 20
                          ? "#EF4444"
                          : pct <= 50
                            ? "#F59E0B"
                            : "#10B981",
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  main: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: 20, paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
  },

  tabs: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#3B82F6" },
  tabText: { fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: "#FFF" },

  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", marginBottom: spacing.md },
  subLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },

  inputWrapper: { marginBottom: spacing.md },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
  },

  btn: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  btnGreen: { backgroundColor: "#16A34A" },
  btnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  chips: { flexDirection: "row", gap: 8, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#1E3A8A" },
  chipText: { fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: "#FFF" },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingLeft: 2,
  },
  stockCard: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  stockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stockName: { fontSize: 14, fontWeight: "700" },
  stockVal: { fontSize: 13 },

  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stockRowName: { fontSize: 14, fontWeight: "500" },
  stockRowVal: { fontSize: 14 },

  emptyText: { textAlign: "center", fontSize: 13, marginVertical: spacing.md }, // 👈 Fixé ici : textAlign !
  bar: { height: 6, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
});
