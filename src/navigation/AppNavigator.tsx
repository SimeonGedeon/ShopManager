// src/navigation/AppNavigator.tsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { Text, useColorScheme } from "react-native";
import DashboardScreen from "../screens/DashboardScreen";
import StocksScreen from "../screens/StocksScreen";
import MMScreen from "../screens/MMScreen";
import CaisseScreen from "../screens/CaisseScreen";
import PlusScreen from "../screens/PlusScreen";
import ArticlesScreen from "../screens/ArticlesScreen";
import ObjectifsScreen from "../screens/ObjectifsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ArchivesScreen from "../screens/ArchivesScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();
const PlusStack = createNativeStackNavigator();

// Composant d'icône épuré avec gestion de l'opacité
const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
);

function PlusStackScreen() {
  return (
    <PlusStack.Navigator screenOptions={{ headerShown: false }}>
      <PlusStack.Screen name="PlusMenu" component={PlusScreen} />
      <PlusStack.Screen name="Articles" component={ArticlesScreen} />
      <PlusStack.Screen name="Objectifs" component={ObjectifsScreen} />
      <PlusStack.Screen name="Settings" component={SettingsScreen} />
      <PlusStack.Screen name="Archives" component={ArchivesScreen} />
    </PlusStack.Navigator>
  );
}

export default function AppNavigator() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  // Palette adaptative pour la structure de navigation basse
  const navStyles = {
    tabBarBg: isDark ? "#1E293B" : "#FFFFFF",
    tabBarBorder: isDark ? "#334155" : "#E2E8F0",
    inactiveText: isDark ? "#94A3B8" : "#64748B",
  };

  // Thèmes globaux personnalisés pour éviter les flashs de fonds d'écrans natifs
  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#F1F5F9",
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#1E293B",
    },
  };

  return (
    <NavigationContainer theme={isDark ? customDarkTheme : customLightTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: navStyles.inactiveText,
          tabBarStyle: {
            backgroundColor: navStyles.tabBarBg,
            borderTopColor: navStyles.tabBarBorder,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 3,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 0.2,
          },
        }}
      >
        <Tab.Screen
          name="Accueil"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🏠" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Stocks"
          component={StocksScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📦" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="MM"
          component={MMScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📱" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Caisse"
          component={CaisseScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="💵" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Plus"
          component={PlusStackScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="⚙️" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
