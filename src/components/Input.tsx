// src/components/Input.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { colors, borderRadius, spacing, minButtonHeight } from "../theme";

// On hérite de toutes les propriétés standard d'un TextInput de React Native
interface Props extends TextInputProps {
  label: string;
}

export default function Input({
  label,
  style,
  editable = true,
  ...restOfProps // Regroupe value, onChangeText, placeholder, secureTextEntry, etc.
}: Props) {
  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, !editable && s.disabled, style]}
        editable={editable}
        placeholderTextColor={colors.textSecondary}
        {...restOfProps} // Injecte automatiquement toutes les props restantes au vrai TextInput
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    minHeight: minButtonHeight,
  },
  disabled: { backgroundColor: "#F3F4F6", color: colors.textSecondary },
});
