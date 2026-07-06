// src/screens/ObjectifsScreen.tsx

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
import { objectifService, settingsService } from "../api/client";
import { formatCurrency } from "../utils/format";
import { colors, spacing } from "../theme";
import ScreenContainer from "../components/ScreenContainer";

export default function ObjectifsScreen() {
  const queryClient = useQueryClient();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const [form, setForm] = useState({ date: "", libelle: "", montant: "" });
  const [editingObjectif, setEditingObjectif] = useState(false);
  const [newObjectif, setNewObjectif] = useState("");

  // Styles thématiques dynamiques
  const dynamicStyles = {
    cardBg: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    inputBg: isDark ? "#0F172A" : "#F8FAFC",
    inputBorder: isDark ? "#334155" : "#E2E8F0",
    blockExpandedBg: isDark ? "#0F172A" : "#F8FAFC",
    borderSeparator: isDark ? "#334155" : "#E2E8F0",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["objectifs"],
    queryFn: () => objectifService.getSemaine().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      objectifService.updateJour(editId!, {
        benefice_credits: parseInt(editVal) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectifs"] });
      setEditId(null);
    },
  });

  const addMutation = useMutation({
    mutationFn: () =>
      objectifService.addRevenu({
        ...form,
        montant: parseInt(form.montant) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectifs"] });
      setForm({ date: "", libelle: "", montant: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => objectifService.deleteRevenu(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["objectifs"] }),
  });

  const updateObjectifMutation = useMutation({
    mutationFn: () =>
      settingsService.update({
        objectif_hebdomadaire: parseInt(newObjectif) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectifs"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setEditingObjectif(false);
    },
  });

  const obj = data?.data || {};
  const jours = obj.jours || [];
  const progression = Math.min(obj.progression || 0, 100);
  const depasse = (obj.progression || 0) > 100;

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#3B82F6"
        />
      }
      headerComponent={<Text style={s.title}>🎯 Objectifs</Text>}
    >
      {/* Numéro de la semaine */}
      <Text style={[s.semaine, { color: dynamicStyles.textSub }]}>
        Semaine {obj.semaine}
      </Text>

      {/* Carte Objectif Hebdomadaire (Modifiable) */}
      <TouchableOpacity
        style={s.objectifCard}
        onPress={() => {
          setEditingObjectif(true);
          setNewObjectif(String(obj.objectif_hebdomadaire || ""));
        }}
        activeOpacity={0.8}
      >
        {editingObjectif ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              style={s.objectifInput}
              keyboardType="numeric"
              value={newObjectif}
              onChangeText={setNewObjectif}
              placeholder="Objectif FC"
              placeholderTextColor="#94A3B8"
              autoFocus
            />
            <TouchableOpacity
              onPress={() => updateObjectifMutation.mutate()}
              disabled={updateObjectifMutation.isPending}
            >
              {updateObjectifMutation.isPending ? (
                <ActivityIndicator color="#1E3A8A" size="small" />
              ) : (
                <Text style={{ fontSize: 20 }}>✅</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingObjectif(false)}>
              <Text style={{ color: "#FCA5A5", fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={s.objectifValue}>
              {formatCurrency(obj.objectif_hebdomadaire || 0)}
            </Text>
            <Text style={{ color: "#93C5FD", fontSize: 14 }}>✏️</Text>
          </View>
        )}
        <Text style={s.objectifLabel}>
          Objectif hebdomadaire (Toucher pour modifier)
        </Text>
      </TouchableOpacity>

      {/* Grille de Statistiques Courantes */}
      <View style={s.statsRow}>
        <View
          style={[
            s.statBlock,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.inputBorder,
            },
          ]}
        >
          <Text style={[s.statLabel, { color: dynamicStyles.textSub }]}>
            Réalisé
          </Text>
          <Text style={[s.statValue, { color: "#10B981" }]}>
            {formatCurrency(obj.total_general || 0)}
          </Text>
        </View>
        <View
          style={[
            s.statBlock,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.inputBorder,
            },
          ]}
        >
          <Text style={[s.statLabel, { color: dynamicStyles.textSub }]}>
            Reste
          </Text>
          <Text
            style={[s.statValue, { color: depasse ? "#10B981" : "#F59E0B" }]}
          >
            {depasse ? "Dépassé !" : formatCurrency(obj.reste || 0)}
          </Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <View
          style={[
            s.statBlock,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.inputBorder,
            },
          ]}
        >
          <Text style={[s.statLabel, { color: dynamicStyles.textSub }]}>
            Progression
          </Text>
          <Text style={[s.statValue, { color: "#3B82F6" }]}>
            {progression}%
          </Text>
        </View>
        <View
          style={[
            s.statBlock,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.inputBorder,
            },
          ]}
        >
          <Text style={[s.statLabel, { color: dynamicStyles.textSub }]}>
            Crédits + Autres
          </Text>
          <Text
            style={[
              s.statValue,
              { color: dynamicStyles.textMain, fontSize: 13, marginTop: 6 },
            ]}
          >
            {formatCurrency(obj.total_credits || 0)} +{" "}
            {formatCurrency(obj.total_autres || 0)}
          </Text>
        </View>
      </View>

      {/* Barre de Progression Visuelle */}
      <View
        style={[
          s.progressBar,
          { backgroundColor: isDark ? "#334155" : "#E2E8F0" },
        ]}
      >
        <View
          style={[
            s.progressFill,
            {
              width: `${Math.min(progression, 100)}%`,
              backgroundColor: depasse ? "#10B981" : "#3B82F6",
            },
          ]}
        />
      </View>

      {depasse && (
        <Text style={s.depasseBadge}>
          🚀 Objectif dépassé de {(obj.progression - 100).toFixed(1)}%
        </Text>
      )}

      {/* Liste des jours de la semaine */}
      {jours.map((jour: any) => (
        <View
          key={jour.date}
          style={[
            s.dayCard,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.inputBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={s.dayHeader}
            onPress={() =>
              setExpanded(expanded === jour.date ? null : jour.date)
            }
            activeOpacity={0.7}
          >
            <View>
              <Text style={[s.dayName, { color: dynamicStyles.textMain }]}>
                {jour.jour}
              </Text>
              <Text style={[s.dayDate, { color: dynamicStyles.textSub }]}>
                {jour.date}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.dayTotal}>
                {jour.total_jour > 0 ? formatCurrency(jour.total_jour) : "—"}
              </Text>
              {jour.modifie_manuellement && (
                <Text
                  style={{ fontSize: 10, color: "#F59E0B", fontWeight: "600" }}
                >
                  modifié
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Section dépliée (Revenus & Ajustements du Jour) */}
          {expanded === jour.date && (
            <View
              style={[
                s.dayDetails,
                {
                  backgroundColor: dynamicStyles.blockExpandedBg,
                  borderTopColor: dynamicStyles.borderSeparator,
                },
              ]}
            >
              <View style={s.detailRow}>
                <Text style={[s.detailLabel, { color: dynamicStyles.textSub }]}>
                  Bénéfice crédits
                </Text>
                {editId === jour.id ? (
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
                          backgroundColor: dynamicStyles.cardBg,
                          borderColor: dynamicStyles.inputBorder,
                          color: dynamicStyles.textMain,
                          width: 100,
                          marginBottom: 0,
                          padding: 6,
                          height: 36,
                        },
                      ]}
                      keyboardType="numeric"
                      value={editVal}
                      onChangeText={setEditVal}
                      autoFocus
                    />
                    <TouchableOpacity onPress={() => updateMutation.mutate()}>
                      <Text style={{ fontSize: 16 }}>✅</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditId(null)}>
                      <Text style={{ fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setEditId(jour.id);
                      setEditVal(String(jour.benefice_credits));
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text
                      style={[s.detailValue, { color: dynamicStyles.textMain }]}
                    >
                      {formatCurrency(jour.benefice_credits)}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: dynamicStyles.textSub }}
                    >
                      ✏️
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Liste des autres revenus spécifiques */}
              {jour.autres_revenus?.map((r: any) => (
                <View key={r.id} style={s.detailRow}>
                  <Text
                    style={[s.detailLabel, { color: dynamicStyles.textSub }]}
                  >
                    {r.libelle}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={[s.detailValue, { color: "#10B981" }]}>
                      +{formatCurrency(r.montant)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteMutation.mutate(r.id)}
                      style={{ padding: 4 }}
                    >
                      <Text style={{ color: "#EF4444", fontWeight: "700" }}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Lien pour déplier le formulaire d'ajout */}
              <TouchableOpacity
                onPress={() => setForm({ ...form, date: jour.date })}
                style={{ marginTop: 8 }}
              >
                <Text
                  style={{ color: "#3B82F6", fontSize: 12, fontWeight: "700" }}
                >
                  + Ajouter un autre revenu
                </Text>
              </TouchableOpacity>

              {form.date === jour.date && (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    marginTop: 10,
                    alignItems: "center",
                  }}
                >
                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: dynamicStyles.cardBg,
                        borderColor: dynamicStyles.inputBorder,
                        color: dynamicStyles.textMain,
                        flex: 1,
                        marginBottom: 0,
                        padding: 8,
                        height: 38,
                      },
                    ]}
                    placeholder="Libellé (ex: Vente carte)"
                    placeholderTextColor={dynamicStyles.textSub}
                    value={form.libelle}
                    onChangeText={(v) => setForm({ ...form, libelle: v })}
                  />
                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: dynamicStyles.cardBg,
                        borderColor: dynamicStyles.inputBorder,
                        color: dynamicStyles.textMain,
                        width: 80,
                        marginBottom: 0,
                        padding: 8,
                        height: 38,
                      },
                    ]}
                    placeholder="FC"
                    placeholderTextColor={dynamicStyles.textSub}
                    keyboardType="numeric"
                    value={form.montant}
                    onChangeText={(v) => setForm({ ...form, montant: v })}
                  />
                  <TouchableOpacity
                    onPress={() => addMutation.mutate()}
                    style={{ padding: 4 }}
                  >
                    <Text style={{ fontSize: 18 }}>✅</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      ))}
      <View style={{ height: 30 }} />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  semaine: { fontSize: 12, marginBottom: spacing.md, fontWeight: "600" },

  objectifCard: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  objectifLabel: {
    color: "#93C5FD",
    fontSize: 11,
    marginTop: 6,
    fontWeight: "600",
  },
  objectifValue: { color: "#FFF", fontSize: 28, fontWeight: "800" },
  objectifInput: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    width: 160,
    textAlign: "center",
  },

  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  statBlock: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statValue: { fontSize: 17, fontWeight: "800", marginTop: 4 },

  progressBar: { height: 8, borderRadius: 4, marginBottom: spacing.sm },
  progressFill: { height: 8, borderRadius: 4 },
  depasseBadge: {
    color: "#10B981",
    fontSize: 12,
    textAlign: "center",
    marginBottom: spacing.sm,
    fontWeight: "700",
  },

  dayCard: {
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  dayName: { fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
  dayDate: { fontSize: 11, marginTop: 2 },
  dayTotal: { fontSize: 14, fontWeight: "700", color: "#3B82F6" },

  dayDetails: { padding: spacing.md, borderTopWidth: 1 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, fontSize: 13 },
});
