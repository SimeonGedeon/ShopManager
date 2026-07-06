// src/screens/SettingsScreen.tsx

import React, { useState, useEffect } from "react";
import {
  ScrollView,
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
import { settingsService } from "../api/client";
import { colors, spacing } from "../theme";

interface SettingsForm {
  objectif_hebdomadaire: string;
  prix_vente_unitaire: string;
  seuil_alerte_stock: string;
  seuil_alerte_ecart: string;
  seuil_max_dette: string;
  taux_achat_fc: string;
  taux_echange_fc: string;
  unites_par_10usd: string;
}

const SAFE_TOP_SPACE =
  Platform.OS === "ios" ? 44 : RNStatusBar.currentHeight || 0;

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const [form, setForm] = useState<SettingsForm>({
    objectif_hebdomadaire: "",
    prix_vente_unitaire: "",
    seuil_alerte_stock: "",
    seuil_alerte_ecart: "",
    seuil_max_dette: "",
    taux_achat_fc: "",
    taux_echange_fc: "",
    unites_par_10usd: "",
  });
  const [message, setMessage] = useState("");

  // Nettoyage automatique des messages de succès
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Palette sémantique adaptative (Charte graphique)
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

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.get().then((r) => r.data),
  });

  const { data: tauxData } = useQuery({
    queryKey: ["taux"],
    queryFn: () => settingsService.getTaux().then((r) => r.data),
  });

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setForm((prev) => ({
        ...prev,
        objectif_hebdomadaire: String(s.objectif_hebdomadaire ?? ""),
        prix_vente_unitaire: String(s.prix_vente_unitaire ?? ""),
        seuil_alerte_stock: String(s.seuil_alerte_stock ?? ""),
        seuil_alerte_ecart: String(s.seuil_alerte_ecart ?? ""),
        seuil_max_dette: String(s.seuil_max_dette ?? ""),
      }));
    }
  }, [data]);

  useEffect(() => {
    if (tauxData?.taux) {
      const t = tauxData.taux;
      setForm((prev) => ({
        ...prev,
        taux_achat_fc: String(t.taux_achat_fc ?? ""),
        taux_echange_fc: String(t.taux_echange_fc ?? ""),
        unites_par_10usd: String(t.unites_par_10usd ?? ""),
      }));
    }
  }, [tauxData]);

  const mutation = useMutation({
    mutationFn: () =>
      settingsService.update({
        objectif_hebdomadaire: parseInt(form.objectif_hebdomadaire) || 0,
        prix_vente_unitaire: parseInt(form.prix_vente_unitaire) || 0,
        seuil_alerte_stock: parseInt(form.seuil_alerte_stock) || 0,
        seuil_alerte_ecart: parseInt(form.seuil_alerte_ecart) || 0,
        seuil_max_dette: parseInt(form.seuil_max_dette) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setMessage("✅ Paramètres généraux enregistrés");
    },
  });

  const tauxMutation = useMutation({
    mutationFn: () =>
      settingsService.updateTaux({
        taux_achat_fc: parseInt(form.taux_achat_fc) || 0,
        taux_echange_fc: parseInt(form.taux_echange_fc) || 0,
        unites_par_10usd: parseInt(form.unites_par_10usd) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taux"] });
      setMessage("✅ Taux de change mis à jour");
    },
  });

  const fields: { key: keyof SettingsForm; label: string }[] = [
    { key: "objectif_hebdomadaire", label: "Objectif hebdo (FC)" },
    { key: "prix_vente_unitaire", label: "Prix vente unitaire (FC)" },
    { key: "seuil_alerte_stock", label: "Seuil alerte stock" },
    { key: "seuil_alerte_ecart", label: "Seuil alerte écart (FC)" },
    { key: "seuil_max_dette", label: "Seuil max dettes/jour (FC)" },
  ];

  const tauxFields: { key: keyof SettingsForm; label: string }[] = [
    { key: "taux_achat_fc", label: "Taux d'achat (FC)" },
    { key: "taux_echange_fc", label: "Taux d'échange (FC)" },
    { key: "unites_par_10usd", label: "Unités / 10 USD" },
  ];

  return (
    <View style={[s.main, { backgroundColor: dynamicStyles.mainBg }]}>
      <StatusBar
        style="light"
        translucent={false}
        backgroundColor={dynamicStyles.mainBg}
      />

      <View style={s.header}>
        <Text style={s.title}>⚙️ Paramètres</Text>
      </View>

      <ScrollView
        style={[s.content, { backgroundColor: dynamicStyles.contentBg }]}
        showsVerticalScrollIndicator={false}
      >
        {message ? <Text style={s.msg}>{message}</Text> : null}

        {/* Configuration Générale */}
        <View
          style={[
            s.card,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.cardBorder,
            },
          ]}
        >
          <Text style={[s.cardTitle, { color: dynamicStyles.textMain }]}>
            ⚙️ Général
          </Text>

          {fields.map((f) => (
            <View key={f.key} style={s.inputRow}>
              <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                {f.label}
              </Text>
              <TextInput
                style={[
                  s.input,
                  {
                    backgroundColor: dynamicStyles.inputBg,
                    borderColor: dynamicStyles.cardBorder,
                    color: dynamicStyles.inputText,
                  },
                ]}
                keyboardType="numeric"
                value={form[f.key]}
                onChangeText={(v) => setForm({ ...form, [f.key]: v })}
              />
            </View>
          ))}

          <TouchableOpacity
            style={s.btn}
            onPress={() => mutation.mutate()}
            activeOpacity={0.8}
            disabled={mutation.isPending}
          >
            <Text style={s.btnText}>
              {mutation.isPending ? "Enregistrement..." : "💾 Enregistrer"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Configuration Financière / Taux */}
        <View
          style={[
            s.card,
            {
              backgroundColor: dynamicStyles.cardBg,
              borderColor: dynamicStyles.cardBorder,
            },
          ]}
        >
          <Text style={[s.cardTitle, { color: dynamicStyles.textMain }]}>
            💱 Taux de change
          </Text>

          {tauxFields.map((f) => (
            <View key={f.key} style={s.inputRow}>
              <Text style={[s.lbl, { color: dynamicStyles.textSub }]}>
                {f.label}
              </Text>
              <TextInput
                style={[
                  s.input,
                  {
                    backgroundColor: dynamicStyles.inputBg,
                    borderColor: dynamicStyles.cardBorder,
                    color: dynamicStyles.inputText,
                  },
                ]}
                keyboardType="numeric"
                value={form[f.key]}
                onChangeText={(v) => setForm({ ...form, [f.key]: v })}
              />
            </View>
          ))}

          <TouchableOpacity
            style={s.btn}
            onPress={() => tauxMutation.mutate()}
            activeOpacity={0.8}
            disabled={tauxMutation.isPending}
          >
            <Text style={s.btnText}>
              {tauxMutation.isPending ? "Mise à jour..." : "💾 Mettre à jour"}
            </Text>
          </TouchableOpacity>
        </View>

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
  msg: {
    color: colors.success,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  lbl: { fontSize: 13, flex: 1, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    width: 120,
    textAlign: "right",
    fontWeight: "600",
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
  btnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
