import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors, spacing } from '../theme';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => authService.login({ login, password }),
    onSuccess: async (res) => {
      await AsyncStorage.setItem('@shop_token', res.data.token);
      await AsyncStorage.setItem('@shop_user', JSON.stringify(res.data.user));
      onLogin();
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Erreur'),
  });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.card}>
        <Text style={s.title}>Shop Manager</Text>
        <Text style={s.sub}>Connexion</Text>
        {error ? <Text style={s.err}>{error}</Text> : null}
        <Input label="Email ou Téléphone" value={login} onChangeText={setLogin} placeholder="admin@shop.com" />
        <Input label="Mot de passe" value={password} onChangeText={setPassword} placeholder="••••••••" />
        <Button label="Se connecter" onPress={() => mutation.mutate()} loading={mutation.isPending} fullWidth />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  sub: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, marginTop: spacing.xs },
  err: { color: colors.danger, textAlign: 'center', marginBottom: spacing.md, fontSize: 14 },
});