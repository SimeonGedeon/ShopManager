// src/screens/CaisseScreen.tsx
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
import { caisseService, detteService } from "../api/client";
import { formatCurrency } from "../utils/format";
import { colors, spacing } from "../theme";

export default function CaisseScreen() {
  const queryClient = useQueryClient();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const [tab, setTab] = useState<"resume" | "soir" | "dettes" | "cloture">(
    "resume",
  );
  const [message, setMessage] = useState("");
  const [soirForm, setSoirForm] = useState({
    liquide_soir: "",
    mm_mpesa_soir: "",
    mm_orange_soir: "",
    mm_airtel_soir: "",
  });

  // Dette form
  const [detteForm, setDetteForm] = useState({
    client_nom: "",
    client_phone: "",
    montant: "",
    commentaire: "",
  });
  const [rembId, setRembId] = useState<number | null>(null);
  const [rembMontant, setRembMontant] = useState("");

  // Styles thématiques dynamiques
  const dynamicStyles = {
    mainBg: isDark ? "#0F172A" : "#1E3A8A",
    contentBg: isDark ? "#1E293B" : "#F1F5F9",
    cardBg: isDark ? "#334155" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#1E293B" : "#F8FAFC",
    inputBorder: isDark ? "#475569" : "#E2E8F0",
    tabUnselected: isDark ? "#334155" : "#E2E8F0",
    borderSeparator: isDark ? "#475569" : "#E2E8F0",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["caisse-resume"],
    queryFn: () => caisseService.getResume().then((r) => r.data),
  });

  const { data: etatData } = useQuery({
    queryKey: ["caisse-etat"],
    queryFn: () => caisseService.getEtat().then((r) => r.data),
  });

  const { data: dettesData } = useQuery({
    queryKey: ["dettes"],
    queryFn: () => detteService.getAll().then((r) => r.data),
  });

  const soirMutation = useMutation({
    mutationFn: () => caisseService.setSoir(soirForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caisse-resume"] });
      setMessage("✅ Soir enregistré");
      setTimeout(() => setMessage(""), 3000);
    },
  });

  const detteCreateMutation = useMutation({
    mutationFn: () =>
      detteService.create({
        ...detteForm,
        montant: parseInt(detteForm.montant) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dettes"] });
      setDetteForm({
        client_nom: "",
        client_phone: "",
        montant: "",
        commentaire: "",
      });
      setMessage("✅ Dette ajoutée");
      setTimeout(() => setMessage(""), 3000);
    },
  });

  const rembourserMutation = useMutation({
    mutationFn: () =>
      detteService.rembourser(rembId!, parseInt(rembMontant) || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dettes"] });
      setRembId(null);
      setRembMontant("");
    },
  });

  const annulerMutation = useMutation({
    mutationFn: (id: number) => detteService.annuler(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dettes"] });
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

  const d = data?.data || {};
  const caisse = etatData?.caisse || {};
  const isCloture = caisse?.statut === "cloture";
  const dettes = dettesData?.dettes || [];
  const totalDettes = dettes.reduce(
    (s: number, current: any) =>
      s + (current.montant - (current.montant_rembourse || 0)),
    0,
  );

  return (
    <View style={[s.main, { backgroundColor: dynamicStyles.mainBg }]}>
      <StatusBar
        style="light"
        backgroundColor={dynamicStyles.mainBg}
        translucent={false}
      />

      <View style={s.header}>
        <Text style={s.title}>💵 Caisse Principale</Text>
        <Text
          style={[s.subtitle, { color: isCloture ? "#EF4444" : "#10B981" }]}
        >
          {isCloture ? "🔒 Clôturée" : "🟢 Session Ouverte"}
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
        {/* Navigation par Onglets */}
        <View style={s.tabs}>
          {(["resume", "soir", "dettes", "cloture"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                s.tab,
                tab === t
                  ? s.tabActive
                  : { backgroundColor: dynamicStyles.tabUnselected },
              ]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === "resume"
                  ? "📊 Résumé"
                  : t === "soir"
                    ? "🌆 Soir"
                    : t === "dettes"
                      ? "📋 Dettes"
                      : "🔒 Fin"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {message ? <Text style={s.msg}>{message}</Text> : null}

        {/* ONGLET 1 : RÉSUMÉ DES FLUX */}
        {tab === "resume" && (
          <>
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
                🔓 Report d'Ouverture
              </Text>
              <View style={s.row2}>
                <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                  Liquide en Caisse
                </Text>
                <Text style={[s.val, { color: dynamicStyles.textMain }]}>
                  {formatCurrency(d.ouverture?.liquide || 0)}
                </Text>
              </View>
              <View style={s.row2}>
                <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                  Comptes Mobile Money
                </Text>
                <Text style={[s.val, { color: dynamicStyles.textMain }]}>
                  {formatCurrency(d.ouverture?.mm || 0)}
                </Text>
              </View>
              <View
                style={[
                  s.row2Bold,
                  { borderTopColor: dynamicStyles.borderSeparator },
                ]}
              >
                <Text style={[s.lblBold, { color: dynamicStyles.textMain }]}>
                  Total initial
                </Text>
                <Text style={[s.valBold, { color: dynamicStyles.textMain }]}>
                  {formatCurrency(d.ouverture?.total || 0)}
                </Text>
              </View>
            </View>

            <View
              style={[
                s.card,
                {
                  backgroundColor: dynamicStyles.cardBg,
                  borderColor: dynamicStyles.inputBorder,
                },
              ]}
            >
              <Text style={[s.cardTitle, { color: "#10B981" }]}>
                📥 Flux Entrants (Entrées)
              </Text>
              <View style={s.row2}>
                <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                  Ventes crédits
                </Text>
                <Text style={[s.val, { color: "#10B981" }]}>
                  +{formatCurrency(d.entrees?.ventes_credits || 0)}
                </Text>
              </View>
              <View style={s.row2}>
                <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                  Ventes articles
                </Text>
                <Text style={[s.val, { color: "#10B981" }]}>
                  +{formatCurrency(d.entrees?.ventes_articles || 0)}
                </Text>
              </View>
              <View style={s.row2}>
                <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                  Dépôts MM effectués
                </Text>
                <Text style={[s.val, { color: "#10B981" }]}>
                  +{formatCurrency(d.entrees?.depots_mm || 0)}
                </Text>
              </View>
              <View
                style={[
                  s.row2Bold,
                  { borderTopColor: dynamicStyles.borderSeparator },
                ]}
              >
                <Text style={[s.lblBold, { color: dynamicStyles.textMain }]}>
                  Total Entrées
                </Text>
                <Text style={[s.valBold, { color: "#10B981" }]}>
                  +{formatCurrency(d.entrees?.total || 0)}
                </Text>
              </View>
            </View>

            <View
              style={[
                s.card,
                {
                  backgroundColor: dynamicStyles.cardBg,
                  borderColor: dynamicStyles.inputBorder,
                },
              ]}
            >
              <Text style={[s.cardTitle, { color: "#EF4444" }]}>
                📤 Flux Sortants (Sorties)
              </Text>
              <View style={s.row2}>
                <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                  Achats stock Telecom
                </Text>
                <Text style={[s.val, { color: "#EF4444" }]}>
                  -{formatCurrency(d.sorties?.achats_stock || 0)}
                </Text>
              </View>
              <View style={s.row2}>
                <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                  Achats approv. articles
                </Text>
                <Text style={[s.val, { color: "#EF4444" }]}>
                  -{formatCurrency(d.sorties?.achats_articles || 0)}
                </Text>
              </View>
              <View style={s.row2}>
                <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                  Retraits MM servis
                </Text>
                <Text style={[s.val, { color: "#EF4444" }]}>
                  -{formatCurrency(d.sorties?.retraits_mm || 0)}
                </Text>
              </View>
              <View style={s.row2}>
                <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                  Dépenses courantes
                </Text>
                <Text style={[s.val, { color: "#EF4444" }]}>
                  -{formatCurrency(d.sorties?.total_depenses || 0)}
                </Text>
              </View>
              <View
                style={[
                  s.row2Bold,
                  { borderTopColor: dynamicStyles.borderSeparator },
                ]}
              >
                <Text style={[s.lblBold, { color: dynamicStyles.textMain }]}>
                  Total Sorties
                </Text>
                <Text style={[s.valBold, { color: "#EF4444" }]}>
                  -{formatCurrency(d.sorties?.total || 0)}
                </Text>
              </View>
            </View>

            <View
              style={[
                s.card,
                { backgroundColor: "#1E3A8A", borderColor: "transparent" },
              ]}
            >
              <Text style={[s.cardTitle, { color: "#BFDBFE" }]}>
                💰 Solde Théorique Attendu
              </Text>
              <Text style={[s.soldeBig, { color: "#FFFFFF" }]}>
                {formatCurrency(d.solde_theorique || 0)}
              </Text>
            </View>
          </>
        )}

        {/* ONGLET 2 : DÉCLARATION DU SOIR */}
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
              🌆 Inventaire de fermeture (Soir)
            </Text>
            {[
              "liquide_soir",
              "mm_mpesa_soir",
              "mm_orange_soir",
              "mm_airtel_soir",
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
                  value={(soirForm as any)[k]}
                  onChangeText={(v) => setSoirForm({ ...soirForm, [k]: v })}
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
                  <Text style={s.btnText}>💾 Enregistrer l'inventaire</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ONGLET 3 : DETTES CLIENTS */}
        {tab === "dettes" && (
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
              📋 Dettes Actives ({formatCurrency(totalDettes)})
            </Text>

            {!isCloture && (
              <View style={{ marginBottom: spacing.md }}>
                <View style={s.inputWrapper}>
                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: dynamicStyles.inputBg,
                        borderColor: dynamicStyles.inputBorder,
                        color: dynamicStyles.textMain,
                      },
                    ]}
                    placeholder="Nom du client"
                    placeholderTextColor="#64748B"
                    value={detteForm.client_nom}
                    onChangeText={(v) =>
                      setDetteForm({ ...detteForm, client_nom: v })
                    }
                  />
                </View>
                <View style={s.inputWrapper}>
                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: dynamicStyles.inputBg,
                        borderColor: dynamicStyles.inputBorder,
                        color: dynamicStyles.textMain,
                      },
                    ]}
                    placeholder="N° de Téléphone"
                    placeholderTextColor="#64748B"
                    value={detteForm.client_phone}
                    onChangeText={(v) =>
                      setDetteForm({ ...detteForm, client_phone: v })
                    }
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={s.inputWrapper}>
                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: dynamicStyles.inputBg,
                        borderColor: dynamicStyles.inputBorder,
                        color: dynamicStyles.textMain,
                      },
                    ]}
                    placeholder="Montant de la dette (FC)"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={detteForm.montant}
                    onChangeText={(v) =>
                      setDetteForm({ ...detteForm, montant: v })
                    }
                  />
                </View>
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: colors.primary }]}
                  onPress={() => detteCreateMutation.mutate()}
                  disabled={detteCreateMutation.isPending || !detteForm.montant}
                >
                  {detteCreateMutation.isPending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={s.btnText}>+ Ajouter la Dette</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {dettes.length === 0 ? (
              <Text style={[s.emptyText, { color: dynamicStyles.textSub }]}>
                Aucune ardoise ou dette en cours.
              </Text>
            ) : (
              dettes.map((dette: any) => (
                <View
                  key={dette.id}
                  style={[
                    s.detteRow,
                    { borderBottomColor: dynamicStyles.borderSeparator },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[s.detteName, { color: dynamicStyles.textMain }]}
                    >
                      {dette.client_nom}
                    </Text>
                    <Text
                      style={[s.detteInfo, { color: dynamicStyles.textSub }]}
                    >
                      Initial : {formatCurrency(dette.montant)} • Remboursé :{" "}
                      <Text style={{ color: "#10B981", fontWeight: "600" }}>
                        {formatCurrency(dette.montant_rembourse || 0)}
                      </Text>
                    </Text>
                  </View>

                  {dette.statut === "en_cours" && !isCloture && (
                    <View style={s.detteActions}>
                      {rembId === dette.id ? (
                        <View style={s.rembInputContainer}>
                          <TextInput
                            style={[
                              s.input,
                              {
                                width: 80,
                                marginBottom: 0,
                                paddingHorizontal: 8,
                                height: 38,
                                backgroundColor: dynamicStyles.inputBg,
                                borderColor: dynamicStyles.inputBorder,
                                color: dynamicStyles.textMain,
                              },
                            ]}
                            keyboardType="numeric"
                            value={rembMontant}
                            onChangeText={setRembMontant}
                            placeholder="Montant"
                            placeholderTextColor="#64748B"
                          />
                          <TouchableOpacity
                            style={s.actionActionBtn}
                            onPress={() => rembourserMutation.mutate()}
                            disabled={rembourserMutation.isPending}
                          >
                            <Text style={{ fontSize: 16 }}>✅</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={s.actionActionBtn}
                          onPress={() => {
                            setRembId(dette.id);
                            setRembMontant("");
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>💰</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={s.actionActionBtn}
                        onPress={() => annulerMutation.mutate(dette.id)}
                        disabled={annulerMutation.isPending}
                      >
                        <Text
                          style={{
                            color: "#EF4444",
                            fontSize: 18,
                            fontWeight: "bold",
                          }}
                        >
                          ✕
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ONGLET 4 : CLÔTURE DE SESSION */}
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
            <Text
              style={{
                color: dynamicStyles.textSub,
                fontSize: 13,
                marginBottom: spacing.md,
                lineHeight: 18,
              }}
            >
              Une fois la journée de caisse clôturée, plus aucun flux financier
              (entrées/sorties) ou encaissement de dette ne pourra être modifié.
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
                style={[s.btn, { backgroundColor: "#DC2626" }]}
                onPress={() => clotureMutation.mutate()}
                disabled={clotureMutation.isPending}
              >
                {clotureMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={s.btnText}>🔒 Exécuter la Clôture</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
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

  tabs: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#3B82F6" },
  tabText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#FFF" },

  msg: {
    color: "#10B981",
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
  cardTitle: { fontSize: 15, fontWeight: "800", marginBottom: spacing.sm },

  row2: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  row2Bold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    marginTop: 4,
  },
  lbl: { fontSize: 13 },
  val: { fontSize: 13, fontWeight: "600" },
  lblBold: { fontSize: 14, fontWeight: "700" },
  valBold: { fontSize: 14, fontWeight: "700" },
  soldeBig: { fontSize: 26, fontWeight: "800", marginTop: 4 },

  inputWrapper: { marginBottom: spacing.xs },
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
    fontSize: 14,
  },

  btn: {
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  btnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  detteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detteName: { fontSize: 14, fontWeight: "700" },
  detteInfo: { fontSize: 12, marginTop: 2 },
  detteActions: { flexDirection: "row", gap: 12, alignItems: "center" },
  rembInputContainer: { flexDirection: "row", alignItems: "center", gap: 6 },

  actionActionBtn: {
    minWidth: 32,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    padding: 16,
    fontSize: 13,
    fontStyle: "italic",
  },
});
  