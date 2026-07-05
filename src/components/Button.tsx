import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { colors, borderRadius, minButtonHeight } from "../theme";

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "danger" | "success" | "outline";
  fullWidth?: boolean;
}

export default function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  fullWidth,
}: Props) {
  const bg = {
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
    outline: "transparent",
  }[variant];
  const txt = variant === "outline" ? colors.primary : "#FFFFFF";

  return (
    <TouchableOpacity
      style={[
        s.btn,
        {
          backgroundColor: bg,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: colors.primary,
        },
        fullWidth && s.full,
        disabled && s.dis,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={txt} size="small" />
      ) : (
        <Text style={[s.txt, { color: txt }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: 20,
    minHeight: minButtonHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  full: { width: "100%" },
  txt: { fontSize: 15, fontWeight: "600" },
  dis: { opacity: 0.5 },
});
