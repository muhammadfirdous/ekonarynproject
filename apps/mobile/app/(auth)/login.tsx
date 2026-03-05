import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { colors } from '../../src/lib/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('+996');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!phone || !password) return;
    setLoading(true);
    try {
      const user = await login(phone, password);
      if (user.role === 'WORKER') {
        router.replace('/(worker)/today');
      } else {
        router.replace('/(resident)/home');
      }
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        style={{ backgroundColor: colors.background }}
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 64, height: 64, backgroundColor: colors.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 28, color: colors.white }}>♻️</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>Эко Нарын</Text>
          <Text style={{ fontSize: 14, color: colors.gray, marginTop: 4 }}>Вход в приложение</Text>
        </View>

        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Телефон</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+996700000001"
            keyboardType="phone-pad"
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 }}
          />

          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Пароль</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••"
            secureTextEntry
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 24 }}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{ backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
              {loading ? 'Вход...' : 'Войти'}
            </Text>
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.gray }}>
              Нет аккаунта? <Text style={{ color: colors.primary, fontWeight: '600' }}>Регистрация</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
