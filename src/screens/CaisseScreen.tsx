// src/screens/CaisseScreen.tsx

import React, { useState } from "react";
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
import { caisseService, detteService } from "../api/client";
import { formatCurrency } from "../utils/format";
import { spacing } from "../theme";
import ScreenContainer from "../components/ScreenContainer";

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
  const [detteForm, setDetteForm] = useState({
    client_nom: "",
    client_phone: "",
    montant: "",
    commentaire: "",
  });
  const [rembId, setRembId] = useState<number | null>(null);
  const [rembMontant, setRembMontant] = useState("");

  // Styles dynamiques Dark Mode épuré
  const dynamicStyles = {
    cardBg: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#0F172A" : "#F8FAFC",
    inputBorder: isDark ? "#334155" : "#E2E8F0",
    tabUnselected: isDark ? "#334155" : "#E2E8F0",
    borderSeparator: isDark ? "#334155" : "#E2E8F0",
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dettes"] }),
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
    (s: number, item: any) =>
      s + (item.montant - (item.montant_rembourse || 0)),
    0,
  );

  // Mappage des clés techniques vers des labels UI propres
  const getSoirLabel = (key: string) => {
    switch (key) {
      case "liquide_soir":
        return "💵 Liquide Soir";
      case "mm_mpesa_soir":
        return "📱 M-Pesa Soir";
      case "mm_orange_soir":
        return "📱 Orange Money Soir";
      case "mm_airtel_soir":
        return "📱 Airtel Money Soir";
      default:
        return key;
    }
  };

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#3B82F6"
        />
      }
      headerComponent={
        <>
          <Text style={s.title}>💵 Caisse</Text>
          <Text
            style={[s.subtitle, { color: isCloture ? "#EF4444" : "#10B981" }]}
          >
            {isCloture ? "🔒 Clôturée" : "🟢 Ouverte"}
          </Text>
        </>
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
                    : "🔒 Clôture"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {message ? <Text style={s.msg}>{message}</Text> : null}

      {/* 📊 RÉSUMÉ */}
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
              🔓 Ouverture
            </Text>
            <Row
              label="Liquide"
              value={formatCurrency(d.ouverture?.liquide || 0)}
              dynamicStyles={dynamicStyles}
            />
            <Row
              label="Mobile Money"
              value={formatCurrency(d.ouverture?.mm || 0)}
              dynamicStyles={dynamicStyles}
            />
            <RowBold
              label="Total"
              value={formatCurrency(d.ouverture?.total || 0)}
              dynamicStyles={dynamicStyles}
            />
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
            <Text style={[s.cardTitle, { color: "#10B981" }]}>📥 Entrées</Text>
            <Row
              label="Ventes crédits"
              value={`+${formatCurrency(d.entrees?.ventes_credits || 0)}`}
              color="#10B981"
              dynamicStyles={dynamicStyles}
            />
            <Row
              label="Ventes articles"
              value={`+${formatCurrency(d.entrees?.ventes_articles || 0)}`}
              color="#10B981"
              dynamicStyles={dynamicStyles}
            />
            <Row
              label="Dépôts MM"
              value={`+${formatCurrency(d.entrees?.depots_mm || 0)}`}
              color="#10B981"
              dynamicStyles={dynamicStyles}
            />
            <RowBold
              label="Total"
              value={`+${formatCurrency(d.entrees?.total || 0)}`}
              color="#10B981"
              dynamicStyles={dynamicStyles}
            />
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
            <Text style={[s.cardTitle, { color: "#EF4444" }]}>📤 Sorties</Text>
            <Row
              label="Achats stock"
              value={`-${formatCurrency(d.sorties?.achats_stock || 0)}`}
              color="#EF4444"
              dynamicStyles={dynamicStyles}
            />
            <Row
              label="Achats articles"
              value={`-${formatCurrency(d.sorties?.achats_articles || 0)}`}
              color="#EF4444"
              dynamicStyles={dynamicStyles}
            />
            <Row
              label="Retraits MM"
              value={`-${formatCurrency(d.sorties?.retraits_mm || 0)}`}
              color="#EF4444"
              dynamicStyles={dynamicStyles}
            />
            <Row
              label="Dépenses"
              value={`-${formatCurrency(d.sorties?.total_depenses || 0)}`}
              color="#EF4444"
              dynamicStyles={dynamicStyles}
            />
            <RowBold
              label="Total"
              value={`-${formatCurrency(d.sorties?.total || 0)}`}
              color="#EF4444"
              dynamicStyles={dynamicStyles}
            />
          </View>

          <View
            style={[
              s.card,
              { backgroundColor: "#1E3A8A", borderColor: "#1E3A8A" },
            ]}
          >
            <Text style={[s.cardTitle, { color: "#BFDBFE" }]}>
              💰 Solde théorique
            </Text>
            <Text style={s.soldeBig}>
              {formatCurrency(d.solde_theorique || 0)}
            </Text>
          </View>
        </>
      )}

      {/* 🌆 DECLARATION DU SOIR */}
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
          {(
            [
              "liquide_soir",
              "mm_mpesa_soir",
              "mm_orange_soir",
              "mm_airtel_soir",
            ] as const
          ).map((k) => (
            <View key={k} style={s.inputWrap}>
              <Text style={[s.inputLabel, { color: dynamicStyles.textSub }]}>
                {getSoirLabel(k)}
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
                placeholderTextColor={dynamicStyles.textSub}
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
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.btnText}>💾 Enregistrer</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 📋 DETTES */}
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
            📋 Suivi des Dettes ({formatCurrency(totalDettes)})
          </Text>
          {!isCloture && (
            <View style={{ marginBottom: spacing.md }}>
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
                placeholderTextColor={dynamicStyles.textSub}
                value={detteForm.client_nom}
                onChangeText={(v) =>
                  setDetteForm({ ...detteForm, client_nom: v })
                }
              />
              <TextInput
                style={[
                  s.input,
                  {
                    backgroundColor: dynamicStyles.inputBg,
                    borderColor: dynamicStyles.inputBorder,
                    color: dynamicStyles.textMain,
                  },
                ]}
                placeholder="Téléphone"
                placeholderTextColor={dynamicStyles.textSub}
                value={detteForm.client_phone}
                onChangeText={(v) =>
                  setDetteForm({ ...detteForm, client_phone: v })
                }
                keyboardType="phone-pad"
              />
              <TextInput
                style={[
                  s.input,
                  {
                    backgroundColor: dynamicStyles.inputBg,
                    borderColor: dynamicStyles.inputBorder,
                    color: dynamicStyles.textMain,
                  },
                ]}
                placeholder="Montant (FC)"
                placeholderTextColor={dynamicStyles.textSub}
                keyboardType="numeric"
                value={detteForm.montant}
                onChangeText={(v) => setDetteForm({ ...detteForm, montant: v })}
              />
              <TouchableOpacity
                style={s.btn}
                onPress={() => detteCreateMutation.mutate()}
                disabled={detteCreateMutation.isPending || !detteForm.montant}
              >
                {detteCreateMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.btnText}>+ Ajouter la dette</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {dettes.length === 0 ? (
            <Text style={[s.empty, { color: dynamicStyles.textSub }]}>
              Aucune dette enregistrée
            </Text>
          ) : (
            dettes.map((dette: any) => (
              <View
                key={dette.id}
                style={[
                  s.detteRow,
                  { borderColor: dynamicStyles.borderSeparator },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[s.detteName, { color: dynamicStyles.textMain }]}
                  >
                    {dette.client_nom}
                  </Text>
                  <Text style={[s.detteInfo, { color: dynamicStyles.textSub }]}>
                    {formatCurrency(dette.montant)} • Remboursé{" "}
                    {formatCurrency(dette.montant_rembourse || 0)}
                  </Text>
                </View>
                {dette.statut === "en_cours" && !isCloture && (
                  <View style={s.detteActions}>
                    {rembId === dette.id ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <TextInput
                          style={[
                            s.input,
                            {
                              backgroundColor: dynamicStyles.inputBg,
                              borderColor: dynamicStyles.inputBorder,
                              color: dynamicStyles.textMain,
                              width: 80,
                              marginBottom: 0,
                              padding: 8,
                              height: 38,
                            },
                          ]}
                          keyboardType="numeric"
                          value={rembMontant}
                          onChangeText={setRembMontant}
                          placeholder="FC"
                          placeholderTextColor={dynamicStyles.textSub}
                        />
                        <TouchableOpacity
                          onPress={() => rembourserMutation.mutate()}
                        >
                          <Text style={{ fontSize: 18 }}>✅</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setRembId(dette.id);
                          setRembMontant("");
                        }}
                        style={s.actionBtn}
                      >
                        <Text style={{ fontSize: 16 }}>💰</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => annulerMutation.mutate(dette.id)}
                      style={s.actionBtn}
                    >
                      <Text
                        style={{
                          color: "#EF4444",
                          fontSize: 16,
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

      {/* 🔒 CLÔTURE */}
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
            🔒 Clôture de journée
          </Text>
          <Text style={[s.clotureText, { color: dynamicStyles.textSub }]}>
            Une fois la journée clôturée, plus aucune modification sur les
            ventes, les stocks ou la caisse ne sera autorisée.
          </Text>
          {isCloture ? (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: "#F59E0B" }]}
              onPress={() => rouvrirMutation.mutate()}
              disabled={rouvrirMutation.isPending}
            >
              {rouvrirMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.btnText}>🔓 Rouvrir la journée</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: "#EF4444" }]}
              onPress={() => clotureMutation.mutate()}
              disabled={clotureMutation.isPending}
            >
              {clotureMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.btnText}>🔒 Clôturer la journée</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

// Composants de ligne internes typés
interface RowProps {
  label: string;
  value: string;
  color?: string;
  dynamicStyles: any;
}

function Row({ label, value, color, dynamicStyles }: RowProps) {
  return (
    <View style={s.row}>
      <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>{label}</Text>
      <Text style={[s.val, { color: color || dynamicStyles.textMain }]}>
        {value}
      </Text>
    </View>
  );
}

function RowBold({ label, value, color, dynamicStyles }: RowProps) {
  return (
    <View style={[s.rowBold, { borderColor: dynamicStyles.borderSeparator }]}>
      <Text style={[s.lblBold, { color: dynamicStyles.textMain }]}>
        {label}
      </Text>
      <Text style={[s.valBold, { color: color || dynamicStyles.textMain }]}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  subtitle: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  tabs: { flexDirection: "row", gap: 4, marginBottom: spacing.md },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#3B82F6" },
  tabText: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },
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

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  rowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderTopWidth: 1,
    marginTop: 4,
  },
  lbl: { fontSize: 13 },
  val: { fontSize: 13, fontWeight: "600" },
  lblBold: { fontSize: 14, fontWeight: "700" },
  valBold: { fontSize: 14, fontWeight: "700" },
  soldeBig: { fontSize: 28, fontWeight: "800", color: "#FFF", marginTop: 4 },

  inputWrap: { marginBottom: spacing.sm },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    marginBottom: spacing.xs,
  },

  btn: {
    backgroundColor: "#3B82F6",
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
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detteName: { fontSize: 14, fontWeight: "700" },
  detteInfo: { fontSize: 12, marginTop: 2 },
  detteActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  actionBtn: {
    minWidth: 32,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { textAlign: "center", padding: 20, fontSize: 13 },
  clotureText: { fontSize: 13, marginBottom: spacing.md, lineHeight: 18 },
});
