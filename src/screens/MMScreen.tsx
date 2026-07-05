// src/screens/MMScreen.tsx
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
  useColorScheme,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mmService, caisseService } from "../api/client";
import { formatCurrency, formatTime } from "../utils/format";
import { colors, spacing } from "../theme";

export default function MMScreen() {
  const queryClient = useQueryClient();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const [tab, setTab] = useState<"transactions" | "matin" | "soir" | "cloture">(
    "transactions",
  );
  const [form, setForm] = useState({
    operateur: "M-PESA",
    type: "depot",
    client_nom: "",
    numero: "",
    montant: "",
  });
  const [matin, setMatin] = useState({
    liquide_matin: "",
    mm_mpesa_matin: "",
    mm_orange_matin: "",
    mm_airtel_matin: "",
  });
  const [soir, setSoir] = useState({
    mm_mpesa_soir: "",
    mm_orange_soir: "",
    mm_airtel_soir: "",
  });
  const [message, setMessage] = useState("");

  // Styles dynamiques
  const dynamicStyles = {
    mainBg: isDark ? "#0F172A" : "#1E3A8A",
    contentBg: isDark ? "#1E293B" : "#F1F5F9",
    cardBg: isDark ? "#334155" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#1E293B" : "#F8FAFC",
    inputBorder: isDark ? "#475569" : "#E2E8F0",
    typeBtnUnselected: isDark ? "#1E293B" : "#E2E8F0",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mm"],
    queryFn: () => mmService.getAll().then((r) => r.data),
  });

  const { data: caisseData } = useQuery({
    queryKey: ["caisse-etat"],
    queryFn: () => caisseService.getEtat().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      mmService.create({ ...form, montant: parseInt(form.montant) || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mm"] });
      setForm({ ...form, client_nom: "", numero: "", montant: "" });
      setMessage("✅ Transaction enregistrée");
      setTimeout(() => setMessage(""), 3000);
    },
    onError: (e: any) => {
      setMessage("❌ " + (e.response?.data?.message || "Erreur"));
    },
  });

  const matinMutation = useMutation({
    mutationFn: () => caisseService.setMatin(matin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caisse-etat"] });
      setMessage("✅ Matin enregistré");
    },
  });

  const soirMutation = useMutation({
    mutationFn: () => caisseService.setSoir(soir),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caisse-etat"] });
      setMessage("✅ Soir enregistré");
    },
  });

  const clotureMutation = useMutation({
    mutationFn: () => caisseService.cloturer(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caisse-etat"] });
      setMessage("✅ Journée clôturée");
    },
  });

  const rouvrirMutation = useMutation({
    mutationFn: () => caisseService.rouvrir(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caisse-etat"] });
      setMessage("✅ Journée rouverte");
    },
  });

  const transactions = data?.transactions || [];
  const soldes = data?.soldes || {};
  const caisse = caisseData?.caisse || {};
  const isCloture = caisse?.statut === "cloture";
  const operateurs = ["M-PESA", "Orange Money", "Airtel Money"];

  return (
    <View style={[s.main, { backgroundColor: dynamicStyles.mainBg }]}>
      <StatusBar
        style="light"
        backgroundColor={dynamicStyles.mainBg}
        translucent={false}
      />

      <View style={s.header}>
        <Text style={s.title}>📱 Mobile Money</Text>
        <Text
          style={[s.subtitle, { color: isCloture ? "#EF4444" : "#10B981" }]}
        >
          {isCloture ? "🔒 Clôturé" : "🟢 Session Ouverte"}
        </Text>
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
        {/* Soldes en ligne */}
        <View style={s.soldeRow}>
          {operateurs.map((op) => (
            <View
              key={op}
              style={[
                s.soldeCard,
                {
                  backgroundColor: dynamicStyles.cardBg,
                  borderColor: dynamicStyles.inputBorder,
                },
              ]}
            >
              <Text style={[s.soldeName, { color: dynamicStyles.textSub }]}>
                {op.split(" ")[0]}
              </Text>
              <Text style={s.soldeValue}>
                {formatCurrency(soldes[op] || 0)}
              </Text>
            </View>
          ))}
        </View>

        {/* Onglets compacts (Tabs) */}
        <View style={s.tabs}>
          {(["transactions", "matin", "soir", "cloture"] as const).map((t) => (
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
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === "transactions"
                  ? "📋 Tx"
                  : t === "matin"
                    ? "🌅 Matin"
                    : t === "soir"
                      ? "🌆 Soir"
                      : "🔒 Fin"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {message ? <Text style={s.msg}>{message}</Text> : null}

        {/* ONGLET MATIN */}
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
              🌅 Déclaration Caisse Matin
            </Text>
            {[
              "liquide_matin",
              "mm_mpesa_matin",
              "mm_orange_matin",
              "mm_airtel_matin",
            ].map((k) => (
              <View key={k} style={s.inputWrapper}>
                <Text style={[s.inputLabel, { color: dynamicStyles.textMain }]}>
                  {k.replace(/_/g, " ").toUpperCase()}
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
                  placeholder="0 FC"
                  placeholderTextColor="#64748B"
                  value={(matin as any)[k]}
                  onChangeText={(v) => setMatin({ ...matin, [k]: v })}
                  editable={!isCloture}
                />
              </View>
            ))}
            {!isCloture && (
              <TouchableOpacity
                style={s.btn}
                onPress={() => matinMutation.mutate()}
                disabled={matinMutation.isPending}
              >
                {matinMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={s.btnText}>💾 Enregistrer le Matin</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ONGLET SOIR */}
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
              🌆 Déclaration Caisse Soir
            </Text>
            {["mm_mpesa_soir", "mm_orange_soir", "mm_airtel_soir"].map((k) => (
              <View key={k} style={s.inputWrapper}>
                <Text style={[s.inputLabel, { color: dynamicStyles.textMain }]}>
                  {k.replace(/_/g, " ").toUpperCase()}
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
                  placeholder="0 FC"
                  placeholderTextColor="#64748B"
                  value={(soir as any)[k]}
                  onChangeText={(v) => setSoir({ ...soir, [k]: v })}
                  editable={!isCloture}
                />
              </View>
            ))}
            {!isCloture && (
              <TouchableOpacity
                style={s.btn}
                onPress={() => soirMutation.mutate()}
                disabled={soirMutation.isPending}
              >
                {soirMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={s.btnText}>💾 Enregistrer le Soir</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ONGLET CLOTURE */}
        {tab === "cloture" && (
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
              🔒 Verrouillage de la journée
            </Text>
            <Text style={[s.infoText, { color: dynamicStyles.textSub }]}>
              La clôture empêche toute modification ultérieure des soldes ou
              l'ajout de transactions rétroactives.
            </Text>
            {isCloture ? (
              <TouchableOpacity
                style={[s.btn, { backgroundColor: "#F59E0B" }]}
                onPress={() => rouvrirMutation.mutate()}
                disabled={rouvrirMutation.isPending}
              >
                {rouvrirMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={s.btnText}>🔓 Réouvrir la session</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.danger }]}
                onPress={() => clotureMutation.mutate()}
                disabled={clotureMutation.isPending}
              >
                {clotureMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={s.btnText}>🔒 Clôturer la journée</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ONGLET TRANSACTIONS */}
        {tab === "transactions" && (
          <>
            {!isCloture && (
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
                  Nouvelle opération
                </Text>

                {/* Opérateurs */}
                <View style={s.chips}>
                  {operateurs.map((op) => (
                    <TouchableOpacity
                      key={op}
                      style={[
                        s.chip,
                        form.operateur === op
                          ? s.chipActive
                          : {
                              backgroundColor: dynamicStyles.typeBtnUnselected,
                            },
                      ]}
                      onPress={() => setForm({ ...form, operateur: op })}
                    >
                      <Text
                        style={[
                          s.chipText,
                          form.operateur === op
                            ? s.chipTextActive
                            : { color: dynamicStyles.textMain },
                        ]}
                      >
                        {op}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Types dépôts / retraits */}
                <View style={s.typeRow}>
                  <TouchableOpacity
                    style={[
                      s.typeBtn,
                      form.type === "depot"
                        ? s.typeDepot
                        : { backgroundColor: dynamicStyles.typeBtnUnselected },
                    ]}
                    onPress={() => setForm({ ...form, type: "depot" })}
                  >
                    <Text
                      style={[
                        s.typeText,
                        form.type === "depot"
                          ? { color: "#FFF" }
                          : { color: dynamicStyles.textMain },
                      ]}
                    >
                      📥 Dépôt
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.typeBtn,
                      form.type === "retrait"
                        ? s.typeRetrait
                        : { backgroundColor: dynamicStyles.typeBtnUnselected },
                    ]}
                    onPress={() => setForm({ ...form, type: "retrait" })}
                  >
                    <Text
                      style={[
                        s.typeText,
                        form.type === "retrait"
                          ? { color: "#FFF" }
                          : { color: dynamicStyles.textMain },
                      ]}
                    >
                      📤 Retrait
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={s.inputWrapper}>
                  <Text
                    style={[s.inputLabel, { color: dynamicStyles.textMain }]}
                  >
                    Nom du Client
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
                    placeholder="Ex: Jean Mukendi"
                    placeholderTextColor="#64748B"
                    value={form.client_nom}
                    onChangeText={(v) => setForm({ ...form, client_nom: v })}
                  />
                </View>

                <View style={s.inputWrapper}>
                  <Text
                    style={[s.inputLabel, { color: dynamicStyles.textMain }]}
                  >
                    Numéro de téléphone
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
                    placeholder="Ex: 081XXXXXXX"
                    placeholderTextColor="#64748B"
                    value={form.numero}
                    onChangeText={(v) => setForm({ ...form, numero: v })}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={s.inputWrapper}>
                  <Text
                    style={[s.inputLabel, { color: dynamicStyles.textMain }]}
                  >
                    Montant (FC)
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
                    placeholder="Montant de la transaction"
                    placeholderTextColor="#64748B"
                    value={form.montant}
                    onChangeText={(v) => setForm({ ...form, montant: v })}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={[s.btn, s.btnGreen]}
                  onPress={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !form.montant}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={s.btnText}>⚡ Enregistrer l'opération</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Historique du jour */}
            <Text style={[s.sectionTitle, { color: dynamicStyles.textMain }]}>
              📋 FLUX DE TRANSACTIONS DU JOUR
            </Text>
            {transactions.length === 0 ? (
              <Text style={[s.empty, { color: dynamicStyles.textSub }]}>
                Aucune opération enregistrée aujourd'hui.
              </Text>
            ) : (
              transactions.map((tx: any) => (
                <View
                  key={tx.id}
                  style={[
                    s.txRow,
                    {
                      backgroundColor: dynamicStyles.cardBg,
                      borderColor: dynamicStyles.inputBorder,
                    },
                  ]}
                >
                  <Text style={[s.txTime, { color: dynamicStyles.textSub }]}>
                    {formatTime(tx.created_at)}
                  </Text>
                  <View style={{ flex: 1, paddingLeft: 4 }}>
                    <Text style={[s.txOp, { color: dynamicStyles.textMain }]}>
                      {tx.operateur}
                    </Text>
                    {tx.client_nom ? (
                      <Text
                        style={{ fontSize: 11, color: dynamicStyles.textSub }}
                      >
                        {tx.client_nom}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      s.txMontant,
                      { color: tx.type === "depot" ? "#16A34A" : "#DC2626" },
                    ]}
                  >
                    {tx.type === "depot" ? "+" : "-"}
                    {formatCurrency(tx.montant)}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  main: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: 20, paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  subtitle: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
  },

  soldeRow: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
  soldeCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  soldeName: { fontSize: 11, fontWeight: "700" },
  soldeValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3B82F6",
    marginTop: 2,
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
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#FFF" },

  msg: {
    color: "#16A34A",
    textAlign: "center",
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", marginBottom: spacing.md },
  infoText: { fontSize: 13, marginBottom: spacing.md, lineHeight: 18 },

  inputWrapper: { marginBottom: spacing.sm },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
  },

  chips: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.sm,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: { backgroundColor: "#1E3A8A" },
  chipText: { fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#FFF" },

  typeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  typeDepot: { backgroundColor: "#16A34A" },
  typeRetrait: { backgroundColor: "#DC2626" },
  typeText: { fontSize: 13, fontWeight: "700" },

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

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingLeft: 2,
  },
  empty: { textAlign: "center", padding: 24, fontSize: 13 },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
  },
  txTime: { fontSize: 11, fontWeight: "500", width: 45 },
  txOp: { fontSize: 14, fontWeight: "700" },
  txMontant: { fontSize: 14, fontWeight: "800" },
});
