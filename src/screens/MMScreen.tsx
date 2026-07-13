// src/screens/MMScreen.tsx

import React, { useState, useMemo } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mmService, caisseService } from "../api/client";
import { formatCurrency, formatTime } from "../utils/format";
import { spacing } from "../theme";
import ScreenContainer from "../components/ScreenContainer";

const OPERATEURS = ["M-PESA", "Orange Money", "Airtel Money"] as const;

export default function MMScreen() {
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === "dark";

  const [tab, setTab] = useState<"transactions" | "matin" | "soir">(
    "transactions",
  );
  const [message, setMessage] = useState("");

  // Formulaire transaction (Cahier journalier indépendant)
  const [form, setForm] = useState({
    operateur: "M-PESA",
    type: "depot",
    client_nom: "",
    numero: "",
    montant: "",
  });

  // États Matin / Soir
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

  // Pagination locale
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  // Thème unifié
  const dynamicStyles = {
    cardBg: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#0F172A" : "#F8FAFC",
    inputBorder: isDark ? "#334155" : "#E2E8F0",
    tabUnselectedBg: isDark ? "#1E293B" : "#E2E8F0",
    chipUnselectedBg: isDark ? "#334155" : "#E2E8F0",
    borderSeparator: isDark ? "#334155" : "#E2E8F0",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mm"],
    queryFn: () => mmService.getAll().then((r) => r.data),
  });

  const { data: caisseData } = useQuery({
    queryKey: ["caisse-etat"],
    queryFn: () => caisseService.getEtat().then((r) => r.data),
  });

  // Calculs financiers isolés via useMemo pour préserver le thread UI
  const transactions = data?.transactions || [];
  const caisse = caisseData?.caisse || {};
  const isCloture = caisse?.statut === "cloture";

  const stats = useMemo(() => {
    let dep = 0;
    let ret = 0;
    transactions.forEach((t: any) => {
      if (t.type === "depot") dep += t.montant;
      if (t.type === "retrait") ret += t.montant;
    });
    const initialMM =
      (caisse?.mm_mpesa_matin || 0) +
      (caisse?.mm_orange_matin || 0) +
      (caisse?.mm_airtel_matin || 0);
    return {
      totalDepots: dep,
      totalRetraits: ret,
      totalTheorique: initialMM + dep - ret,
    };
  }, [transactions, caisse]);

  const createMutation = useMutation({
    mutationFn: () =>
      mmService.create({ ...form, montant: parseInt(form.montant) || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mm"] });
      setForm({ ...form, client_nom: "", numero: "", montant: "" });
      setMessage("✅ Opération enregistrée");
      setTimeout(() => setMessage(""), 3000);
    },
    onError: (e: any) =>
      setMessage("❌ " + (e.response?.data?.message || "Erreur")),
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

  const totalPages = Math.ceil(transactions.length / PER_PAGE);
  const paginatedTx = transactions.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#3B82F6"
        />
      }
      headerComponent={<Text style={s.title}>📱 Mobile Money</Text>}
    >
      {/* RÉSUMÉ DES SOLDES MATIN (Plus compact) */}
      <View style={s.soldeRow}>
        <View
          style={[
            s.soldeCard,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.inputBorder,
            },
          ]}
        >
          <Text style={[s.soldeName, { color: dynamicStyles.textSub }]}>
            💵 Liquide
          </Text>
          <Text style={[s.soldeValue, { color: dynamicStyles.textMain }]}>
            {formatCurrency(caisse?.liquide_matin || 0)}
          </Text>
        </View>
        {OPERATEURS.map((op) => {
          const key =
            op === "M-PESA"
              ? "mm_mpesa_matin"
              : op === "Orange Money"
                ? "mm_orange_matin"
                : "mm_airtel_matin";
          return (
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
                {formatCurrency(caisse?.[key] || 0)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* TABS CONTROLLER */}
      <View style={s.tabs}>
        {(["transactions", "matin", "soir"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              s.tab,
              tab === t
                ? s.tabActive
                : { backgroundColor: dynamicStyles.tabUnselectedBg },
            ]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[
                s.tabText,
                tab === t ? s.tabTextActive : { color: dynamicStyles.textSub },
              ]}
            >
              {t === "transactions"
                ? "📋 Tx"
                : t === "matin"
                  ? "🌅 Matin"
                  : "🌆 Soir"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {message ? <Text style={s.msg}>{message}</Text> : null}

      {/* TAB 1 : TRANSACTIONS & CAHIER */}
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
              <View style={s.inlineHeader}>
                <Text
                  style={[
                    s.cardTitle,
                    { color: dynamicStyles.textMain, marginBottom: 0 },
                  ]}
                >
                  Nouvelle transaction
                </Text>
                <View style={s.typeRowCompact}>
                  <TouchableOpacity
                    style={[
                      s.miniTypeBtn,
                      form.type === "depot" && s.typeDepot,
                    ]}
                    onPress={() => setForm({ ...form, type: "depot" })}
                  >
                    <Text style={s.miniTypeBtnText}>Dépôt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.miniTypeBtn,
                      form.type === "retrait" && s.typeRetrait,
                    ]}
                    onPress={() => setForm({ ...form, type: "retrait" })}
                  >
                    <Text style={s.miniTypeBtnText}>Retrait</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.chipsCompact}>
                {OPERATEURS.map((op) => (
                  <TouchableOpacity
                    key={op}
                    style={[
                      s.chip,
                      form.operateur === op
                        ? s.chipActive
                        : { backgroundColor: dynamicStyles.chipUnselectedBg },
                    ]}
                    onPress={() => setForm({ ...form, operateur: op })}
                  >
                    <Text
                      style={[
                        s.chipText,
                        form.operateur === op
                          ? s.chipTextActive
                          : { color: dynamicStyles.textSub },
                      ]}
                    >
                      {op.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.formRow}>
                <TextInput
                  style={[
                    s.input,
                    s.formInput,
                    {
                      backgroundColor: dynamicStyles.inputBg,
                      borderColor: dynamicStyles.inputBorder,
                      color: dynamicStyles.textMain,
                    },
                  ]}
                  placeholder="Client"
                  placeholderTextColor="#94A3B8"
                  value={form.client_nom}
                  onChangeText={(v) => setForm({ ...form, client_nom: v })}
                />
                <TextInput
                  style={[
                    s.input,
                    s.formInput,
                    {
                      backgroundColor: dynamicStyles.inputBg,
                      borderColor: dynamicStyles.inputBorder,
                      color: dynamicStyles.textMain,
                    },
                  ]}
                  placeholder="N°"
                  placeholderTextColor="#94A3B8"
                  value={form.numero}
                  onChangeText={(v) => setForm({ ...form, numero: v })}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[
                    s.input,
                    s.formInput,
                    {
                      backgroundColor: dynamicStyles.inputBg,
                      borderColor: dynamicStyles.inputBorder,
                      color: dynamicStyles.textMain,
                    },
                  ]}
                  placeholder="FC"
                  placeholderTextColor="#94A3B8"
                  value={form.montant}
                  onChangeText={(v) => setForm({ ...form, montant: v })}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[s.btn, s.btnGreen, { height: 40, marginTop: 4 }]}
                onPress={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.montant}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.btnText}>⚡ Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* TABLEAU DES TRANSACTIONS */}
          <Text style={[s.sectionTitle, { color: dynamicStyles.textMain }]}>
            📋 Flux du jour
          </Text>
          {paginatedTx.length === 0 ? (
            <Text style={[s.empty, { color: dynamicStyles.textSub }]}>
              Aucune transaction aujourd'hui.
            </Text>
          ) : (
            <>
              <View
                style={[
                  s.tableHeader,
                  { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                ]}
              >
                <Text style={[s.th, { width: 40 }]}>Heure</Text>
                <Text style={[s.th, { flex: 1 }]}>Client</Text>
                <Text style={[s.th, { width: 45 }]}>Op.</Text>
                <Text style={[s.th, { width: 80, textAlign: "right" }]}>
                  Montant
                </Text>
              </View>

              {paginatedTx.map((tx: any) => (
                <View
                  key={tx.id}
                  style={[
                    s.tableRow,
                    {
                      backgroundColor: dynamicStyles.cardBg,
                      borderColor: dynamicStyles.inputBorder,
                    },
                  ]}
                >
                  <Text style={[s.td, { width: 40, color: "#94A3B8" }]}>
                    {formatTime(tx.created_at)}
                  </Text>
                  <Text
                    style={[
                      s.td,
                      {
                        flex: 1,
                        fontWeight: "600",
                        color: dynamicStyles.textMain,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {tx.client_nom || "—"}
                  </Text>
                  <Text
                    style={[
                      s.td,
                      { width: 45, color: dynamicStyles.textSub, fontSize: 11 },
                    ]}
                  >
                    {tx.operateur.split("-")[0].split(" ")[0]}
                  </Text>
                  <Text
                    style={[
                      s.td,
                      {
                        width: 80,
                        textAlign: "right",
                        fontWeight: "700",
                        color: tx.type === "depot" ? "#16A34A" : "#DC2626",
                      },
                    ]}
                  >
                    {tx.type === "depot" ? "+" : "-"}{" "}
                    {formatCurrency(tx.montant)}
                  </Text>
                </View>
              ))}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <View style={s.pagination}>
                  <TouchableOpacity
                    onPress={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <Text style={[s.pageBtn, page === 1 && { opacity: 0.2 }]}>
                      ◀ Précédent
                    </Text>
                  </TouchableOpacity>
                  <Text style={[s.pageInfo, { color: dynamicStyles.textSub }]}>
                    {page} / {totalPages}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    <Text
                      style={[
                        s.pageBtn,
                        page === totalPages && { opacity: 0.2 },
                      ]}
                    >
                      Suivant ▶
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* SOMMAIRE FINANCIER COMPACTÉ */}
              <View
                style={[
                  s.totauxMiniCard,
                  {
                    backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                    borderColor: dynamicStyles.inputBorder,
                  },
                ]}
              >
                <View style={s.miniRow}>
                  <Text style={s.miniLabel}>
                    Dépôts:{" "}
                    <Text style={{ color: "#16A34A", fontWeight: "700" }}>
                      +{formatCurrency(stats.totalDepots)}
                    </Text>
                  </Text>
                  <Text style={s.miniLabel}>
                    Retraits:{" "}
                    <Text style={{ color: "#DC2626", fontWeight: "700" }}>
                      -{formatCurrency(stats.totalRetraits)}
                    </Text>
                  </Text>
                </View>
                <View
                  style={[
                    s.totauxDivider,
                    { borderColor: dynamicStyles.inputBorder },
                  ]}
                />
                <View style={s.miniRow}>
                  <Text
                    style={[
                      s.miniLabel,
                      { fontWeight: "700", color: dynamicStyles.textMain },
                    ]}
                  >
                    Solde théorique global attendu :
                  </Text>
                  <Text style={s.globalTotal}>
                    {formatCurrency(stats.totalTheorique)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </>
      )}

      {/* TAB 2 : MATIN */}
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
            🌅 Déclaration du matin
          </Text>
          {[
            { key: "liquide_matin", lbl: "💵 Liquide de caisse initial" },
            { key: "mm_mpesa_matin", lbl: "📱 Solde Initial M-PESA" },
            { key: "mm_orange_matin", lbl: "🍊 Solde Initial Orange Money" },
            { key: "mm_airtel_matin", lbl: "🔴 Solde Initial Airtel Money" },
          ].map((item) => (
            <View key={item.key} style={s.inputWrap}>
              <Text style={[s.inputLabel, { color: dynamicStyles.textSub }]}>
                {item.lbl}
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
                value={(matin as any)[item.key]}
                onChangeText={(v) => setMatin({ ...matin, [item.key]: v })}
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
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.btnText}>💾 Enregistrer le matin</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* TAB 3 : SOIR */}
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
            🌆 Déclaration du soir
          </Text>
          <Text style={[s.infoText, { color: dynamicStyles.textSub }]}>
            Saisissez le solde réel des puces. Écart basé uniquement sur la
            déclaration brute du matin.
          </Text>

          {OPERATEURS.map((op) => {
            const keyMatin =
              op === "M-PESA"
                ? "mm_mpesa_matin"
                : op === "Orange Money"
                  ? "mm_orange_matin"
                  : "mm_airtel_matin";
            const keySoir =
              op === "M-PESA"
                ? "mm_mpesa_soir"
                : op === "Orange Money"
                  ? "mm_orange_soir"
                  : "mm_airtel_soir";
            const soldeMatin = Number(caisse?.[keyMatin]) || 0;
            const soldeReelSaisi = parseInt((soir as any)[keySoir]);
            const ecart = !isNaN(soldeReelSaisi)
              ? soldeReelSaisi - soldeMatin
              : null;

            return (
              <View
                key={op}
                style={[
                  s.soirBlock,
                  { borderBottomColor: dynamicStyles.borderSeparator },
                ]}
              >
                <Text style={[s.soirOp, { color: dynamicStyles.textMain }]}>
                  📱 {op}
                </Text>
                <View style={s.soirRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.soirLbl}>Matin</Text>
                    <Text
                      style={[s.soirVal, { color: dynamicStyles.textMain }]}
                    >
                      {formatCurrency(soldeMatin)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.soirLbl}>Solde Réel Puce</Text>
                    <TextInput
                      style={[
                        s.input,
                        {
                          backgroundColor: dynamicStyles.inputBg,
                          borderColor: dynamicStyles.inputBorder,
                          color: dynamicStyles.textMain,
                          marginBottom: 0,
                          height: 38,
                        },
                      ]}
                      keyboardType="numeric"
                      placeholder="Solde réel"
                      placeholderTextColor="#64748B"
                      value={(soir as any)[keySoir]}
                      onChangeText={(v) => setSoir({ ...soir, [keySoir]: v })}
                      editable={!isCloture}
                    />
                  </View>
                </View>
                {ecart !== null && (
                  <View
                    style={[
                      s.ecartBox,
                      {
                        backgroundColor:
                          ecart === 0
                            ? isDark
                              ? "#064E3B"
                              : "#F0FDF4"
                            : isDark
                              ? "#7F1D1D"
                              : "#FEF2F2",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: ecart === 0 ? "#10B981" : "#EF4444",
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {ecart === 0
                        ? "✅ Aucun écart direct"
                        : `⚠️ Écart direct : ${ecart > 0 ? "+" : ""}${formatCurrency(ecart)}`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {!isCloture && (
            <TouchableOpacity
              style={s.btn}
              onPress={() => soirMutation.mutate()}
              disabled={soirMutation.isPending}
            >
              {soirMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.btnText}>💾 Enregistrer le soir</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  soldeRow: { flexDirection: "row", gap: 4, marginBottom: spacing.sm },
  soldeCard: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  soldeName: { fontSize: 9, fontWeight: "700" },
  soldeValue: {
    fontSize: 10,
    fontWeight: "800",
    color: "#3B82F6",
    marginTop: 2,
  },

  tabs: { flexDirection: "row", gap: 6, marginBottom: spacing.sm },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#3B82F6" },
  tabText: { fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#FFF" },

  msg: {
    color: "#16A34A",
    textAlign: "center",
    marginBottom: spacing.xs,
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  inlineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: "800" },
  infoText: { fontSize: 11, marginBottom: spacing.sm, lineHeight: 15 },

  inputWrap: { marginBottom: spacing.xs },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
  },

  chipsCompact: { flexDirection: "row", gap: 4, marginBottom: spacing.sm },
  chip: {
    flex: 1,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#3B82F6" },
  chipText: { fontSize: 11, fontWeight: "700" },
  chipTextActive: { color: "#FFF" },

  typeRowCompact: {
    flexDirection: "row",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#334155",
  },
  miniTypeBtn: {
    paddingHorizontal: 10,
    height: 26,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  miniTypeBtnText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  typeDepot: { backgroundColor: "#16A34A" },
  typeRetrait: { backgroundColor: "#DC2626" },

  btn: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGreen: { backgroundColor: "#16A34A" },
  btnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  empty: { textAlign: "center", padding: 10, fontSize: 12 },

  formRow: { flexDirection: "row", gap: 4, marginBottom: spacing.xs },
  formInput: { flex: 1 },

  tableHeader: {
    flexDirection: "row",
    borderRadius: 6,
    padding: 6,
    marginBottom: 2,
  },
  th: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 8,
    marginBottom: 2,
    borderWidth: 1,
  },
  td: { fontSize: 11 },

  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 2,
  },
  pageBtn: { color: "#3B82F6", fontWeight: "700", fontSize: 12, padding: 4 },
  pageInfo: { fontSize: 11 },

  soirBlock: {
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    paddingBottom: spacing.xs,
  },
  soirOp: { fontSize: 12, fontWeight: "800", marginBottom: 2 },
  soirRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  soirLbl: { fontSize: 9, color: "#94A3B8" },
  soirVal: { fontSize: 12, fontWeight: "800" },
  ecartBox: { borderRadius: 6, padding: 6, marginTop: 4 },

  totauxMiniCard: {
    borderRadius: 10,
    padding: 8,
    marginTop: spacing.xs,
    borderWidth: 1,
  },
  miniRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniLabel: { fontSize: 11, color: "#64748B" },
  globalTotal: { fontSize: 14, fontWeight: "900", color: "#3B82F6" },
  totauxDivider: { height: 1, borderTopWidth: 1, marginVertical: 4 },
});
