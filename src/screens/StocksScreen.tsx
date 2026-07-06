// src/screens/StocksScreen.tsx

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
import { stockService, api } from "../api/client";
import { formatCurrency } from "../utils/format";
import { colors, spacing } from "../theme";
import ScreenContainer from "../components/ScreenContainer";

export default function StocksScreen() {
  const queryClient = useQueryClient();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const [tab, setTab] = useState<"matin" | "vente" | "achat" | "soir">("matin");
  const [reseauId, setReseauId] = useState<number | null>(null);
  const [montant, setMontant] = useState("");
  const [stocks, setStocks] = useState<Record<number, string>>({});
  const [achatMontant, setAchatMontant] = useState("");
  const [achatReseauId, setAchatReseauId] = useState<number | null>(null);
  const [soirStocks, setSoirStocks] = useState<Record<number, string>>({});

  // Palette Thématique pour l'esthétique PyCharm / Inter
  const dynamicStyles = {
    cardBg: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#0F172A" : "#F8FAFC",
    inputBorder: isDark ? "#334155" : "#E2E8F0",
    tabUnselected: isDark ? "#334155" : "#E2E8F0",
    borderSeparator: isDark ? "#334155" : "#E2E8F0",
    chipBg: isDark ? "#334155" : "#E2E8F0",
    chipText: isDark ? "#CBD5E1" : "#64748B",
    boxVenteBg: isDark ? "#1E3A8A" : "#DBEAFE",
    boxVenteText: isDark ? "#93C5FD" : "#1E40AF",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stockService.getAll().then((r) => r.data),
  });

  const { data: tauxData } = useQuery({
    queryKey: ["taux-actif"],
    queryFn: () => api.get("/taux/actif").then((r) => r.data),
  });

  const reseaux = data?.reseaux || [];
  const stocksData = data?.stocks || [];
  const taux = tauxData?.taux || {};
  const prixVente = stocksData[0]?.prix_vente_unitaire || 28;

  if (reseaux.length > 0 && reseauId === null) setReseauId(reseaux[0].id);
  if (reseaux.length > 0 && achatReseauId === null)
    setAchatReseauId(reseaux[0].id);

  const unitesEquivalentes =
    montant && prixVente ? Math.floor(parseInt(montant) / prixVente) : 0;
  const unitesEstimees =
    achatMontant && taux.taux_achat_fc && taux.unites_par_10usd
      ? Math.floor(
          (parseInt(achatMontant) / taux.taux_achat_fc) * taux.unites_par_10usd,
        )
      : 0;

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
        reseau_id: reseauId!,
        montant_encaisse: parseInt(montant),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-resume"] });
      setMontant("");
    },
    onError: (err: any) => alert(err.response?.data?.message || "Erreur vente"),
  });

  const achatMutation = useMutation({
    mutationFn: () =>
      api.post("/achats-stock", {
        reseau_id: achatReseauId,
        montant_fc: parseInt(achatMontant),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-resume"] });
      setAchatMontant("");
    },
    onError: (err: any) => alert(err.response?.data?.message || "Erreur achat"),
  });

  const soirMutation = useMutation({
    mutationFn: () =>
      stockService.setSoir(
        Object.entries(soirStocks).map(([id, v]) => ({
          reseau_id: parseInt(id),
          stock_soir: parseInt(v) || 0,
        })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-resume"] });
      setSoirStocks({});
    },
  });

  // Calculs Soir Explicites
  const getTotalDispo = (sData: any) =>
    sData.stock_matin + (sData.achats_jour || 0);

  const getVendues = (sData: any) => {
    const restant = soirStocks[sData.id]
      ? parseInt(soirStocks[sData.id])
      : null;
    return restant !== null ? getTotalDispo(sData) - restant : 0;
  };

  const getVentesTheoriques = (sData: any) => getVendues(sData) * prixVente;

  const totalVentesTheoriques = stocksData.reduce(
    (sum: number, s: any) => sum + getVentesTheoriques(s),
    0,
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
      headerComponent={<Text style={s.title}>📦 Gestion des Stocks</Text>}
    >
      {/* Navigation par Onglets Épurés */}
      <View style={s.tabs}>
        {(["matin", "vente", "achat", "soir"] as const).map((t) => (
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
              {t === "matin"
                ? "🌅 Matin"
                : t === "vente"
                  ? "💳 Vente"
                  : t === "achat"
                    ? "📦 Achat"
                    : "🌆 Soir"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🌅 MATIN */}
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
            🌅 Déclarer le stock du matin
          </Text>
          {reseaux.map((r: any) => (
            <View key={r.id} style={s.inputRow}>
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
                    width: 140,
                    marginBottom: 0,
                  },
                ]}
                keyboardType="numeric"
                placeholder="0 unités"
                placeholderTextColor={dynamicStyles.textSub}
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
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.btnText}>💾 Enregistrer le matin</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 💳 VENTE */}
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
            💳 Simulateur de vente
          </Text>
          <Text style={[s.subLabel, { color: dynamicStyles.textSub }]}>
            Calculez combien d'unités pour un montant donné :
          </Text>

          <Text style={[s.inputLabel, { color: dynamicStyles.textMain }]}>
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
            keyboardType="numeric"
            placeholder="Ex: 1000 FC"
            placeholderTextColor={dynamicStyles.textSub}
            value={montant}
            onChangeText={setMontant}
          />

          {unitesEquivalentes > 0 && (
            <View
              style={[s.infoBox, { backgroundColor: dynamicStyles.boxVenteBg }]}
            >
              <Text style={[s.infoText, { color: dynamicStyles.boxVenteText }]}>
                📊{" "}
                <Text style={{ fontWeight: "700" }}>
                  {unitesEquivalentes} unités
                </Text>{" "}
                (à {prixVente} FC/unité)
              </Text>
              <Text
                style={[
                  s.infoText,
                  {
                    color: dynamicStyles.boxVenteText,
                    fontSize: 11,
                    marginTop: 4,
                  },
                ]}
              >
                Pour {formatCurrency(parseInt(montant))}, le client reçoit{" "}
                <Text style={{ fontWeight: "700" }}>
                  {unitesEquivalentes} unités
                </Text>
              </Text>
            </View>
          )}

          <View
            style={[
              s.infoBox,
              {
                backgroundColor: isDark ? "#78350F" : "#FEF3C7",
                marginTop: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                s.infoText,
                {
                  color: isDark ? "#FCD34D" : "#92400E",
                  fontSize: 12,
                  textAlign: "left",
                },
              ]}
            >
              💡 Les ventes réelles se font par code USSD. Le stock sera ajusté
              lors de la déclaration du soir.
            </Text>
          </View>
        </View>
      )}

      {/* 📦 ACHAT */}
      {tab === "achat" && (
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
            📦 Achat d'unités
          </Text>
          <View style={s.chips}>
            {reseaux.map((r: any) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  s.chip,
                  { backgroundColor: dynamicStyles.chipBg },
                  achatReseauId === r.id && s.chipActive,
                ]}
                onPress={() => setAchatReseauId(r.id)}
              >
                <Text
                  style={[
                    s.chipText,
                    { color: dynamicStyles.chipText },
                    achatReseauId === r.id && s.chipTextActive,
                  ]}
                >
                  {r.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {taux.taux_achat_fc ? (
            <View
              style={[
                s.infoBox,
                { backgroundColor: isDark ? "#78350F" : "#FEF3C7" },
              ]}
            >
              <Text
                style={[s.infoText, { color: isDark ? "#FCD34D" : "#92400E" }]}
              >
                💱 Taux : {formatCurrency(taux.taux_achat_fc)} ={" "}
                {taux.unites_par_10usd} unités
              </Text>
            </View>
          ) : (
            <Text style={{ color: "#EF4444", fontSize: 12, marginBottom: 8 }}>
              ⚠️ Aucun taux configuré
            </Text>
          )}

          <Text style={[s.inputLabel, { color: dynamicStyles.textMain }]}>
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
            keyboardType="numeric"
            placeholder="Ex: 23500 FC"
            placeholderTextColor={dynamicStyles.textSub}
            value={achatMontant}
            onChangeText={setAchatMontant}
          />

          {unitesEstimees > 0 && (
            <View
              style={[s.infoBox, { backgroundColor: dynamicStyles.boxVenteBg }]}
            >
              <Text style={[s.infoText, { color: dynamicStyles.boxVenteText }]}>
                📊{" "}
                <Text style={{ fontWeight: "700" }}>
                  {unitesEstimees} unités
                </Text>{" "}
                estimées
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.btn, { backgroundColor: "#F59E0B" }]}
            onPress={() => achatMutation.mutate()}
            disabled={
              achatMutation.isPending || !achatMontant || !achatReseauId
            }
          >
            {achatMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.btnText}>📦 Acheter des unités</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 🌆 SOIR AVEC BLOC TICKET EXPLICITE */}
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
            🌆 Déclaration du stock soir
          </Text>
          <Text style={[s.subLabel, { color: dynamicStyles.textSub }]}>
            Saisissez le restant par réseau :
          </Text>

          {stocksData.length === 0 ? (
            <Text style={[s.emptyText, { color: dynamicStyles.textSub }]}>
              Aucun stock déclaré ce matin.
            </Text>
          ) : (
            stocksData.map((sData: any) => {
              const totalDispo = getTotalDispo(sData);
              const restantSaisi = soirStocks[sData.id]
                ? parseInt(soirStocks[sData.id])
                : null;
              const vendues = getVendues(sData);
              const ventesTheo = getVentesTheoriques(sData);

              return (
                <View
                  key={sData.id}
                  style={[
                    s.soirBlock,
                    { borderColor: dynamicStyles.borderSeparator },
                  ]}
                >
                  <View style={s.soirHeader}>
                    <Text
                      style={[s.soirReseau, { color: dynamicStyles.textMain }]}
                    >
                      📍 {sData.reseau?.nom || "Réseau"}
                    </Text>
                    <Text
                      style={[s.soirDispo, { color: dynamicStyles.textSub }]}
                    >
                      Disponible :{" "}
                      <Text
                        style={{
                          fontWeight: "700",
                          color: dynamicStyles.textMain,
                        }}
                      >
                        {totalDispo} U
                      </Text>
                      {sData.achats_jour > 0 && (
                        <Text style={{ color: "#10B981", fontSize: 11 }}>
                          {" "}
                          (+{sData.achats_jour} achetés)
                        </Text>
                      )}
                    </Text>
                  </View>

                  <View style={s.inputRow}>
                    <Text
                      style={[s.inputLabel, { color: dynamicStyles.textMain }]}
                    >
                      Restant soir :
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <TextInput
                        style={[
                          s.input,
                          {
                            backgroundColor: dynamicStyles.inputBg,
                            borderColor: dynamicStyles.inputBorder,
                            color: dynamicStyles.textMain,
                            width: 120,
                            marginBottom: 0,
                            textAlign: "center",
                          },
                        ]}
                        keyboardType="numeric"
                        placeholder="Saisir unités"
                        placeholderTextColor={dynamicStyles.textSub}
                        value={soirStocks[sData.id] || ""}
                        onChangeText={(v) =>
                          setSoirStocks({ ...soirStocks, [sData.id]: v })
                        }
                      />
                      <Text
                        style={{
                          color: dynamicStyles.textSub,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        unités
                      </Text>
                    </View>
                  </View>

                  {restantSaisi !== null && restantSaisi >= 0 && (
                    <View
                      style={[
                        s.ticketBox,
                        {
                          backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                          borderColor: dynamicStyles.borderSeparator,
                        },
                      ]}
                    >
                      <View style={s.ticketRow}>
                        <Text
                          style={[
                            s.ticketLbl,
                            { color: dynamicStyles.textSub },
                          ]}
                        >
                          Unités vendues :
                        </Text>
                        <Text
                          style={[
                            s.ticketVal,
                            { color: dynamicStyles.textMain },
                          ]}
                        >
                          {vendues} U
                        </Text>
                      </View>
                      <View style={s.ticketRow}>
                        <Text
                          style={[
                            s.ticketLbl,
                            { color: dynamicStyles.textSub },
                          ]}
                        >
                          Ventes théoriques :
                        </Text>
                        <Text
                          style={[
                            s.ticketVal,
                            { color: "#10B981", fontWeight: "800" },
                          ]}
                        >
                          {formatCurrency(ventesTheo)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          s.ticketFormula,
                          { color: dynamicStyles.textSub },
                        ]}
                      >
                        ({totalDispo} - {restantSaisi}) × {prixVente} ={" "}
                        {formatCurrency(ventesTheo)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Total théorique global */}
          {Object.keys(soirStocks).length > 0 && totalVentesTheoriques > 0 && (
            <View style={s.totalTheoBox}>
              <Text style={s.totalTheoLabel}>💰 Ventes théoriques totales</Text>
              <Text style={s.totalTheoValue}>
                {formatCurrency(totalVentesTheoriques)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={s.btn}
            onPress={() => soirMutation.mutate()}
            disabled={
              soirMutation.isPending || Object.keys(soirStocks).length === 0
            }
          >
            {soirMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.btnText}>💾 Enregistrer le soir</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 📊 SITUATION ACTUELLE */}
      <Text style={[s.sectionTitle, { color: isDark ? "#94A3B8" : "#1E293B" }]}>
        📊 SITUATION ACTUELLE DES STOCKS
      </Text>
      {stocksData.map((sData: any) => {
        const pct =
          sData.stock_matin > 0
            ? Math.round(
                ((sData.stock_soir ?? sData.stock_matin) / sData.stock_matin) *
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
                {sData.reseau?.nom}
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
                { backgroundColor: isDark ? "#334155" : "#E2E8F0" },
              ]}
            >
              <View
                style={[
                  s.barFill,
                  {
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor:
                      pct <= 20 ? "#EF4444" : pct <= 50 ? "#F59E0B" : "#10B981",
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  tabs: { flexDirection: "row", gap: 4, marginBottom: spacing.md },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#334155",
  },
  tabActive: { backgroundColor: "#3B82F6" },
  tabText: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },
  tabTextActive: { color: "#FFF" },

  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", marginBottom: spacing.sm },
  subLabel: { fontSize: 12, marginBottom: spacing.sm },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  inputLabel: { fontSize: 13, fontWeight: "600", flex: 1 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
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

  chips: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.md,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#3B82F6" },
  chipText: { fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#FFF" },

  infoBox: { borderRadius: 10, padding: spacing.sm, marginBottom: spacing.sm },
  infoText: { fontSize: 13, textAlign: "center" },

  // Styles Soir & Ticket
  soirBlock: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
  },
  soirHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  soirReseau: { fontSize: 14, fontWeight: "700" },
  soirDispo: { fontSize: 12 },

  ticketBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: spacing.sm,
    borderStyle: "dashed",
    gap: 4,
  },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketLbl: { fontSize: 13 },
  ticketVal: { fontSize: 14, fontWeight: "600" },
  ticketFormula: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },

  totalTheoBox: {
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  totalTheoLabel: { color: "#BFDBFE", fontSize: 12 },
  totalTheoValue: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  stockCard: {
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  stockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stockName: { fontSize: 13, fontWeight: "700" },
  stockVal: { fontSize: 12 },
  emptyText: { textAlign: "center", fontSize: 13, marginVertical: spacing.md },
  bar: { height: 6, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
});
