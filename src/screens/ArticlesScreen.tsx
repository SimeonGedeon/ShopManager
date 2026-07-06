// src/screens/ArticlesScreen.tsx

import React, { useState, useEffect } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { articleService, caisseService } from "../api/client";
import { formatCurrency } from "../utils/format";
import { colors, spacing } from "../theme";

interface Article {
  id: number;
  designation: string;
  prix_achat: number;
  prix_unitaire: number;
  nombre_pieces: number;
  restant_soir: number | null;
  benefice: number;
}

const SAFE_TOP_SPACE =
  Platform.OS === "ios" ? 44 : RNStatusBar.currentHeight || 0;

export default function ArticlesScreen() {
  const queryClient = useQueryClient();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    designation: "",
    prix_achat: "",
    prix_unitaire: "",
    nombre_pieces: "",
  });
  const [editSoir, setEditSoir] = useState<number | null>(null);
  const [restant, setRestant] = useState("");
  const [message, setMessage] = useState("");

  // Nettoyage automatique du message de succès
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const dynamicStyles = {
    mainBg: isDark ? "#0F172A" : "#1E3A8A",
    contentBg: isDark ? "#1E293B" : "#F1F5F9",
    cardBg: isDark ? "#334155" : "#FFFFFF",
    textMain: isDark ? "#F8FAFC" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    cardBorder: isDark ? "#475569" : "#E2E8F0",
    inputBg: isDark ? "#1E293B" : "#F8FAFC",
    inputText: isDark ? "#F8FAFC" : "#1E293B",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articleService.getAll().then((r) => r.data),
  });

  const { data: caisseData } = useQuery({
    queryKey: ["caisse-etat"],
    queryFn: () => caisseService.getEtat().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      articleService.create({
        ...form,
        prix_achat: parseInt(form.prix_achat) || 0,
        prix_unitaire: parseInt(form.prix_unitaire) || 0,
        nombre_pieces: parseInt(form.nombre_pieces) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setShowForm(false);
      setForm({
        designation: "",
        prix_achat: "",
        prix_unitaire: "",
        nombre_pieces: "",
      });
      setMessage("✅ Article ajouté avec succès");
    },
  });

  const soirMutation = useMutation({
    mutationFn: (id: number) =>
      articleService.updateSoir(id, parseInt(restant) || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setEditSoir(null);
      setRestant("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => articleService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
  });

  const articles: Article[] = data?.articles || [];
  const caisse = caisseData?.caisse || {};
  const isCloture = caisse?.statut === "cloture";

  const handleSoirSubmit = (id: number) => {
    if (!restant.trim()) return;
    soirMutation.mutate(id);
  };

  return (
    <View style={[s.main, { backgroundColor: dynamicStyles.mainBg }]}>
      <StatusBar
        style="light"
        translucent={false}
        backgroundColor={dynamicStyles.mainBg}
      />

      <View style={s.header}>
        <Text style={s.title}>🛍️ Articles</Text>
        <Text style={[s.subtitle, { color: isDark ? "#94A3B8" : "#BFDBFE" }]}>
          {isCloture ? "🔒 Session Clôturée" : "🟢 Session Ouverte"}
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
        {message ? <Text style={s.msg}>{message}</Text> : null}

        {!isCloture && (
          <TouchableOpacity
            style={s.btn}
            onPress={() => setShowForm(!showForm)}
            activeOpacity={0.8}
          >
            <Text style={s.btnText}>
              {showForm ? "✕ Fermer le formulaire" : "+ Ajouter un article"}
            </Text>
          </TouchableOpacity>
        )}

        {showForm && !isCloture && (
          <View
            style={[
              s.card,
              {
                backgroundColor: dynamicStyles.cardBg,
                borderColor: dynamicStyles.cardBorder,
              },
            ]}
          >
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: dynamicStyles.inputBg,
                  borderColor: dynamicStyles.cardBorder,
                  color: dynamicStyles.inputText,
                },
              ]}
              placeholder="Désignation"
              placeholderTextColor={dynamicStyles.textSub}
              value={form.designation}
              onChangeText={(v) => setForm({ ...form, designation: v })}
            />
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: dynamicStyles.inputBg,
                  borderColor: dynamicStyles.cardBorder,
                  color: dynamicStyles.inputText,
                },
              ]}
              placeholder="Prix d'achat total (FC)"
              placeholderTextColor={dynamicStyles.textSub}
              keyboardType="numeric"
              value={form.prix_achat}
              onChangeText={(v) => setForm({ ...form, prix_achat: v })}
            />
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: dynamicStyles.inputBg,
                  borderColor: dynamicStyles.cardBorder,
                  color: dynamicStyles.inputText,
                },
              ]}
              placeholder="Prix unitaire vente (FC)"
              placeholderTextColor={dynamicStyles.textSub}
              keyboardType="numeric"
              value={form.prix_unitaire}
              onChangeText={(v) => setForm({ ...form, prix_unitaire: v })}
            />
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: dynamicStyles.inputBg,
                  borderColor: dynamicStyles.cardBorder,
                  color: dynamicStyles.inputText,
                },
              ]}
              placeholder="Nombre de pièces"
              placeholderTextColor={dynamicStyles.textSub}
              keyboardType="numeric"
              value={form.nombre_pieces}
              onChangeText={(v) => setForm({ ...form, nombre_pieces: v })}
            />
            <TouchableOpacity
              style={s.btn}
              onPress={() => createMutation.mutate()}
              activeOpacity={0.8}
              disabled={createMutation.isPending}
            >
              <Text style={s.btnText}>
                {createMutation.isPending
                  ? "Enregistrement..."
                  : "💾 Enregistrer l'article"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[s.sectionTitle, { color: dynamicStyles.textMain }]}>
          📋 Articles du jour
        </Text>

        {articles.length === 0 ? (
          <Text style={s.empty}>Aucun article enregistré pour le moment.</Text>
        ) : (
          articles.map((a) => (
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
              <View style={s.row}>
                <Text style={[s.artName, { color: dynamicStyles.textMain }]}>
                  {a.designation}
                </Text>
                <Text style={s.artBenefice}>
                  {a.benefice > 0 ? `+${formatCurrency(a.benefice)}` : "—"}
                </Text>
              </View>

              <View style={s.row}>
                <Text style={[s.artInfo, { color: dynamicStyles.textSub }]}>
                  Achat: {formatCurrency(a.prix_achat)} • Vente:{" "}
                  {formatCurrency(a.prix_unitaire)}
                </Text>
              </View>

              <View style={s.row}>
                <Text style={[s.artInfo, { color: dynamicStyles.textSub }]}>
                  Pièces: {a.nombre_pieces} • Restant: {a.restant_soir ?? "?"}
                </Text>

                {a.restant_soir === null &&
                  !isCloture &&
                  (editSoir === a.id ? (
                    <View style={s.declareInlineForm}>
                      <TextInput
                        style={[
                          s.input,
                          s.inputInline,
                          {
                            backgroundColor: dynamicStyles.inputBg,
                            borderColor: dynamicStyles.cardBorder,
                            color: dynamicStyles.inputText,
                          },
                        ]}
                        keyboardType="numeric"
                        value={restant}
                        onChangeText={setRestant}
                        autoFocus
                        onSubmitEditing={() => handleSoirSubmit(a.id)}
                      />
                      <TouchableOpacity
                        onPress={() => handleSoirSubmit(a.id)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Text style={s.checkIcon}>✅</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setEditSoir(a.id);
                        setRestant("");
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: colors.primary,
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        🌆 Déclarer
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>

              {!isCloture && (
                <TouchableOpacity
                  onPress={() => deleteMutation.mutate(a.id)}
                  style={{ marginTop: 10, alignSelf: "flex-start" }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: colors.danger,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    🗑️ Supprimer
                  </Text>
                </TouchableOpacity>
              )}
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
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: "500" },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  msg: {
    color: colors.success,
    textAlign: "center",
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: "600",
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  btnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  inputInline: {
    width: 65,
    marginBottom: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  declareInlineForm: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkIcon: { fontSize: 18 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },
  empty: {
    textAlign: "center",
    color: "#94A3B8",
    paddingVertical: 30,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  artName: { fontSize: 14, fontWeight: "700" },
  artBenefice: { fontSize: 14, fontWeight: "800", color: colors.success },
  artInfo: { fontSize: 12 },
});
