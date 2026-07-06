// src/components/ScreenContainer.tsx
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
  StatusBar as RNStatusBar,
  ScrollViewProps,
} from "react-native";
import { StatusBar } from "expo-status-bar";

interface ScreenContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  headerComponent?: React.ReactNode;
}

const SAFE_TOP_SPACE =
  Platform.OS === "ios" ? 44 : RNStatusBar.currentHeight || 0;

export default function ScreenContainer({
  children,
  headerComponent,
  ...scrollViewProps
}: ScreenContainerProps) {
  const isDark = useColorScheme() === "dark";

  const dynamicStyles = {
    mainBg: isDark ? "#0F172A" : "#1E3A8A",
    contentBg: isDark ? "#1E293B" : "#F1F5F9",
  };

  return (
    <KeyboardAvoidingView
      style={[s.metaContainer, { backgroundColor: dynamicStyles.mainBg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar
        style="light"
        backgroundColor={dynamicStyles.mainBg}
        translucent={false}
      />

      {headerComponent && (
        <View style={[s.header, { paddingTop: 15 + SAFE_TOP_SPACE }]}>
          {headerComponent}
        </View>
      )}

      <ScrollView
        style={[s.content, { backgroundColor: dynamicStyles.contentBg }]}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        {...scrollViewProps}
      >
        {children}
        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  metaContainer: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 25 },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
