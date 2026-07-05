import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Text } from "react-native";
import DashboardScreen from "../screens/DashboardScreen";
import StocksScreen from "../screens/StocksScreen";
import MMScreen from "../screens/MMScreen";
import CaisseScreen from "../screens/CaisseScreen";
import PlusScreen from "../screens/PlusScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();
const Icon = ({ e, f }: { e: string; f: boolean }) => (
  <Text style={{ fontSize: 22, opacity: f ? 1 : 0.5 }}>{e}</Text>
);

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
        }}
      >
        <Tab.Screen
          name="Accueil"
          component={DashboardScreen}
          options={{ tabBarIcon: ({ focused }) => <Icon e="🏠" f={focused} /> }}
        />
        <Tab.Screen
          name="Stocks"
          component={StocksScreen}
          options={{ tabBarIcon: ({ focused }) => <Icon e="📦" f={focused} /> }}
        />
        <Tab.Screen
          name="MM"
          component={MMScreen}
          options={{ tabBarIcon: ({ focused }) => <Icon e="📱" f={focused} /> }}
        />
        <Tab.Screen
          name="Caisse"
          component={CaisseScreen}
          options={{ tabBarIcon: ({ focused }) => <Icon e="💵" f={focused} /> }}
        />
        <Tab.Screen
          name="Plus"
          component={PlusScreen}
          options={{ tabBarIcon: ({ focused }) => <Icon e="⚙️" f={focused} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
