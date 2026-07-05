import { View, Text, StyleSheet } from "react-native";
import { colors, borderRadius, spacing } from "../theme";

interface Props {
  label: string;
  value: string;
  bg?: string;
  color?: string;
}

export default function Card({
  label,
  value,
  bg = colors.surface,
  color = colors.text,
}: Props) {
  return (
    <View style={[s.card, { backgroundColor: bg }]}>
      <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[s.value, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 72,
    justifyContent: "center",
  },
  label: { fontSize: 12, marginBottom: spacing.xs },
  value: { fontSize: 18, fontWeight: "bold" },
});
