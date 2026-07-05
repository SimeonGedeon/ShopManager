import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';

const queryClient = new QueryClient();

export default function App() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@shop_token').then(t => setIsAuth(!!t));
  }, []);

  if (isAuth === null) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;

  return (
    <QueryClientProvider client={queryClient}>
      {isAuth ? <AppNavigator /> : <LoginScreen onLogin={() => setIsAuth(true)} />}
    </QueryClientProvider>
  );
}
